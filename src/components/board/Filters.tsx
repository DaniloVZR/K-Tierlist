import { Search } from "lucide-react";
import { useTierBoardStore } from "../../store/useTierBoardStore";
import type { Song, Tier } from "../../types";

export function Filters({ songs, tiers }: { songs: Song[]; tiers: Tier[] }) {
  const query = useTierBoardStore((state) => state.query);
  const artistFilter = useTierBoardStore((state) => state.artistFilter);
  const tierFilter = useTierBoardStore((state) => state.tierFilter);
  const setQuery = useTierBoardStore((state) => state.setQuery);
  const setArtistFilter = useTierBoardStore((state) => state.setArtistFilter);
  const setTierFilter = useTierBoardStore((state) => state.setTierFilter);
  const artists = [...new Set(songs.map((song) => song.artist))].sort();

  return (
    <div className="filters">
      <label className="search-field">
        <Search size={16} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar canción, artista o álbum"
        />
      </label>
      <select value={artistFilter} onChange={(event) => setArtistFilter(event.target.value)}>
        <option value="all">Todos los artistas</option>
        {artists.map((artist) => (
          <option key={artist} value={artist}>
            {artist}
          </option>
        ))}
      </select>
      <select value={tierFilter} onChange={(event) => setTierFilter(event.target.value)}>
        <option value="all">Todos los tiers</option>
        <option value="unranked">Sin clasificar</option>
        {tiers.map((tier) => (
          <option key={tier.id} value={tier.id}>
            {tier.name}
          </option>
        ))}
      </select>
    </div>
  );
}
