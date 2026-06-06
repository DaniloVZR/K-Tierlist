import type { Song } from "../../types";

export function SongCardView({
  song,
  compact = false,
  rank,
}: {
  song: Song;
  compact?: boolean;
  rank?: number;
}) {
  let rankClass = "";
  if (rank === 1) rankClass = " rank-1";
  else if (rank === 2) rankClass = " rank-2";
  else if (rank === 3) rankClass = " rank-3";
  else if (rank !== undefined && rank >= 4 && rank <= 10) rankClass = " rank-top10";

  return (
    <div className="song-card-content" style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
      {rank !== undefined ? (
        <span className={`song-rank-badge${rankClass}`}>
          #{rank}
        </span>
      ) : null}
      <div className={compact ? "song-copy compact" : "song-copy"} style={{ flex: 1, minWidth: 0 }}>
        <strong>{song.title}</strong>
        <span>{song.featuring ? `${song.artist} · ${song.featuring}` : song.artist}</span>
        {song.album ? <small>{song.album}</small> : null}
      </div>
    </div>
  );
}
