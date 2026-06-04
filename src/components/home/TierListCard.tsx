import { FormEvent, useState } from "react";
import { Copy, Download, Pencil, Trash2 } from "lucide-react";
import { useTierBoardStore } from "../../store/useTierBoardStore";
import type { TierList, TierListInput } from "../../types";

export function TierListCard({ tierList, onOpen }: { tierList: TierList; onOpen: () => void }) {
  const updateTierList = useTierBoardStore((state) => state.updateTierList);
  const deleteTierList = useTierBoardStore((state) => state.deleteTierList);
  const cloneTierList = useTierBoardStore((state) => state.cloneTierList);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<TierListInput>({
    name: tierList.name,
    year: tierList.year,
  });

  function handleDelete() {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la tier list "${tierList.name}"?`)) {
      deleteTierList(tierList.id);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateTierList(tierList.id, form);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <article className="tier-list-card">
        <form className="tier-list-edit-form" onSubmit={submit}>
          <label>
            Nombre
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <label>
            Año
            <input
              value={form.year}
              onChange={(event) => setForm({ ...form, year: event.target.value })}
            />
          </label>
          <div className="card-actions">
            <button className="primary-button" type="submit">
              Guardar
            </button>
            <button className="ghost-button" onClick={() => setIsEditing(false)} type="button">
              Cancelar
            </button>
          </div>
        </form>
      </article>
    );
  }

  return (
    <article className="tier-list-card clickable" onClick={onOpen}>
      <div>
        <p>{tierList.year}</p>
        <h3>{tierList.name}</h3>
        <span>
          {tierList.tiers.length} tiers · {tierList.songs.length} canciones
        </span>
      </div>
      <div className="card-actions" onClick={(event) => event.stopPropagation()}>
        <button
          aria-label="Editar tier list"
          className="icon-button"
          onClick={() => {
            setForm({ name: tierList.name, year: tierList.year });
            setIsEditing(true);
          }}
          type="button"
        >
          <Pencil size={16} />
        </button>
        <button
          aria-label="Clonar tier list"
          className="icon-button"
          onClick={() => cloneTierList(tierList.id)}
          type="button"
        >
          <Copy size={16} />
        </button>
        <button
          aria-label="Exportar tier list"
          className="icon-button"
          onClick={exportToJson}
          type="button"
        >
          <Download size={16} />
        </button>
        <button
          aria-label="Eliminar tier list"
          className="icon-button"
          onClick={handleDelete}
          type="button"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );

  function exportToJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tierList, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${tierList.name.replace(/\s+/g, "_")}-${tierList.year}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}
