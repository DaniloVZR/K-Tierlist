import type { Song } from "../../types";

export function AllSongsPanel({ songs }: { songs: Song[] }) {
  const sortedSongs = [...songs].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

  return (
    <section className="all-songs-panel">
      <div className="panel-title">
        <h3>Todas las canciones</h3>
        <span>{songs.length}</span>
      </div>
      <div className="all-song-list">
        {sortedSongs.length ? (
          sortedSongs.map((song, index) => (
            <article className="song-list-item" key={song.id}>
              <span className="song-list-number">
                {index + 1}
              </span>
              <div className="song-copy">
                <strong>{song.title}</strong>
                <span>{song.featuring ? `${song.artist} · ${song.featuring}` : song.artist}</span>
                {song.album ? <small>{song.album}</small> : null}
              </div>
            </article>
          ))
        ) : (
          <p className="muted">Agrega canciones para ver aquí el listado completo del año.</p>
        )}
      </div>
    </section>
  );
}
