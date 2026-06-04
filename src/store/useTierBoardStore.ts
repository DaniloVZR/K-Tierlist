import { create } from "zustand";
import { persist } from "zustand/middleware";
import { emptyTierBoard, tierPalette } from "../data/defaults";
import type { Song, SongInput, TierList, TierListInput } from "../types";
import { createId } from "../utils/id";

interface TierBoardState {
  tierLists: TierList[];
  activeTierListId: string | null;
  query: string;
  artistFilter: string;
  tierFilter: string;
  createTierList: (input: TierListInput) => string;
  updateTierList: (tierListId: string, input: TierListInput) => void;
  deleteTierList: (tierListId: string) => void;
  selectTierList: (tierListId: string | null) => void;
  addTier: (name: string) => void;
  updateTier: (tierId: string, name: string, color: string) => void;
  deleteTier: (tierId: string) => void;
  addSong: (input: SongInput) => void;
  updateSong: (songId: string, input: SongInput) => void;
  deleteSong: (songId: string) => void;
  moveSong: (songId: string, targetTierId: string | null, beforeSongId?: string) => void;
  setQuery: (query: string) => void;
  setArtistFilter: (artist: string) => void;
  setTierFilter: (tierId: string) => void;
}

function normalizeInput(input: SongInput): Omit<Song, "id" | "tierId"> {
  return {
    title: input.title.trim(),
    artist: input.artist.trim(),
    featuring: input.featuring.trim() || undefined,
    album: input.album.trim() || undefined,
  };
}

function updateActiveList(
  state: TierBoardState,
  updater: (tierList: TierList) => TierList,
) {
  if (!state.activeTierListId) {
    return {};
  }

  return {
    tierLists: state.tierLists.map((tierList) =>
      tierList.id === state.activeTierListId ? updater(tierList) : tierList,
    ),
  };
}

export const useTierBoardStore = create<TierBoardState>()(
  persist(
    (set) => ({
      ...emptyTierBoard,
      query: "",
      artistFilter: "all",
      tierFilter: "all",
      createTierList: (input) => {
        const id = createId("list");
        set((state) => ({
          tierLists: [
            ...state.tierLists,
            {
              id,
              name: input.name.trim(),
              year: input.year.trim(),
              tiers: [],
              songs: [],
            },
          ],
          activeTierListId: id,
          query: "",
          artistFilter: "all",
          tierFilter: "all",
        }));
        return id;
      },
      updateTierList: (tierListId, input) =>
        set((state) => ({
          tierLists: state.tierLists.map((tierList) =>
            tierList.id === tierListId
              ? {
                  ...tierList,
                  name: input.name.trim() || tierList.name,
                  year: input.year.trim() || tierList.year,
                }
              : tierList,
          ),
        })),
      deleteTierList: (tierListId) =>
        set((state) => {
          const nextTierLists = state.tierLists.filter((tierList) => tierList.id !== tierListId);
          return {
            tierLists: nextTierLists,
            activeTierListId:
              state.activeTierListId === tierListId ? null : state.activeTierListId,
          };
        }),
      selectTierList: (activeTierListId) =>
        set({
          activeTierListId,
          query: "",
          artistFilter: "all",
          tierFilter: "all",
        }),
      addTier: (name) =>
        set((state) =>
          updateActiveList(state, (tierList) => {
            const trimmedName = name.trim();
            if (!trimmedName) {
              return tierList;
            }

            return {
              ...tierList,
              tiers: [
                ...tierList.tiers,
                {
                  id: createId("tier"),
                  name: trimmedName,
                  order: tierList.tiers.length,
                  color: tierPalette[tierList.tiers.length % tierPalette.length],
                },
              ],
            };
          }),
        ),
      updateTier: (tierId, name, color) =>
        set((state) =>
          updateActiveList(state, (tierList) => ({
            ...tierList,
            tiers: tierList.tiers.map((tier) =>
              tier.id === tierId ? { ...tier, name: name.trim() || tier.name, color } : tier,
            ),
          })),
        ),
      deleteTier: (tierId) =>
        set((state) => {
          if (!state.activeTierListId) {
            return {};
          }

          return {
            tierLists: state.tierLists.map((tierList) =>
              tierList.id === state.activeTierListId
                ? {
                    ...tierList,
                    tiers: tierList.tiers
                      .filter((tier) => tier.id !== tierId)
                      .map((tier, order) => ({ ...tier, order })),
                    songs: tierList.songs.map((song) =>
                      song.tierId === tierId ? { ...song, tierId: null } : song,
                    ),
                  }
                : tierList,
            ),
            tierFilter: state.tierFilter === tierId ? "all" : state.tierFilter,
          };
        }),
      addSong: (input) =>
        set((state) =>
          updateActiveList(state, (tierList) => ({
            ...tierList,
            songs: [
              ...tierList.songs,
              {
                id: createId("song"),
                ...normalizeInput(input),
                tierId: null,
              },
            ],
          })),
        ),
      updateSong: (songId, input) =>
        set((state) =>
          updateActiveList(state, (tierList) => ({
            ...tierList,
            songs: tierList.songs.map((song) =>
              song.id === songId ? { ...song, ...normalizeInput(input) } : song,
            ),
          })),
        ),
      deleteSong: (songId) =>
        set((state) =>
          updateActiveList(state, (tierList) => ({
            ...tierList,
            songs: tierList.songs.filter((song) => song.id !== songId),
          })),
        ),
      moveSong: (songId, targetTierId, beforeSongId) =>
        set((state) =>
          updateActiveList(state, (tierList) => {
            const movingSong = tierList.songs.find((song) => song.id === songId);
            if (!movingSong) {
              return tierList;
            }

            const remainingSongs = tierList.songs.filter((song) => song.id !== songId);
            const nextSong = { ...movingSong, tierId: targetTierId };
            const insertIndex = beforeSongId
              ? remainingSongs.findIndex((song) => song.id === beforeSongId)
              : -1;

            if (insertIndex === -1) {
              return { ...tierList, songs: [...remainingSongs, nextSong] };
            }

            return {
              ...tierList,
              songs: [
                ...remainingSongs.slice(0, insertIndex),
                nextSong,
                ...remainingSongs.slice(insertIndex),
              ],
            };
          }),
        ),
      setQuery: (query) => set({ query }),
      setArtistFilter: (artistFilter) => set({ artistFilter }),
      setTierFilter: (tierFilter) => set({ tierFilter }),
    }),
    {
      name: "tierboard-storage",
      version: 2,
      migrate: () => ({
        ...emptyTierBoard,
        query: "",
        artistFilter: "all",
        tierFilter: "all",
      }),
      partialize: (state) => ({
        tierLists: state.tierLists,
        activeTierListId: state.activeTierListId,
      }),
    },
  ),
);
