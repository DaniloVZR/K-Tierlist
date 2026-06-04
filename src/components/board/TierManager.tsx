import { FormEvent, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTierBoardStore } from "../../store/useTierBoardStore";
import type { Tier } from "../../types";

export function TierManager({ tiers }: { tiers: Tier[] }) {
  const addTier = useTierBoardStore((state) => state.addTier);
  const updateTier = useTierBoardStore((state) => state.updateTier);
  const deleteTier = useTierBoardStore((state) => state.deleteTier);
  const [tierName, setTierName] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addTier(tierName);
    setTierName("");
  }

  return (
    <section className="tier-manager">
      <div className="panel-title">
        <h3>Tiers</h3>
        <span>{tiers.length}</span>
      </div>
      <form className="tier-form" onSubmit={submit}>
        <input
          value={tierName}
          onChange={(event) => setTierName(event.target.value)}
          placeholder="Nombre del tier"
        />
        <button className="icon-button strong" disabled={!tierName.trim()} type="submit">
          <Plus size={16} />
        </button>
      </form>
      <div className="tier-editor-list">
        {tiers.length ? (
          tiers.map((tier) => (
            <div className="tier-editor-row" key={tier.id}>
              <input
                aria-label={`Color de ${tier.name}`}
                type="color"
                value={tier.color}
                onChange={(event) => updateTier(tier.id, tier.name, event.target.value)}
              />
              <input
                aria-label={`Nombre de ${tier.name}`}
                value={tier.name}
                onChange={(event) => updateTier(tier.id, event.target.value, tier.color)}
              />
              <button
                aria-label="Eliminar tier"
                className="icon-button"
                onClick={() => deleteTier(tier.id)}
                type="button"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        ) : (
          <p className="muted">Crea tus tiers antes de empezar a clasificar.</p>
        )}
      </div>
    </section>
  );
}
