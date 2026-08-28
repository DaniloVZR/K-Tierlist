import { MouseEvent, useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Trash2 } from "lucide-react";
import { useTierBoardStore } from "../../store/useTierBoardStore";
import type { Song } from "../../types";
import { SongCardView } from "./SongCardView";
import { SongForm } from "./SongForm";

export function SortableSongCard({
  song,
  rank,
  isSpecialTier,
}: {
  song: Song;
  rank?: number;
  isSpecialTier?: boolean;
}) {
  const deleteSong = useTierBoardStore((state) => state.deleteSong);
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: song.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;

    function handleClickOutside(event: MouseEvent | PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleClickOutside as any);
    return () => document.removeEventListener("pointerdown", handleClickOutside as any);
  }, [isMenuOpen]);

  if (isEditing) {
    return (
      <div className="song-card editing">
        <SongForm editingSong={song} onDone={() => setIsEditing(false)} />
        <button
          className="ghost-button song-edit-cancel"
          onClick={() => setIsEditing(false)}
          type="button"
        >
          Cancelar
        </button>
      </div>
    );
  }

  function openMenu(event: MouseEvent<HTMLElement>) {
    event.preventDefault();
    setIsMenuOpen(true);
  }

  function handleDelete() {
    setIsMenuOpen(false);
    if (window.confirm(`¿Estás seguro de que deseas eliminar "${song.title}"?`)) {
      deleteSong(song.id);
    }
  }

  const cardClassName = [
    "song-card",
    isDragging && "dragging",
    isSpecialTier && "special-tier-card",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={cardClassName}
      onContextMenu={openMenu}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <SongCardView song={song} rank={rank} />
      {isMenuOpen ? (
        <div className="context-menu" ref={menuRef} onPointerDown={(event) => event.stopPropagation()}>
          <button
            className="context-menu-close"
            aria-label="Cerrar menú"
            onClick={() => setIsMenuOpen(false)}
            type="button"
          >
            ✕
          </button>
          <button
            onClick={() => {
              setIsMenuOpen(false);
              setIsEditing(true);
            }}
            type="button"
          >
            <Pencil size={15} />
            Editar
          </button>
          <button onClick={handleDelete} type="button">
            <Trash2 size={15} />
            Eliminar
          </button>
        </div>
      ) : null}
    </article>
  );
}
