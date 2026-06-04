import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { useTierBoardStore } from "../../store/useTierBoardStore";
import type { TierListInput } from "../../types";

const emptyTierList: TierListInput = { name: "", year: "" };

export function TierListForm() {
  const createTierList = useTierBoardStore((state) => state.createTierList);
  const [form, setForm] = useState<TierListInput>(emptyTierList);
  const canSubmit = form.name.trim().length > 0 && form.year.trim().length > 0;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    createTierList(form);
    setForm(emptyTierList);
  }

  return (
    <form className="tier-list-form" onSubmit={submit}>
      <label>
        Nombre
        <input
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="K-Pop Songs"
        />
      </label>
      <label>
        Año
        <input
          value={form.year}
          onChange={(event) => setForm({ ...form, year: event.target.value })}
          placeholder="2026"
        />
      </label>
      <button className="primary-button" disabled={!canSubmit} type="submit">
        <Plus size={16} />
        Crear tier list
      </button>
    </form>
  );
}
