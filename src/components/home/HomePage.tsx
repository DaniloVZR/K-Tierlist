import { ListMusic } from "lucide-react";
import { useTierBoardStore } from "../../store/useTierBoardStore";
import { TierListCard } from "./TierListCard";
import { TierListForm } from "./TierListForm";

export function HomePage() {
  const tierLists = useTierBoardStore((state) => state.tierLists);
  const selectTierList = useTierBoardStore((state) => state.selectTierList);
  const sortedTierLists = [...tierLists].sort((a, b) => {
    const yearCompare = a.year.localeCompare(b.year, undefined, { numeric: true });
    return yearCompare || a.name.localeCompare(b.name);
  });

  return (
    <main className="home-page">
      <section className="home-heading">
        <div>
          <p className="eyebrow">Menú principal</p>
          <h2>Mis tier lists</h2>
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
