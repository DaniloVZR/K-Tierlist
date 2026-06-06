import { MouseEvent, useState } from "react";
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: song.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isEditing) {
    return (
      <div className="song-card editing">
        <SongForm editingSong={song} onDone={() => setIsEditing(false)} />
      </div>
    );
  }

  function openMenu(event: MouseEvent<HTMLElement>) {
    event.preventDefault();
    setIsMenuOpen(true);
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
      onClick={() => setIsMenuOpen(false)}
      onContextMenu={openMenu}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <SongCardView song={song} rank={rank} />
      {isMenuOpen ? (
        <div className="context-menu" onPointerDown={(event) => event.stopPropagation()}>
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
          <button
            onClick={() => {
              setIsMenuOpen(false);
              deleteSong(song.id);
            }}
            type="button"
          >
            <Trash2 size={15} />
            Eliminar
          </button>
        </div>
      ) : null}
    </article>
  );
}
