import { useState } from "react";
import { ListMusic, Upload } from "lucide-react";
import { useTierBoardStore } from "../../store/useTierBoardStore";
import { TierListCard } from "./TierListCard";
import { TierListForm } from "./TierListForm";
import { SpotifyImportModal } from "./SpotifyImportModal";

export function HomePage() {
  const tierLists = useTierBoardStore((state) => state.tierLists);
  const selectTierList = useTierBoardStore((state) => state.selectTierList);
  const importTierList = useTierBoardStore((state) => state.importTierList);
  const [spotifyModalOpen, setSpotifyModalOpen] = useState(false);

  const sortedTierLists = [...tierLists].sort((a, b) => {
    const yearCompare = a.year.localeCompare(b.year, undefined, { numeric: true });
    return yearCompare || a.name.localeCompare(b.name);
  });

  function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        importTierList(json);
      } catch (err: any) {
        alert("Error al importar la tier list: " + err.message);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <main className="home-page">
      <section className="home-heading">
        <div>
          <p className="eyebrow">Menú principal</p>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h2>Mis tier lists</h2>
            <input
              type="file"
              accept=".json"
              style={{ display: "none" }}
              id="import-tierlist-json"
              onChange={handleImport}
            />
            <label
              htmlFor="import-tierlist-json"
              className="ghost-button"
              style={{ cursor: "pointer", minHeight: "34px", padding: "0 10px", fontSize: "13px", gap: "6px" }}
            >
              <Upload size={14} />
              Importar JSON
            </label>
            <button
              id="open-spotify-import"
              type="button"
              className="ghost-button spotify-import-trigger"
              style={{ minHeight: "34px", padding: "0 12px", fontSize: "13px", gap: "7px" }}
              onClick={() => setSpotifyModalOpen(true)}
            >
              <SpotifyIconSmall />
              Importar de Spotify
            </button>
          </div>
        </div>
        <TierListForm />
      </section>

      <section className="tier-list-grid" aria-label="Tier lists creadas">
        {sortedTierLists.length ? (
          sortedTierLists.map((tierList) => (
            <TierListCard
              key={tierList.id}
              onOpen={() => selectTierList(tierList.id)}
              tierList={tierList}
            />
          ))
        ) : (
          <div className="empty-state">
            <ListMusic size={32} />
            <h3>Aún no hay tier lists</h3>
            <p>Crea la primera desde el formulario superior y luego configura sus tiers.</p>
          </div>
        )}
      </section>

      <SpotifyImportModal
        isOpen={spotifyModalOpen}
        onClose={() => setSpotifyModalOpen(false)}
      />
    </main>
  );
}

function SpotifyIconSmall() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}
