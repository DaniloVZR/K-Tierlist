import { useState, useRef, useCallback } from "react";
import { X, Music2, Loader2, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { fetchSpotifyPlaylist, parseSpotifyPlaylistId } from "../../utils/spotifyImport";
import { useTierBoardStore } from "../../store/useTierBoardStore";
import type { SongInput } from "../../types";
import type { SpotifyPlaylistMeta } from "../../utils/spotifyImport";

// ─── Types ────────────────────────────────────────────────────────────────────

type ImportStep = "idle" | "loading" | "preview" | "error";

interface PreviewData {
  meta: SpotifyPlaylistMeta;
  songs: SongInput[];
  playlistYear: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="spotify-progress-bg">
      <div className="spotify-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface SpotifyImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SpotifyImportModal({ isOpen, onClose }: SpotifyImportModalProps) {
  const importSongsFromSpotify = useTierBoardStore((s) => s.importSongsFromSpotify);

  const [url, setUrl] = useState("");
  const [step, setStep] = useState<ImportStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const [listName, setListName] = useState("");
  const [listYear, setListYear] = useState(String(new Date().getFullYear()));

  const abortRef = useRef(false);

  const reset = useCallback(() => {
    setUrl("");
    setStep("idle");
    setError(null);
    setPreview(null);
    setProgress({ loaded: 0, total: 0 });
    setListName("");
    setListYear(String(new Date().getFullYear()));
    abortRef.current = false;
  }, []);

  const handleClose = useCallback(() => {
    abortRef.current = true;
    reset();
    onClose();
  }, [onClose, reset]);

  const handleFetch = useCallback(async () => {
    const playlistId = parseSpotifyPlaylistId(url);
    if (!playlistId) {
      setError("URL de Spotify inválida. Asegúrate de pegar el link completo de la playlist.");
      setStep("error");
      return;
    }

    abortRef.current = false;
    setStep("loading");
    setError(null);
    setProgress({ loaded: 0, total: 0 });

    try {
      const result = await fetchSpotifyPlaylist(playlistId, (loaded, total) => {
        if (!abortRef.current) setProgress({ loaded, total });
      });

      if (abortRef.current) return;

      // Detect release year from playlist name or current year
      const yearMatch = result.meta.name.match(/\b(19|20)\d{2}\b/);
      const detectedYear = yearMatch ? yearMatch[0] : String(new Date().getFullYear());

      setListName(result.meta.name);
      setListYear(detectedYear);
      setPreview({ meta: result.meta, songs: result.songs, playlistYear: detectedYear });
      setStep("preview");
    } catch (err: any) {
      if (!abortRef.current) {
        setError(err.message ?? "Error desconocido al importar la playlist.");
        setStep("error");
      }
    }
  }, [url]);

  const handleImport = useCallback(() => {
    if (!preview) return;
    importSongsFromSpotify(listName, listYear, preview.songs);
    reset();
    onClose();
  }, [preview, listName, listYear, importSongsFromSpotify, reset, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="drawer-backdrop" onClick={handleClose} />

      {/* Modal */}
      <div className="spotify-modal" role="dialog" aria-modal="true" aria-labelledby="spotify-modal-title">
        {/* Header */}
        <div className="spotify-modal-header">
          <div className="spotify-modal-title-row">
            <span className="spotify-logo-icon">
              <SpotifyLogoSvg />
            </span>
            <h3 id="spotify-modal-title">Importar desde Spotify</h3>
          </div>
          <button className="icon-button" onClick={handleClose} type="button" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="spotify-modal-body">
          {/* URL input */}
          <div className="spotify-url-field">
            <label htmlFor="spotify-url-input" className="spotify-field-label">
              Link de la playlist pública
            </label>
            <div className="spotify-url-row">
              <input
                id="spotify-url-input"
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (step === "error") setStep("idle");
                }}
                onKeyDown={(e) => e.key === "Enter" && step === "idle" && url.trim() && handleFetch()}
                placeholder="https://open.spotify.com/playlist/..."
                disabled={step === "loading"}
                className="spotify-url-input"
                autoFocus
              />
              <button
                className="primary-button"
                type="button"
                disabled={!url.trim() || step === "loading"}
                onClick={handleFetch}
              >
                {step === "loading" ? <Loader2 size={16} className="spin" /> : <Music2 size={16} />}
                {step === "loading" ? "Cargando…" : "Buscar"}
              </button>
            </div>
          </div>

          {/* Loading state */}
          {step === "loading" && (
            <div className="spotify-loading">
              <Loader2 size={24} className="spin spotify-spinner" />
              <p>
                {progress.total > 0
                  ? `Cargando canciones… ${progress.loaded} / ${progress.total}`
                  : "Conectando con Spotify…"}
              </p>
              {progress.total > 0 && <ProgressBar value={progress.loaded} max={progress.total} />}
            </div>
          )}

          {/* Error state */}
          {step === "error" && error && (
            <div className="spotify-status-box spotify-error-box">
              <AlertCircle size={18} />
              <p>{error}</p>
            </div>
          )}

          {/* Preview state */}
          {step === "preview" && preview && (
            <div className="spotify-preview">
              {/* Success header */}
              <div className="spotify-status-box spotify-success-box">
                <CheckCircle2 size={18} />
                <p>
                  <strong>{preview.songs.length}</strong> canciones encontradas en{" "}
                  <em>"{preview.meta.name}"</em>
                </p>
              </div>

              {/* Name & year fields */}
              <div className="spotify-meta-fields">
                <label className="spotify-field-label" htmlFor="spotify-list-name">
                  Nombre de la tier list
                  <input
                    id="spotify-list-name"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    placeholder="Nombre"
                  />
                </label>
                <label className="spotify-field-label" htmlFor="spotify-list-year">
                  Año
                  <input
                    id="spotify-list-year"
                    value={listYear}
                    onChange={(e) => setListYear(e.target.value)}
                    placeholder="2026"
                    style={{ maxWidth: "90px" }}
                  />
                </label>
              </div>

              {/* Song preview list */}
              <div className="spotify-song-preview-list">
                {preview.songs.slice(0, 8).map((song, i) => (
                  <div key={i} className="spotify-song-preview-item">
                    <span className="spotify-song-preview-num">{i + 1}</span>
                    <div className="spotify-song-preview-info">
                      <strong>{song.title}</strong>
                      <span>
                        {song.artist}
                        {song.featuring ? ` ft. ${song.featuring}` : ""}
                      </span>
                    </div>
                    {song.album && <small className="spotify-song-preview-album">{song.album}</small>}
                  </div>
                ))}
                {preview.songs.length > 8 && (
                  <p className="spotify-preview-more">
                    + {preview.songs.length - 8} canciones más…
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "preview" && preview && (
          <div className="spotify-modal-footer">
            <button className="ghost-button" type="button" onClick={() => { setStep("idle"); setPreview(null); }}>
              Cambiar URL
            </button>
            <button
              className="primary-button spotify-import-btn"
              type="button"
              onClick={handleImport}
              disabled={!listName.trim() || !listYear.trim()}
            >
              <CheckCircle2 size={16} />
              Importar {preview.songs.length} canciones
            </button>
          </div>
        )}

        {/* Help link */}
        <a
          href="https://developer.spotify.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="spotify-help-link"
        >
          <ExternalLink size={12} />
          ¿Problemas? Verifica tus credenciales en el Spotify Developer Dashboard
        </a>
      </div>
    </>
  );
}

// Inline Spotify logo SVG to avoid external deps
function SpotifyLogoSvg() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}
