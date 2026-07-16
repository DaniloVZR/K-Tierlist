import { useRef, useState, useMemo, useCallback } from "react";
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
import type { Song, Tier } from "../../types";

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

  // ── Refs that always hold the latest data ─────────────────────────────────
  // Drag callbacks are created ONCE (deps=[]) and read these refs so they
  // never need to be recreated, preventing DndContext from seeing new prop
  // references on every state change.
  const songsRef = useRef<Song[]>([]);
  const tiersRef = useRef<Tier[]>([]);
  const moveSongRef = useRef(moveSong);

  // Tracks where the dragged song will land (updated only via ref during drag)
  const overContainerRef = useRef<string | null>(null);
  const overSongIdRef = useRef<string | null>(null);

  if (!tierList) {
    return <HomePage />;
  }

  const currentTierList = tierList;

  // Update refs every render so callbacks always read current data
  songsRef.current = currentTierList.songs;
  tiersRef.current = currentTierList.tiers;
  moveSongRef.current = moveSong;

  // ── Derived data (for rendering only) ────────────────────────────────────
  const visibleSongs = useMemo(
    () => getVisibleSongs(currentTierList.songs, query, artistFilter, tierFilter),
    [currentTierList.songs, query, artistFilter, tierFilter]
  );

  const activeSong = useMemo(
    () => currentTierList.songs.find((song) => song.id === activeSongId),
    [currentTierList.songs, activeSongId]
  );

  const songRanks = useMemo(() => {
    const ranked = currentTierList.tiers.flatMap((tier) =>
      getSongsForTier(currentTierList.songs, tier.id)
    );
    const map = new Map<string, number>();
    ranked.forEach((song, index) => map.set(song.id, index + 1));
    return map;
  }, [currentTierList.songs, currentTierList.tiers]);

  const activeSongTier = useMemo(
    () => (activeSong ? currentTierList.tiers.find((t) => t.id === activeSong.tierId) : null),
    [activeSong, currentTierList.tiers]
  );
  const isSpecialActiveSong = activeSongTier?.name === "10";

  // containerIds is stable as long as tiers don't change structure
  const tierIdsKey = currentTierList.tiers.map((t) => t.id).join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const containerIds = useMemo<UniqueIdentifier[]>(
    () => ["unranked", ...currentTierList.tiers.map((tier) => tier.id)],
    [tierIdsKey]
  );

  const collisionDetection = useMemo(
    () => buildCollisionDetection(containerIds),
    [containerIds]
  );

  // ── Helpers — stable forever via refs ─────────────────────────────────────
  const resolveContainerId = useCallback((overId: string): string | null => {
    if (overId === "unranked") return null;
    if (tiersRef.current.some((t) => t.id === overId)) return overId;
    const overSong = songsRef.current.find((s) => s.id === overId);
    if (overSong) return overSong.tierId ?? null;
    return null;
  }, []);

  // ── Drag handlers — created ONCE, zero store calls during drag ────────────
  //
  // KEY FIX: calling moveSong() inside onDragOver causes @dnd-kit to remount
  // SortableSongCards between SortableContexts while the drag is still active.
  // useSortable's internal useLayoutEffect then calls measureRect → setState
  // → re-render → measureRect → infinite loop, crashing React.
  //
  // Solution: NEVER update the store during drag. Only track the intended
  // target via refs. The DragOverlay provides all visual feedback.
  // One single moveSong() call fires when the user releases (onDragEnd).

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeId = String(event.active.id);
    setActiveSongId(activeId);
    overContainerRef.current = null;
    overSongIdRef.current = null;
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    // Only track the target — NO store update, NO setState.
    // Moving the song between SortableContexts during a live drag causes
    // @dnd-kit's measureRect useLayoutEffect to loop infinitely.
    overContainerRef.current = resolveContainerId(overId);

    const isOverSong = songsRef.current.some((s) => s.id === overId);
    overSongIdRef.current = isOverSong ? overId : null;
  }, [resolveContainerId]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveSongId(null);

    const targetContainer = overContainerRef.current;
    const targetSongId = overSongIdRef.current;
    overContainerRef.current = null;
    overSongIdRef.current = null;

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    // Resolve final container from the over element (most reliable on drop)
    const finalContainer = resolveContainerId(overId);
    const isOverSong = songsRef.current.some((s) => s.id === overId);
    const beforeId = isOverSong ? overId : (targetSongId ?? undefined);

    // Single, clean store update — drag is fully over, no remounting issues
    moveSongRef.current(activeId, finalContainer ?? targetContainer, beforeId);
  }, [resolveContainerId]);

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
          <article
            className={[
              "song-card",
              "overlay",
              isSpecialActiveSong && "special-tier-card",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <SongCardView compact song={activeSong} rank={songRanks.get(activeSong.id)} />
          </article>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
