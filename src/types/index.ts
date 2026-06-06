export interface Song {
  id: string;
  title: string;
  artist: string;
  featuring?: string;
  album?: string;
  tierId?: string | null;
  createdAt?: number;
}

export interface Tier {
  id: string;
  name: string;
  order: number;
  color: string;
}

export interface TierList {
  id: string;
  name: string;
  year: string;
  tiers: Tier[];
  songs: Song[];
}

export interface TierListInput {
  name: string;
  year: string;
}

export interface SongInput {
  title: string;
  artist: string;
  featuring: string;
  album: string;
}
