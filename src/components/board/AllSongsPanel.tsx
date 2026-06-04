import type { Song } from "../../types";

export function AllSongsPanel({ songs }: { songs: Song[] }) {
  return (
    <section className="all-songs-panel">
      <div className="panel-title">
        <h3>Todas las canciones</h3>
        <span>{songs.length}</span>
      </div>
      <div className="all-song-list">
        {songs.length ? (
          songs.map((song) => (
            <article className="song-list-item" key={song.id}>
              <strong>{song.title}</strong>
              <span>{song.artist}</span>
            </article>
          ))
        ) : (
          <p className="muted">Agrega canciones para ver aquí el listado completo del año.</p>
        )}
      </div>
    </section>
  );
}
