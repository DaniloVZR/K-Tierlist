import type { SongInput } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SpotifyArtist {
  name: string;
}

interface SpotifyAlbum {
  name: string;
  release_date: string;
}

interface SpotifyTrackItem {
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  is_local: boolean;
}

interface SpotifyPlaylistTrack {
  track: SpotifyTrackItem | null;
}

interface SpotifyPlaylistPage {
  items: SpotifyPlaylistTrack[];
  next: string | null;
  total: number;
}

export interface SpotifyPlaylistMeta {
  name: string;
  description: string;
  total: number;
}

export interface SpotifyImportResult {
  meta: SpotifyPlaylistMeta;
  songs: SongInput[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
 * Obtains an access token using Client Credentials flow.
 * This token only grants access to public data — no user login required.
 */
async function fetchClientCredentialsToken(): Promise<string> {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string;
  const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET as string;

  if (!clientId || !clientSecret || clientId === "TU_CLIENT_ID_AQUI") {
    throw new Error(
      "Faltan las credenciales de Spotify. Configura VITE_SPOTIFY_CLIENT_ID y VITE_SPOTIFY_CLIENT_SECRET en el archivo .env.local"
    );
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);

  // /spotify-token is proxied by Vite (dev) and Vercel (prod)
  // → https://accounts.spotify.com/api/token
  // This avoids CORS and origin-based blocks from Spotify.
  const response = await fetch("/spotify-token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Error al obtener token de Spotify: ${errorData.error_description ?? response.statusText}`
    );
  }

  const data = await response.json();
  return data.access_token as string;
}

/**
 * Maps a Spotify track to a SongInput.
 * - title: track name
 * - artist: first artist
 * - featuring: remaining artists joined with ", "
 * - album: album name
 */
function mapTrackToSong(track: SpotifyTrackItem): SongInput {
  const [mainArtist, ...otherArtists] = track.artists;
  return {
    title: track.name,
    artist: mainArtist?.name ?? "Desconocido",
    featuring: otherArtists.length > 0 ? otherArtists.map((a) => a.name).join(", ") : "",
    album: track.album.name,
  };
}

/**
 * Fetches all tracks from a public Spotify playlist (handles pagination).
 * Returns playlist metadata and a list of SongInput objects.
 *
 * NOTE: We intentionally avoid the `?fields=` query parameter because
 * Spotify returns 403 when the parenthesised fields syntax is used from
 * browser-based Client Credentials requests. We simply fetch the full
 * objects — the extra payload is negligible.
 */
export async function fetchSpotifyPlaylist(
  playlistId: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<SpotifyImportResult> {
  const token = await fetchClientCredentialsToken();

  // /spotify-api/* is proxied by Vite (dev) and Vercel (prod)
  // → https://api.spotify.com/v1/*

  // ── Metadata ──────────────────────────────────────────────────────────────
  const metaResponse = await fetch(
    `/spotify-api/playlists/${playlistId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!metaResponse.ok) {
    if (metaResponse.status === 404) {
      throw new Error(
        "Playlist no encontrada. Verifica que el link sea correcto y que la playlist sea pública."
      );
    }
    if (metaResponse.status === 403) {
      throw new Error(
        "Spotify rechazó el acceso (403). Verifica que tu Client ID y Client Secret sean correctos y que la app esté guardada en el Spotify Developer Dashboard."
      );
    }
    throw new Error(
      `Error al acceder a la playlist: ${metaResponse.status} ${metaResponse.statusText}`
    );
  }

  const meta = await metaResponse.json();
  const total: number = meta.tracks?.total ?? 0;

  const playlistMeta: SpotifyPlaylistMeta = {
    name: meta.name as string,
    description: (meta.description as string) ?? "",
    total,
  };

  // ── Tracks — offset-based pagination ──────────────────────────────────────
  // We use manual offset instead of the `next` URL returned by Spotify
  // because that URL points to api.spotify.com directly (outside the proxy).
  const LIMIT = 100;
  const songs: SongInput[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const pageResponse = await fetch(
      `/spotify-api/playlists/${playlistId}/tracks?limit=${LIMIT}&offset=${offset}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!pageResponse.ok) {
      throw new Error(
        `Error al obtener canciones: ${pageResponse.status} ${pageResponse.statusText}`
      );
    }

    const page: SpotifyPlaylistPage = await pageResponse.json();

    for (const item of page.items) {
      // Skip null tracks (deleted/unavailable) and local files
      if (!item.track || item.track.is_local) continue;
      songs.push(mapTrackToSong(item.track));
    }

    offset += page.items.length;
    hasMore = page.next !== null;
    onProgress?.(songs.length, total);
  }

  return { meta: playlistMeta, songs };
}

