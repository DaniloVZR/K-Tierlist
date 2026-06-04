import { useTierBoardStore } from "./store/useTierBoardStore";
import { AppHeader } from "./components/layout/AppHeader";
import { BoardPage } from "./components/board/BoardPage";
import { HomePage } from "./components/home/HomePage";

export function App() {
  const activeTierListId = useTierBoardStore((state) => state.activeTierListId);

  return (
    <div className="app-shell">
      <AppHeader />
      {activeTierListId ? <BoardPage /> : <HomePage />}
    </div>
  );
}
