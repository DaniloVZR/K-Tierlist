import type { Song, TierList } from "../types";

export function getActiveTierList(tierLists: TierList[], activeTierListId: string | null) {
  if (!activeTierListId) {
    return undefined;
  }

  return tierLists.find((tierList) => tierList.id === activeTierListId);
}

export function getSongsForTier(songs: Song[], tierId: string | null) {
  return songs.filter((song) => (song.tierId ?? null) === tierId);
}

export function getVisibleSongs(
  songs: Song[],
  query: string,
  artistFilter: string,
  tierFilter: string,
) {
  const normalizedQuery = query.trim().toLowerCase();

  return songs.filter((song) => {
    const haystack = [song.title, song.artist, song.featuring, song.album]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesSearch = !normalizedQuery || haystack.includes(normalizedQuery);
    const matchesArtist = artistFilter === "all" || song.artist === artistFilter;
    const songTier = song.tierId ?? "unranked";
    const matchesTier = tierFilter === "all" || songTier === tierFilter;

    return matchesSearch && matchesArtist && matchesTier;
  });
}
