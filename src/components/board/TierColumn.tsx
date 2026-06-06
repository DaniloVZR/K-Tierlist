import { useDroppable } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import type { Song } from "../../types";
import { SortableSongCard } from "./SortableSongCard";

export function TierColumn({
  id,
  title,
  songs,
  tone,
  songRanks,
}: {
  id: string | null;
  title: string;
  songs: Song[];
  tone: string;
  songRanks?: Map<string, number>;
}) {
  const containerId = id ?? "unranked";
  const { setNodeRef, isOver } = useDroppable({ id: containerId });

  return (
    <section className={isOver ? "tier-row over" : "tier-row"} ref={setNodeRef}>
      <div className="tier-label" style={{ background: tone }}>
        {title}
      </div>
      <SortableContext items={songs.map((song) => song.id)} strategy={horizontalListSortingStrategy}>
        <div className="tier-dropzone">
          {songs.length ? (
            songs.map((song) => (
              <SortableSongCard
                key={song.id}
                song={song}
                rank={songRanks?.get(song.id)}
                isSpecialTier={title === "10"}
              />
            ))
          ) : (
            <div className="empty-tier">Suelta canciones aquí</div>
          )}
        </div>
      </SortableContext>
    </section>
  );
}
