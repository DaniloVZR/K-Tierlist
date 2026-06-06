import { useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ArrowLeft, ChartColumn, Music, Settings2 } from "lucide-react";
import { getActiveTierList, getSongsForTier, getVisibleSongs } from "../../store/selectors";
import { useTierBoardStore } from "../../store/useTierBoardStore";
import { buildCollisionDetection } from "../../utils/collisionDetection";
import { SideDrawer } from "../ui/SideDrawer";
import { HomePage } from "../home/HomePage";
import { AllSongsPanel } from "./AllSongsPanel";
import { Filters } from "./Filters";
import { SongCardView } from "./SongCardView";
import { SongForm } from "./SongForm";
import { Stats } from "./Stats";
import { TierColumn } from "./TierColumn";
import { TierManager } from "./TierManager";

export function BoardPage() {
  const tierLists = useTierBoardStore((state) => state.tierLists);
  const activeTierListId = useTierBoardStore((state) => state.activeTierListId);
  const query = useTierBoardStore((state) => state.query);
  const artistFilter = useTierBoardStore((state) => state.artistFilter);
  const tierFilter = useTierBoardStore((state) => state.tierFilter);
  const moveSong = useTierBoardStore((state) => state.moveSong);
  const selectTierList = useTierBoardStore((state) => state.selectTierList);
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<"tiers" | "stats" | null>(null);
  const tierList = getActiveTierList(tierLists, activeTierListId);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  // Track the last known "over" container to avoid oscillations
  const lastOverIdRef = useRef<UniqueIdentifier | null>(null);
  // Track the active container during the drag to prevent React 18 state batching race conditions
  const activeContainerRef = useRef<string | null>(null);

  if (!tierList) {
    return <HomePage />;
  }

  const currentTierList = tierList;
  const visibleSongs = getVisibleSongs(currentTierList.songs, query, artistFilter, tierFilter);
  const activeSong = currentTierList.songs.find((song) => song.id === activeSongId);

  // Compute global ranks based on ALL songs (unfiltered) in the tier list
  const rankedSongs = currentTierList.tiers.flatMap((tier) =>
    getSongsForTier(currentTierList.songs, tier.id)
  );
  const songRanks = new Map<string, number>();
  rankedSongs.forEach((song, index) => {
    songRanks.set(song.id, index + 1);
  });

  const activeSongTier = activeSong ? currentTierList.tiers.find((t) => t.id === activeSong.tierId) : null;
  const isSpecialActiveSong = activeSongTier?.name === "10";

  // All container (tier) IDs used by useDroppable
  const containerIds: UniqueIdentifier[] = [
    "unranked",
    ...currentTierList.tiers.map((tier) => tier.id),
  ];

  const collisionDetection = buildCollisionDetection(containerIds);

  /** Resolve which container (tier id or null for unranked) a given over-id belongs to */
  function resolveContainerId(overId: string): string | null {
    if (overId === "unranked") return null;
    // It's a tier id used directly as a container
    if (currentTierList.tiers.some((t) => t.id === overId)) return overId;
    // It's a song id – find which tier it belongs to
    const overSong = currentTierList.songs.find((s) => s.id === overId);
    if (overSong) return overSong.tierId ?? null;
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    const activeId = String(event.active.id);
    setActiveSongId(activeId);
    lastOverIdRef.current = null;
    const song = currentTierList.songs.find((s) => s.id === activeId);
    activeContainerRef.current = song ? (song.tierId ?? null) : null;
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const activeContainerId = activeContainerRef.current;
    const overContainerId = resolveContainerId(overId);

    // Move the song between containers during drag-over
    if (activeContainerId !== overContainerId) {
      // Prevent rapid oscillation: don't re-move if we just moved here
      if (lastOverIdRef.current === overId) return;
      lastOverIdRef.current = overId;

      activeContainerRef.current = overContainerId;

      // Check if we're over a song (insert before it) or a container (append)
      const isOverSong = currentTierList.songs.some((s) => s.id === overId);
      moveSong(activeId, overContainerId, isOverSong ? overId : undefined);
    } else {
      // Sorting within the same container: update the position in real time
      const isOverSong = currentTierList.songs.some((s) => s.id === overId);
      if (isOverSong) {
        moveSong(activeId, overContainerId, overId);
      }
      lastOverIdRef.current = null;
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveSongId(null);
    lastOverIdRef.current = null;
    activeContainerRef.current = null;

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const overContainerId = resolveContainerId(overId);
    const isOverSong = currentTierList.songs.some((s) => s.id === overId);

    // Final placement: put the song in the resolved container,
    // optionally before the hovered song for ordering
    moveSong(activeId, overContainerId, isOverSong ? overId : undefined);
  }

  return (
    <DndContext
      collisionDetection={collisionDetection}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
      sensors={sensors}
    >
      <main className="main-panel">
        <section className="board-heading">
          <div>
            <p className="eyebrow">Tier list seleccionada</p>
            <h2>{currentTierList.name}</h2>
            <span>{currentTierList.year}</span>
          </div>
          <div className="heading-actions">
            <button className="ghost-button" onClick={() => setDrawer("tiers")} type="button">
              <Settings2 size={16} />
              Tiers
            </button>
            <button className="ghost-button" onClick={() => setDrawer("stats")} type="button">
              <ChartColumn size={16} />
              Estadísticas
            </button>
            <div className="song-count">
              <Music size={18} />
              {currentTierList.songs.length} canciones
            </div>
            <button className="ghost-button" onClick={() => selectTierList(null)} type="button">
              <ArrowLeft size={16} />
              Cambiar tier list
            </button>
          </div>
        </section>

        <section className="control-panel">
          <SongForm />
          <Filters songs={currentTierList.songs} tiers={currentTierList.tiers} />
        </section>

        <div className="content-grid">
          <section className="tier-board" aria-label="Tablero de tiers">
            <TierColumn
              id={null}
              songs={getSongsForTier(visibleSongs, null)}
              title="Sin clasificar"
              tone="#111827"
              songRanks={songRanks}
            />
            {currentTierList.tiers.map((tier) => (
              <TierColumn
                id={tier.id}
                key={tier.id}
                songs={getSongsForTier(visibleSongs, tier.id)}
                title={tier.name}
                tone={tier.color}
                songRanks={songRanks}
              />
            ))}
          </section>
          <aside className="right-rail">
            <AllSongsPanel songs={visibleSongs} />
          </aside>
        </div>
      </main>
      <SideDrawer isOpen={drawer === "tiers"} onClose={() => setDrawer(null)} title="Configurar tiers">
        <TierManager tiers={currentTierList.tiers} />
      </SideDrawer>
      <SideDrawer isOpen={drawer === "stats"} onClose={() => setDrawer(null)} title="Estadísticas">
        <Stats songs={currentTierList.songs} tiers={currentTierList.tiers} />
      </SideDrawer>
      <DragOverlay>
        {activeSong ? (
          <article className={["song-card", "overlay", isSpecialActiveSong && "special-tier-card"].filter(Boolean).join(" ")}>
            <SongCardView compact song={activeSong} rank={songRanks.get(activeSong.id)} />
          </article>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
