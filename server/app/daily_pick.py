"""The daily round's songs, picked on the server — the same pick as the app's
game/daily.ts `dailySongs` (a test runs both and compares), so nobody can hand
the server a list of their own. The pool is the well-known songs of the
bundled catalogue (daily_pool.json, written by sync-songs-ts.js).

Seeded shuffle: FNV-1a of "mxtape-daily-<day>" seeds mulberry32; the pool is
ordered by id first so every device and the server shuffle the same list.
Distinct years while there are enough, then the rest in shuffled order.
"""

import json
import sys
from functools import lru_cache
from pathlib import Path

POOL_FILE = Path(__file__).with_name("daily_pool.json")
M32 = 0xFFFFFFFF


@lru_cache(maxsize=1)
def pool() -> tuple:
    return tuple((s["id"], s["year"]) for s in json.loads(POOL_FILE.read_text("utf-8")))


def _seed(text: str) -> int:
    h = 0x811C9DC5
    for unit in text.encode("utf-16-le")[::2]:  # the day string is ASCII: one code unit per char
        h ^= unit
        h = (h * 0x01000193) & M32
    return h


def _random(seed: int):
    a = seed & M32

    def nxt() -> float:
        nonlocal a
        a = (a + 0x6D2B79F5) & M32
        t = ((a ^ (a >> 15)) * (1 | a)) & M32
        t = (((t + (((t ^ (t >> 7)) * (61 | t)) & M32)) & M32) ^ t) & M32
        return ((t ^ (t >> 14)) & M32) / 4294967296

    return nxt


def daily_ids(day: str, total: int, songs: tuple | None = None) -> list[str]:
    """The ids of the day's round in playing order: start card + songs, `total` in all."""
    items = sorted(songs if songs is not None else pool(), key=lambda s: s[0])
    rand = _random(_seed(f"mxtape-daily-{day}"))
    for i in range(len(items) - 1, 0, -1):
        j = int(rand() * (i + 1))
        items[i], items[j] = items[j], items[i]
    out: list[str] = []
    years: set[int] = set()
    for song_id, year in items:
        if year in years:
            continue
        years.add(year)
        out.append(song_id)
        if len(out) == total:
            return out
    for song_id, _ in items:
        if len(out) == total:
            break
        if song_id not in out:
            out.append(song_id)
    return out


if __name__ == "__main__":  # used by the app's test to compare with dailySongs
    print(json.dumps(daily_ids(sys.argv[1], int(sys.argv[2]))))
