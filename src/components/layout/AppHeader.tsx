import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useTierBoardStore } from "../../store/useTierBoardStore";

export function AppHeader() {
  const activeTierListId = useTierBoardStore((state) => state.activeTierListId);
  const selectTierList = useTierBoardStore((state) => state.selectTierList);
  const theme = useTierBoardStore((state) => state.theme) ?? "light";
  const toggleTheme = useTierBoardStore((state) => state.toggleTheme);

  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">Tier list manager</p>
        <h1>K-Tierlist</h1>
      </div>
      <div className="header-actions">
        <button
          className="icon-button"
          onClick={toggleTheme}
          aria-label="Cambiar tema"
          type="button"
          title={theme === "light" ? "Modo oscuro" : "Modo claro"}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
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
