import { FormEvent, useState } from "react";
import { Copy, Download, Image, Pencil, Trash2, ArrowUpRight, X } from "lucide-react";
import { useTierBoardStore } from "../../store/useTierBoardStore";
import type { TierList, TierListInput } from "../../types";

export function TierListCard({ tierList, onOpen }: { tierList: TierList; onOpen: () => void }) {
  const updateTierList = useTierBoardStore((state) => state.updateTierList);
  const updateTierListCover = useTierBoardStore((state) => state.updateTierListCover);
  const deleteTierList = useTierBoardStore((state) => state.deleteTierList);
  const cloneTierList = useTierBoardStore((state) => state.cloneTierList);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<TierListInput>({
    name: tierList.name,
    year: tierList.year,
  });
  const [coverUrl, setCoverUrl] = useState(tierList.coverImage ?? "");

  const bandColors = tierList.tiers.length ? tierList.tiers.map((t) => t.color) : ["#3a4357"];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateTierList(tierList.id, form);
    updateTierListCover(tierList.id, coverUrl.trim() || null);
    setIsEditing(false);
  }

  function handleDelete() {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la tier list "${tierList.name}"?`)) {
      deleteTierList(tierList.id);
    }
  }

  if (isEditing) {
    return (
      <article className="tier-list-card album-card">
        <form className="tier-list-edit-form album-edit-form" onSubmit={submit}>
          <div className="album-edit-header">
            <h3 className="album-edit-title">Editar</h3>
            <button
              type="button"
              className="icon-button"
              aria-label="Cancelar edición"
              onClick={() => setIsEditing(false)}
            >
              <X size={15} />
            </button>
          </div>
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
          <label>
            Imagen de portada (URL)
            <input
              type="url"
              value={coverUrl}
              placeholder="https://..."
              onChange={(event) => setCoverUrl(event.target.value)}
            />
          </label>
          <div className="card-actions">
            <button className="primary-button" type="submit">
              Guardar
            </button>
          </div>
        </form>
      </article>
    );
  }

  return (
    <article className="tier-list-card clickable album-card" onClick={onOpen}>
      <div className="album-art" aria-hidden="true">
        {tierList.coverImage ? (
          <img
            src={tierList.coverImage}
            alt={`Portada de ${tierList.name}`}
            className="album-cover-img"
          />
        ) : (
          <div className="album-art-grid">
            {bandColors.slice(0, 6).map((color, i) => (
              <span key={i} style={{ background: color }} />
            ))}
          </div>
        )}
        <span className="album-year">{tierList.year || "—"}</span>
      </div>

      <div className="album-body">
        <div>
          <p className="album-eyebrow">Ranking</p>
          <h3>{tierList.name}</h3>
          <span className="album-meta">
            {tierList.tiers.length} tiers · {tierList.songs.length} canciones
          </span>
        </div>
        <span className="album-open" aria-hidden="true">
          <ArrowUpRight size={18} />
        </span>
      </div>

      <div className="album-track-band" aria-hidden="true">
        {bandColors.map((color, i) => (
          <span key={i} style={{ background: color }} />
        ))}
      </div>

      <div className="card-actions album-actions" onClick={(event) => event.stopPropagation()}>
        <button
          aria-label="Editar tier list"
          className="icon-button"
          data-tooltip="Editar"
          onClick={() => {
            setForm({ name: tierList.name, year: tierList.year });
            setCoverUrl(tierList.coverImage ?? "");
            setIsEditing(true);
          }}
          type="button"
        >
          <Pencil size={16} />
        </button>
        <button
          aria-label="Clonar tier list"
          className="icon-button"
          data-tooltip="Clonar"
          onClick={() => cloneTierList(tierList.id)}
          type="button"
        >
          <Copy size={16} />
        </button>
        <button
          aria-label="Exportar tier list"
          className="icon-button"
          data-tooltip="Exportar JSON"
          onClick={exportToJson}
          type="button"
        >
          <Download size={16} />
        </button>
        <button
          aria-label="Eliminar tier list"
          className="icon-button"
          data-tooltip="Eliminar"
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
