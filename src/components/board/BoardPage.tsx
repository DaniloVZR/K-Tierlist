import { FormEvent, useRef, useState, useMemo, useCallback } from "react";
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
import { ArrowLeft, ChartColumn, Copy, Download, Music, Pencil, Settings2, Trash2, X } from "lucide-react";
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
import type { Song, Tier, TierListInput } from "../../types";

export function BoardPage() {
  const tierLists = useTierBoardStore((state) => state.tierLists);
  const activeTierListId = useTierBoardStore((state) => state.activeTierListId);
  const query = useTierBoardStore((state) => state.query);
  const artistFilter = useTierBoardStore((state) => state.artistFilter);
  const tierFilter = useTierBoardStore((state) => state.tierFilter);
  const moveSong = useTierBoardStore((state) => state.moveSong);
  const selectTierList = useTierBoardStore((state) => state.selectTierList);
  const updateTierList = useTierBoardStore((state) => state.updateTierList);
  const updateTierListCover = useTierBoardStore((state) => state.updateTierListCover);
  const deleteTierList = useTierBoardStore((state) => state.deleteTierList);
  const cloneTierList = useTierBoardStore((state) => state.cloneTierList);

  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<"tiers" | "stats" | null>(null);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [editForm, setEditForm] = useState<TierListInput>({ name: "", year: "" });
  const [editCoverUrl, setEditCoverUrl] = useState("");

  const tierList = getActiveTierList(tierLists, activeTierListId);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // ── Refs that always hold the latest data ─────────────────────────────────
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

    const finalContainer = resolveContainerId(overId);
    const isOverSong = songsRef.current.some((s) => s.id === overId);
    const beforeId = isOverSong ? overId : (targetSongId ?? undefined);

    moveSongRef.current(activeId, finalContainer ?? targetContainer, beforeId);
  }, [resolveContainerId]);

  // ── Tier list meta actions ────────────────────────────────────────────────
  function openEditMeta() {
    setEditForm({ name: currentTierList.name, year: currentTierList.year });
    setEditCoverUrl(currentTierList.coverImage ?? "");
    setIsEditingMeta(true);
  }

  function submitEditMeta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateTierList(currentTierList.id, editForm);
    updateTierListCover(currentTierList.id, editCoverUrl.trim() || null);
    setIsEditingMeta(false);
  }

  function handleDeleteTierList() {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la tier list "${currentTierList.name}"?`)) {
      selectTierList(null);
      deleteTierList(currentTierList.id);
    }
  }

  function handleClone() {
    cloneTierList(currentTierList.id);
  }

  function exportToJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentTierList, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${currentTierList.name.replace(/\s+/g, "_")}-${currentTierList.year}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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
          <div className="board-heading-info">
            {currentTierList.coverImage && (
              <img
                className="board-cover-thumb"
                src={currentTierList.coverImage}
                alt=""
                aria-hidden="true"
              />
            )}
            <div className="board-heading-text">
              <p className="board-eyebrow">Tier list</p>
              <h2 className="board-title">{currentTierList.name}</h2>
              <span className="board-year">{currentTierList.year}</span>
            </div>
          </div>
          <div className="heading-actions">
            {/* Tier list meta actions */}
            <button
              aria-label="Editar tier list"
              className="icon-button"
              data-tooltip="Editar"
              onClick={openEditMeta}
              type="button"
            >
              <Pencil size={16} />
            </button>
            <button
              aria-label="Clonar tier list"
              className="icon-button"
              data-tooltip="Clonar"
              onClick={handleClone}
              type="button"
            >
              <Copy size={16} />
            </button>
            <button
              aria-label="Exportar JSON"
              className="icon-button"
              data-tooltip="Exportar JSON"
              onClick={exportToJson}
              type="button"
            >
              <Download size={16} />
            </button>
            <button
              aria-label="Eliminar tier list"
              className="icon-button icon-button--danger"
              data-tooltip="Eliminar"
              onClick={handleDeleteTierList}
              type="button"
            >
              <Trash2 size={16} />
            </button>

            <div className="heading-divider" />

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

      {/* Edit tier list meta modal */}
      {isEditingMeta && (
        <>
          <div className="drawer-backdrop" onClick={() => setIsEditingMeta(false)} />
          <div className="tierlist-edit-modal">
            <div className="tierlist-edit-modal-header">
              <h3>Editar tier list</h3>
              <button
                className="icon-button"
                aria-label="Cerrar"
                onClick={() => setIsEditingMeta(false)}
                type="button"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={submitEditMeta} className="tier-list-edit-form">
              <label>
                Nombre
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  autoFocus
                />
              </label>
              <label>
                Año
                <input
                  value={editForm.year}
                  onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                />
              </label>
              <label>
                Imagen de portada (URL)
                <input
                  type="url"
                  value={editCoverUrl}
                  placeholder="https://..."
                  onChange={(e) => setEditCoverUrl(e.target.value)}
                />
              </label>
              {editCoverUrl && (
                <div className="cover-preview">
                  <img src={editCoverUrl} alt="Vista previa de portada" />
                </div>
              )}
              <div className="card-actions">
                <button className="primary-button" type="submit">
                  Guardar
                </button>
                <button className="ghost-button" onClick={() => setIsEditingMeta(false)} type="button">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </>
      )}

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
