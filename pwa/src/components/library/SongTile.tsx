/**
 * One song in the library: a cover tile (grid) or a compact row (list).
 * Both are buttons that open the song's detail sheet.
 */
import type { Song } from '@/types'
import { SongCover } from '@/components/game/SongInfo'
import { Icon } from '@/components/ui/Icon'
import { useMessages } from '@/i18n'
import { libraryText } from '@/i18n/messages/library'

interface Props {
  song: Song
  onOpen: (song: Song) => void
}

export function SongTile({ song, onOpen }: Props) {
  const t = useMessages(libraryText)
  return (
    <button
      type="button"
      onClick={() => onOpen(song)}
      className="group w-full text-left rounded-m3-lg p-1.5 -m-1.5 m3-state-layer focus-visible:outline-2"
      aria-label={t.openSong(song.title, song.artist, song.year)}
      data-song-tile
    >
      <span className="relative block aspect-square overflow-hidden rounded-m3-md shadow-m3-1 [&>span:first-child]:!w-full [&>span:first-child]:!h-full [&>span:first-child]:!rounded-none transition-transform duration-m3-spatial-fast ease-m3-spatial-fast group-hover:scale-[1.03] group-active:scale-[0.97]">
        <SongCover song={song} size={160} />
        <span className="absolute left-1.5 bottom-1.5 rounded-m3-sm bg-md-surface/85 backdrop-blur-sm px-1.5 py-0.5 text-title-sm num-poster text-md-on-surface">
          {song.year}
        </span>
        {song.exotic && (
          <span className="absolute right-1.5 top-1.5 rounded-m3-full bg-md-tertiary-container text-md-on-tertiary-container px-2 py-0.5 text-label-sm">
            {t.exotic}
          </span>
        )}
      </span>
      <span className="block mt-2 text-title-sm text-md-on-surface line-clamp-2">{song.title}</span>
      <span className="block text-body-sm text-md-on-surface-variant truncate">{song.artist}</span>
    </button>
  )
}

export function SongRow({ song, onOpen }: Props) {
  const t = useMessages(libraryText)
  return (
    <button
      type="button"
      onClick={() => onOpen(song)}
      className="row w-full flex items-center gap-3 px-3 py-2 text-left m3-state-layer"
      aria-label={t.openSong(song.title, song.artist, song.year)}
      data-song-row
    >
      <span className="flex-shrink-0 w-[4.25rem] h-10 grid place-items-center rounded-m3-md bg-md-surface-container-highest text-title-md num-poster">
        {song.year}
      </span>
      <SongCover song={song} size={44} />
      <span className="min-w-0 flex-1">
        <span className="block text-title-sm truncate">{song.title}</span>
        <span className="block text-body-sm text-md-on-surface-variant truncate">
          {song.artist}
          {song.exotic ? ` · ${t.exotic}` : ''}
        </span>
      </span>
      <Icon name="chevron" size={20} className="text-md-on-surface-variant" />
    </button>
  )
}
