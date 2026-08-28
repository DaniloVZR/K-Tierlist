import type { SongInput } from "../types";

export interface SpotifyPlaylistMeta {
  name: string;
  description: string;
  total: number;
}

export interface SpotifyImportResult {
  meta: SpotifyPlaylistMeta;
  songs: SongInput[];
}

/**
 * Extracts the playlist ID from a Spotify URL.
 * Accepts formats like:
 *   https://open.spotify.com/playlist/4FULIgYg2naBGhXTnBb94s
 *   https://open.spotify.com/playlist/4FULIgYg2naBGhXTnBb94s?si=...
 *   spotify:playlist:4FULIgYg2naBGhXTnBb94s
 */
export function parseSpotifyPlaylistId(input: string): string | null {
  const trimmed = input.trim();

  // URI format: spotify:playlist:ID
  const uriMatch = trimmed.match(/^spotify:playlist:([A-Za-z0-9]+)/);
  if (uriMatch) return uriMatch[1];

  // URL format: open.spotify.com/playlist/ID
  const urlMatch = trimmed.match(
    /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?playlist\/([A-Za-z0-9]+)/
  );
  if (urlMatch) return urlMatch[1];

  return null;
}

/**
 * Fetches playlist data from our Vercel Serverless Function backend.
 */
export async function fetchSpotifyPlaylist(
  playlistId: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<SpotifyImportResult> {
  // Simulate progress start since the backend does it all in one go now
  onProgress?.(0, 100); 

  const response = await fetch(`/api/spotify-playlist?playlistId=${playlistId}`);
  
  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    try {
      const data = await response.json();
      if (data.error) errorMessage = data.error;
    } catch (e) {
      // Ignore JSON parse error
    }
    throw new Error(errorMessage);
  }

  const result: SpotifyImportResult = await response.json();
  
  // Simulate progress complete
  onProgress?.(result.songs.length, result.songs.length);

  return result;
}

