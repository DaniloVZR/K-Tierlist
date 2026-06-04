import type { Song } from "../../types";

export function SongCardView({ song, compact = false }: { song: Song; compact?: boolean }) {
  return (
    <div className={compact ? "song-copy compact" : "song-copy"}>
      <strong>{song.title}</strong>
      <span>{song.featuring ? `${song.artist} · ${song.featuring}` : song.artist}</span>
      {song.album ? <small>{song.album}</small> : null}
    </div>
  );
}
