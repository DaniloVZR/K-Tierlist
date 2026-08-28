import type { VercelRequest, VercelResponse } from "@vercel/node";

interface SongData {
  title: string;
  artist: string;
  featuring: string;
  album: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const playlistId = req.query.playlistId as string | undefined;

  if (!playlistId) {
    return res.status(400).json({ error: "Missing playlistId" });
  }

  // --- OPTION 1: Web Scraping Spotify Embed HTML (No credentials needed, works in 2026) ---
  try {
    const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
    const resEmbed = await fetch(embedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      }
    });

    if (resEmbed.ok) {
      const html = await resEmbed.text();
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
      
      if (nextDataMatch) {
        const data = JSON.parse(nextDataMatch[1]);
        const entity = data.props?.pageProps?.state?.data?.entity;
        
        if (entity && Array.isArray(entity.trackList)) {
          const playlistMeta = {
            name: entity.title || entity.name || "Unknown Playlist",
            description: entity.subtitle || "",
            total: entity.trackList.length,
          };

          const songs: SongData[] = entity.trackList.map((t: any) => {
            // Split subtitle (e.g. "ILLIT, HANA") into main artist and featuring
            const artists = (t.subtitle || "")
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean);
            
            const [mainArtist, ...others] = artists;

            return {
              title: t.title || "Unknown",
              artist: mainArtist || "Unknown",
              featuring: others.join(", "),
              album: "", // Embed data doesn't include album names, but it is optional anyway
            };
          });

          return res.status(200).json({ meta: playlistMeta, songs });
        }
      }
    }
  } catch (scrapeError) {
    // If scraping fails, fall back to the Spotify API method
    console.error("[Spotify Scraper] Scrape failed, falling back to API:", scrapeError);
  }

  // --- OPTION 2: Spotify API Fallback (Requires Client ID & Client Secret) ---
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ 
      error: "Error de conexión o playlist inaccesible. (Además, faltan credenciales SPOTIFY_CLIENT en el servidor)." 
    });
  }

  try {
    // Get token
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({})) as any;
      return res.status(tokenResponse.status).json({
        error: `Spotify token error: ${errorData.error_description || tokenResponse.statusText}`,
      });
    }

    const tokenData = await tokenResponse.json() as any;
    const token = tokenData.access_token as string;

    // Get metadata
    const metaResponse = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}?fields=name,description`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!metaResponse.ok) {
      if (metaResponse.status === 404) {
        return res.status(404).json({ error: "Playlist no encontrada o es privada." });
      }
      const errText = await metaResponse.text().catch(() => metaResponse.statusText);
      return res.status(metaResponse.status).json({
        error: `Spotify API error al obtener metadata: ${metaResponse.status} — ${errText}`,
      });
    }

    const meta = await metaResponse.json() as any;

    // Get tracks
    const LIMIT = 100;
    const MAX_SONGS = 500;
    const songs: SongData[] = [];
    let offset = 0;
    let total = Infinity;

    while (offset < Math.min(total, MAX_SONGS)) {
      const pageUrl = `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=${LIMIT}&offset=${offset}&fields=total,items(is_local,track(name,artists(name),album(name))),next`;

      const pageResponse = await fetch(pageUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!pageResponse.ok) {
        const errText = await pageResponse.text().catch(() => pageResponse.statusText);
        return res.status(pageResponse.status).json({
          error: `Error al obtener canciones (offset ${offset}): ${pageResponse.status} — ${errText}`,
        });
      }

      const page = await pageResponse.json() as any;

      if (offset === 0) {
        total = typeof page.total === "number" ? page.total : 0;
      }

      if (!page.items || page.items.length === 0) break;

      for (const item of page.items) {
        if (!item.track || item.is_local) continue;

        const [mainArtist, ...otherArtists] = item.track.artists || [];
        songs.push({
          title: item.track.name || "Unknown",
          artist: (mainArtist as any)?.name || "Unknown",
          featuring: otherArtists.length > 0
            ? (otherArtists as any[]).map((a) => a.name).join(", ")
            : "",
          album: item.track.album?.name || "",
        });
      }

      offset += page.items.length;
      if (page.items.length < LIMIT) break;
    }

    return res.status(200).json({
      meta: {
        name: meta.name || "Unknown Playlist",
        description: meta.description || "",
        total: songs.length,
      },
      songs,
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
