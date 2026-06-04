import { BarChart3 } from "lucide-react";
import { getSongsForTier } from "../../store/selectors";
import type { Song, Tier } from "../../types";

export function Stats({ songs, tiers }: { songs: Song[]; tiers: Tier[] }) {
  const topArtists = [...songs]
    .reduce<Map<string, number>>((map, song) => {
      map.set(song.artist, (map.get(song.artist) ?? 0) + 1);
      return map;
    }, new Map())
    .entries();
  const artistRows = [...topArtists].sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <section className="stats-panel">
      <h3>
        <BarChart3 size={18} />
        Estadísticas
      </h3>
      <div className="stat-block">
        <span>Total canciones</span>
        <strong>{songs.length}</strong>
      </div>
      <div className="stat-list">
        {tiers.map((tier) => (
          <div key={tier.id}>
            <span>{tier.name}</span>
            <strong>{getSongsForTier(songs, tier.id).length}</strong>
          </div>
        ))}
      </div>
      <div className="stat-list">
        {artistRows.map(([artist, count]) => (
          <div key={artist}>
            <span>{artist}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
