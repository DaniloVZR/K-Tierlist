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
  theme: "light" | "dark";
  toggleTheme: () => void;
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
  cloneTierList: (tierListId: string) => void;
  importTierList: (importedData: any) => void;
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

  const activeList = state.tierLists.find((t) => t.id === state.activeTierListId);
  if (!activeList) {
    return {};
  }

  const updatedList = updater(activeList);
  if (updatedList === activeList) {
    return {};
  }

  return {
    tierLists: state.tierLists.map((tierList) =>
      tierList.id === state.activeTierListId ? updatedList : tierList,
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
      theme: "light",
      toggleTheme: () => set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
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
                createdAt: Date.now(),
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
            const fromIndex = tierList.songs.findIndex((song) => song.id === songId);
            if (fromIndex === -1) {
              return tierList;
            }

            const movingSong = tierList.songs[fromIndex];
            const remainingSongs = tierList.songs.filter((song) => song.id !== songId);
            const nextSong = { ...movingSong, tierId: targetTierId };

            let targetSongs;
            if (beforeSongId) {
              const toIndex = tierList.songs.findIndex((song) => song.id === beforeSongId);
              if (toIndex === -1) {
                targetSongs = [...remainingSongs, nextSong];
              } else {
                const insertIndex = remainingSongs.findIndex((song) => song.id === beforeSongId);
                const finalInsertIndex = fromIndex < toIndex ? insertIndex + 1 : insertIndex;
                targetSongs = [
                  ...remainingSongs.slice(0, finalInsertIndex),
                  nextSong,
                  ...remainingSongs.slice(finalInsertIndex),
                ];
              }
            } else {
              targetSongs = [...remainingSongs, nextSong];
            }

            // Check if the resulting array would be identical to the current one
            const currentSongs = tierList.songs;
            const isIdentical =
              currentSongs.length === targetSongs.length &&
              currentSongs.every((song, idx) => {
                const target = targetSongs[idx];
                return (
                  song.id === target.id &&
                  song.tierId === target.tierId &&
                  song.title === target.title &&
                  song.artist === target.artist &&
                  song.featuring === target.featuring &&
                  song.album === target.album &&
                  song.createdAt === target.createdAt
                );
              });

            if (isIdentical) {
              return tierList;
            }

            return {
              ...tierList,
              songs: targetSongs,
            };
          }),
        ),
      setQuery: (query) => set({ query }),
      setArtistFilter: (artistFilter) => set({ artistFilter }),
      setTierFilter: (tierFilter) => set({ tierFilter }),
      cloneTierList: (tierListId) =>
        set((state) => {
          const original = state.tierLists.find((list) => list.id === tierListId);
          if (!original) {
            return {};
          }

          const newTierListId = createId("list");
          const tierIdMap = new Map<string, string>();

          const newTiers = original.tiers.map((tier) => {
            const newId = createId("tier");
            tierIdMap.set(tier.id, newId);
            return {
              ...tier,
              id: newId,
            };
          });

          const newSongs = original.songs.map((song) => {
            const newId = createId("song");
            let newTierId: string | null = null;
            if (song.tierId) {
              newTierId = tierIdMap.get(song.tierId) ?? null;
            }
            return {
              ...song,
              id: newId,
              tierId: newTierId,
            };
          });

          const newTierList: TierList = {
            id: newTierListId,
            name: `${original.name} (Copia)`,
            year: original.year,
            tiers: newTiers,
            songs: newSongs,
          };

          return {
            tierLists: [...state.tierLists, newTierList],
          };
        }),
      importTierList: (importedData) => {
        if (
          !importedData ||
          typeof importedData.name !== "string" ||
          typeof importedData.year !== "string" ||
          !Array.isArray(importedData.tiers) ||
          !Array.isArray(importedData.songs)
        ) {
          throw new Error("Formato de JSON inválido");
        }

        set((state) => {
          const newTierListId = createId("list");
          const tierIdMap = new Map<string, string>();

          const newTiers = importedData.tiers.map((tier: any) => {
            const newId = createId("tier");
            if (tier.id) {
              tierIdMap.set(tier.id, newId);
            }
            return {
              id: newId,
              name: String(tier.name || "Tier"),
              order: typeof tier.order === "number" ? tier.order : 0,
              color: String(tier.color || "#64748b"),
            };
          });

          const newSongs = importedData.songs.map((song: any, index: number) => {
            const newId = createId("song");
            let newTierId: string | null = null;
            if (song.tierId) {
              newTierId = tierIdMap.get(song.tierId) ?? null;
            }
            return {
              id: newId,
              title: String(song.title || "Canción"),
              artist: String(song.artist || "Artista"),
              featuring: song.featuring ? String(song.featuring) : undefined,
              album: song.album ? String(song.album) : undefined,
              tierId: newTierId,
              createdAt: typeof song.createdAt === "number" ? song.createdAt : Date.now() + index,
            };
          });

          const newTierList: TierList = {
            id: newTierListId,
            name: String(importedData.name),
            year: String(importedData.year),
            tiers: newTiers,
            songs: newSongs,
          };

          return {
            tierLists: [...state.tierLists, newTierList],
          };
        });
      },
    }),
    {
      name: "tierboard-storage",
      version: 3,
      migrate: (persistedState: any, version: number) => {
        const state = persistedState as any;
        if (version < 3 && state) {
          if (!state.theme) {
            state.theme = "light";
          }
          if (Array.isArray(state.tierLists)) {
            state.tierLists = state.tierLists.map((list: any) => {
              if (list && Array.isArray(list.songs)) {
                list.songs = list.songs.map((song: any, index: number) => ({
                  ...song,
                  createdAt: song.createdAt ?? (Date.now() - (list.songs.length - index) * 1000),
                }));
              }
              return list;
            });
          }
        }
        return state;
      },
      partialize: (state) => ({
        tierLists: state.tierLists,
        activeTierListId: state.activeTierListId,
        theme: state.theme,
      }),
    },
  ),
);
