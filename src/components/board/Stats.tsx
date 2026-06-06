import { useState } from "react";
import { ChartColumn, Layers, Users, ChevronDown, ChevronRight } from "lucide-react";
import { getSongsForTier } from "../../store/selectors";
import type { Song, Tier } from "../../types";

export function Stats({ songs, tiers }: { songs: Song[]; tiers: Tier[] }) {
  const [tiersOpen, setTiersOpen] = useState(true);
  const [artistsOpen, setArtistsOpen] = useState(true);

  const allArtists = [...songs]
    .reduce<Map<string, number>>((map, song) => {
      map.set(song.artist, (map.get(song.artist) ?? 0) + 1);
      return map;
    }, new Map())
    .entries();
  const artistRows = [...allArtists].sort((a, b) => b[1] - a[1]);

  return (
    <section className="stats-panel">
      <h3 className="stats-main-title">
        <ChartColumn size={18} />
        Estadísticas
      </h3>

      <div className="stats-section">
        <div className="stat-block">
          <span>Total canciones</span>
          <strong>{songs.length}</strong>
        </div>
      </div>

      <div className="stats-section">
        <h4
          className="stats-section-title clickable"
          onClick={() => setTiersOpen(!tiersOpen)}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", userSelect: "none" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Layers size={15} />
            Canciones por Tier
          </span>
          {tiersOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </h4>
        {tiersOpen && (
          <div className="stat-visual-list">
            {tiers.map((tier) => {
              const count = getSongsForTier(songs, tier.id).length;
              const pct = songs.length > 0 ? (count / songs.length) * 100 : 0;
              return (
                <div key={tier.id} className="stat-row">
                  <div className="stat-row-info">
                    <span className="stat-name-label" style={{ fontWeight: 600 }}>{tier.name}</span>
                    <strong>{count}</strong>
                  </div>
                  <div className="stat-progress-bg">
                    <div
                      className="stat-progress-fill"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: tier.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="stats-section">
        <h4
          className="stats-section-title clickable"
          onClick={() => setArtistsOpen(!artistsOpen)}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", userSelect: "none" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Users size={15} />
            Canciones por Grupo / Artista
          </span>
          {artistsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </h4>
        {artistsOpen && (
          <div className="stat-visual-list scrollable">
            {artistRows.length ? (
              artistRows.map(([artist, count]) => {
                const pct = songs.length > 0 ? (count / songs.length) * 100 : 0;
                return (
                  <div key={artist} className="stat-row">
                    <div className="stat-row-info">
                      <span className="stat-name-label">{artist}</span>
                      <strong>{count}</strong>
                    </div>
                    <div className="stat-progress-bg">
                      <div
                        className="stat-progress-fill artist-fill"
                        style={{
                          width: `${pct}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="muted">No hay canciones agregadas aún.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
