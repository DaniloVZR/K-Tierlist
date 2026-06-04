import type { TierList } from "../types";

export const tierPalette = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#64748b",
  "#334155",
];

export const emptyTierBoard: { tierLists: TierList[]; activeTierListId: string | null } = {
  tierLists: [],
  activeTierListId: null,
};
