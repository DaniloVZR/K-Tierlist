import { ListMusic, Upload } from "lucide-react";
import { useTierBoardStore } from "../../store/useTierBoardStore";
import { TierListCard } from "./TierListCard";
import { TierListForm } from "./TierListForm";

export function HomePage() {
  const tierLists = useTierBoardStore((state) => state.tierLists);
  const selectTierList = useTierBoardStore((state) => state.selectTierList);
  const importTierList = useTierBoardStore((state) => state.importTierList);
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
    </main>
  );
}
