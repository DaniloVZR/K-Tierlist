import { ArrowLeft } from "lucide-react";
import { useTierBoardStore } from "../../store/useTierBoardStore";

export function AppHeader() {
  const activeTierListId = useTierBoardStore((state) => state.activeTierListId);
  const selectTierList = useTierBoardStore((state) => state.selectTierList);

  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">Tier list manager</p>
        <h1>K-Ranking</h1>
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
