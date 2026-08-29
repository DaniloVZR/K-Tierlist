import { ArrowLeft } from "lucide-react";
import { useTierBoardStore } from "../../store/useTierBoardStore";

export function AppHeader() {
  const activeTierListId = useTierBoardStore((state) => state.activeTierListId);
  const selectTierList = useTierBoardStore((state) => state.selectTierList);

  return (
    <header className="app-header">
      <div className="brand-mark">
        <span className="brand-badge" aria-hidden="true">
          K
        </span>
        <div>
          <p className="eyebrow">Tier list manager</p>
          <h1>K-Tierlist</h1>
        </div>
      </div>
      <div className="header-actions">
        {activeTierListId ? (
          <button className="ghost-button" onClick={() => selectTierList(null)} type="button">
            <ArrowLeft size={16} />
            Menú
          </button>
        ) : null}
      </div>
    </header>
  );
}
