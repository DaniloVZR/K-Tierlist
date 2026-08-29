import { useEffect } from "react";
import { AppHeader } from "./components/layout/AppHeader";
import { BoardPage } from "./components/board/BoardPage";
import { HomePage } from "./components/home/HomePage";
import { useTierBoardStore } from "./store/useTierBoardStore";

export function App() {
  const activeTierListId = useTierBoardStore((state) => state.activeTierListId);

  // Always use dark mode — the app ships dark-only
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="app-shell">
      <AppHeader />
      {activeTierListId ? <BoardPage /> : <HomePage />}
    </div>
  );
}
