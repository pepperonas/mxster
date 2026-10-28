"""Live connections per room (in memory; the service runs one uvicorn worker).

The host's device runs the game. The hub only relays: snapshots and audio
cues from the host to everyone, intents from players to the host — stamped
with the sender's real seat, so nobody can act for someone else.
"""

import asyncio
import contextlib
import time

from fastapi import WebSocket


def now_ms() -> int:
    return int(time.time() * 1000)


class Hub:
    def __init__(self) -> None:
        self.sockets: dict[str, dict[int, WebSocket]] = {}
        # Last audio cue per room, so a late (re)joiner starts in sync
        self.audio: dict[str, dict] = {}
        # Seat whose device runs the game (mirrors rooms.host_seat)
        self.host_seat: dict[str, int] = {}
        # When a seat's connection went away (monotonic), for the host takeover
        self.gone_since: dict[tuple[str, int], float] = {}
        self._lock = asyncio.Lock()

    def online(self, code: str) -> set[int]:
        return set(self.sockets.get(code, {}))

    async def attach(self, code: str, seat: int, ws: WebSocket) -> None:
        async with self._lock:
            old = self.sockets.setdefault(code, {}).get(seat)
            self.sockets[code][seat] = ws
            self.gone_since.pop((code, seat), None)
        if old is not None and old is not ws:
            # One connection per seat: a reload or a second tab takes over
            with contextlib.suppress(Exception):
                await old.close(code=4000, reason="replaced")

    async def detach(self, code: str, seat: int, ws: WebSocket) -> None:
        async with self._lock:
            room = self.sockets.get(code, {})
            if room.get(seat) is ws:
                del room[seat]
                self.gone_since[(code, seat)] = time.monotonic()
            if not room:
                self.sockets.pop(code, None)

    def offline_for(self, code: str, seat: int) -> float | None:
        """Seconds the seat has been without a connection; None while it is
        connected. Nothing known (e.g. right after a server restart) counts as
        "just gone": the clock starts now, so nobody can take over before the
        host had a fair chance to reconnect."""
        if seat in self.sockets.get(code, {}):
            return None
        since = self.gone_since.setdefault((code, seat), time.monotonic())
        return time.monotonic() - since

    async def send(self, code: str, seat: int, msg: dict) -> bool:
        ws = self.sockets.get(code, {}).get(seat)
        if ws is None:
            return False
        try:
            await ws.send_json(msg)
            return True
        except Exception:
            return False

    async def broadcast(self, code: str, msg: dict, exclude: int | None = None) -> None:
        for seat, ws in list(self.sockets.get(code, {}).items()):
            if seat == exclude:
                continue
            with contextlib.suppress(Exception):
                await ws.send_json(msg)

    async def close_seat(self, code: str, seat: int, reason: str) -> None:
        ws = self.sockets.get(code, {}).get(seat)
        if ws is not None:
            with contextlib.suppress(Exception):
                await ws.send_json({"type": "closed", "reason": reason})
                await ws.close(code=4003, reason=reason)

    async def close_room(self, code: str, reason: str) -> None:
        for seat in list(self.sockets.get(code, {})):
            await self.close_seat(code, seat, reason)
        self.audio.pop(code, None)
        self.host_seat.pop(code, None)


hub = Hub()
