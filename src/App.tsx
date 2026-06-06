import { useEffect } from "react";
import { useTierBoardStore } from "./store/useTierBoardStore";
import { AppHeader } from "./components/layout/AppHeader";
import { BoardPage } from "./components/board/BoardPage";
import { HomePage } from "./components/home/HomePage";

export function App() {
  const activeTierListId = useTierBoardStore((state) => state.activeTierListId);
  const theme = useTierBoardStore((state) => state.theme) ?? "light";

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div className="app-shell">
      <AppHeader />
      {activeTierListId ? <BoardPage /> : <HomePage />}
    </div>
  );
}
