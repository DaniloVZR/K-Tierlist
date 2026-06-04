import { FormEvent, MouseEvent, ReactNode, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  BarChart3,
  ListMusic,
  Music,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { getActiveTierList, getSongsForTier, getVisibleSongs } from "./store/selectors";
import { useTierBoardStore } from "./store/useTierBoardStore";
import type { Song, SongInput, Tier, TierList, TierListInput } from "./types";

const emptySong: SongInput = { title: "", artist: "", featuring: "", album: "" };
const emptyTierList: TierListInput = { name: "", year: "" };

function AppHeader() {
  const activeTierListId = useTierBoardStore((state) => state.activeTierListId);
  const selectTierList = useTierBoardStore((state) => state.selectTierList);

  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">Tier list manager</p>
        <h1>K-Ranking</h1>
      </div>
      <div className="header-actions">
        {activeTierListId ? (
          <button className="ghost-button" onClick={() => selectTierList(null)} type="button">
            <ArrowLeft size={16} />
            Menú
          </button>
        ) : null}
      </div>
    </header>
  );
}

function TierListForm() {
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

function TierListCard({ tierList, onOpen }: { tierList: TierList; onOpen: () => void }) {
  const updateTierList = useTierBoardStore((state) => state.updateTierList);
  const deleteTierList = useTierBoardStore((state) => state.deleteTierList);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<TierListInput>({
    name: tierList.name,
    year: tierList.year,
  });

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
    <article className="tier-list-card">
      <div>
        <p>{tierList.year}</p>
        <h3>{tierList.name}</h3>
        <span>
          {tierList.tiers.length} tiers · {tierList.songs.length} canciones
        </span>
      </div>
      <div className="card-actions">
        <button className="primary-button" onClick={onOpen} type="button">
          Abrir
        </button>
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
          aria-label="Eliminar tier list"
          className="icon-button"
          onClick={() => deleteTierList(tierList.id)}
          type="button"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}

function HomePage() {
  const tierLists = useTierBoardStore((state) => state.tierLists);
  const selectTierList = useTierBoardStore((state) => state.selectTierList);
  const sortedTierLists = [...tierLists].sort((a, b) => {
    const yearCompare = a.year.localeCompare(b.year, undefined, { numeric: true });
    return yearCompare || a.name.localeCompare(b.name);
  });

  return (
    <main className="home-page">
      <section className="home-heading">
        <div>
          <p className="eyebrow">Menú principal</p>
          <h2>Mis tier lists</h2>
        </div>
        <TierListForm />
      </section>

      <section className="tier-list-grid" aria-label="Tier lists creadas">
        {sortedTierLists.length ? (
          sortedTierLists.map((tierList) => (
            <TierListCard
              key={tierList.id}
              onOpen={() => selectTierList(tierList.id)}
              tierList={tierList}
            />
          ))
        ) : (
          <div className="empty-state">
            <ListMusic size={32} />
            <h3>Aún no hay tier lists</h3>
            <p>Crea la primera desde el formulario superior y luego configura sus tiers.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function SongForm({ editingSong, onDone }: { editingSong?: Song; onDone?: () => void }) {
  const addSong = useTierBoardStore((state) => state.addSong);
  const updateSong = useTierBoardStore((state) => state.updateSong);
  const [form, setForm] = useState<SongInput>(
    editingSong
      ? {
          title: editingSong.title,
          artist: editingSong.artist,
          featuring: editingSong.featuring ?? "",
          album: editingSong.album ?? "",
        }
      : emptySong,
  );
  const canSubmit = form.title.trim().length > 0 && form.artist.trim().length > 0;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    if (editingSong) {
      updateSong(editingSong.id, form);
      onDone?.();
      return;
    }

    addSong(form);
    setForm(emptySong);
  }

  return (
    <form className="song-form" onSubmit={submit}>
      <label>
        Título
        <input
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          placeholder="Nombre de la canción"
        />
      </label>
      <label>
        Artista
        <input
          value={form.artist}
          onChange={(event) => setForm({ ...form, artist: event.target.value })}
          placeholder="Artista"
        />
      </label>
      <label>
        Colaboración
        <input
          value={form.featuring}
          onChange={(event) => setForm({ ...form, featuring: event.target.value })}
          placeholder="Opcional"
        />
      </label>
      <label>
        Álbum
        <input
          value={form.album}
          onChange={(event) => setForm({ ...form, album: event.target.value })}
          placeholder="Opcional"
        />
      </label>
      <button className="primary-button" disabled={!canSubmit} type="submit">
        <Plus size={16} />
        {editingSong ? "Guardar" : "Agregar"}
      </button>
    </form>
  );
}

function TierManager({ tiers }: { tiers: Tier[] }) {
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

function Filters({ songs, tiers }: { songs: Song[]; tiers: Tier[] }) {
  const query = useTierBoardStore((state) => state.query);
  const artistFilter = useTierBoardStore((state) => state.artistFilter);
  const tierFilter = useTierBoardStore((state) => state.tierFilter);
  const setQuery = useTierBoardStore((state) => state.setQuery);
  const setArtistFilter = useTierBoardStore((state) => state.setArtistFilter);
  const setTierFilter = useTierBoardStore((state) => state.setTierFilter);
  const artists = [...new Set(songs.map((song) => song.artist))].sort();

  return (
    <div className="filters">
      <label className="search-field">
        <Search size={16} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar canción, artista o álbum"
        />
      </label>
      <select value={artistFilter} onChange={(event) => setArtistFilter(event.target.value)}>
        <option value="all">Todos los artistas</option>
        {artists.map((artist) => (
          <option key={artist} value={artist}>
            {artist}
          </option>
        ))}
      </select>
      <select value={tierFilter} onChange={(event) => setTierFilter(event.target.value)}>
        <option value="all">Todos los tiers</option>
        <option value="unranked">Sin clasificar</option>
        {tiers.map((tier) => (
          <option key={tier.id} value={tier.id}>
            {tier.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function SongCardView({ song, compact = false }: { song: Song; compact?: boolean }) {
  return (
    <div className={compact ? "song-copy compact" : "song-copy"}>
      <strong>{song.title}</strong>
      <span>{song.featuring ? `${song.artist} · ${song.featuring}` : song.artist}</span>
      {song.album ? <small>{song.album}</small> : null}
    </div>
  );
}

function SortableSongCard({ song }: { song: Song }) {
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

  return (
    <article
      className={isDragging ? "song-card dragging" : "song-card"}
      onClick={() => setIsMenuOpen(false)}
      onContextMenu={openMenu}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <SongCardView song={song} />
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

function TierColumn({
  id,
  title,
  songs,
  tone,
}: {
  id: string | null;
  title: string;
  songs: Song[];
  tone: string;
}) {
  const droppableId = id ? `drop-${id}` : "drop-unranked";
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  return (
    <section className={isOver ? "tier-row over" : "tier-row"} ref={setNodeRef}>
      <div className="tier-label" style={{ background: tone }}>
        {title}
      </div>
      <SortableContext items={songs.map((song) => song.id)} strategy={verticalListSortingStrategy}>
        <div className="tier-dropzone">
          {songs.length ? (
            songs.map((song) => <SortableSongCard key={song.id} song={song} />)
          ) : (
            <div className="empty-tier">Suelta canciones aquí</div>
          )}
        </div>
      </SortableContext>
    </section>
  );
}

function AllSongsPanel({ songs }: { songs: Song[]; tiers: Tier[] }) {
  return (
    <section className="all-songs-panel">
      <div className="panel-title">
        <h3>Todas las canciones</h3>
        <span>{songs.length}</span>
      </div>
      <div className="all-song-list">
        {songs.length ? (
          songs.map((song) => (
            <article className="song-list-item" key={song.id}>
              <strong>{song.title}</strong>
              <span>{song.artist}</span>
            </article>
          ))
        ) : (
          <p className="muted">Agrega canciones para ver aquí el listado completo del año.</p>
        )}
      </div>
    </section>
  );
}

function Stats({ songs, tiers }: { songs: Song[]; tiers: Tier[] }) {
  const topArtists = [...songs]
    .reduce<Map<string, number>>((map, song) => {
      map.set(song.artist, (map.get(song.artist) ?? 0) + 1);
      return map;
    }, new Map())
    .entries();
  const artistRows = [...topArtists].sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <section className="stats-panel">
      <h3>
        <BarChart3 size={18} />
        Estadísticas
      </h3>
      <div className="stat-block">
        <span>Total canciones</span>
        <strong>{songs.length}</strong>
      </div>
      <div className="stat-list">
        {tiers.map((tier) => (
          <div key={tier.id}>
            <span>{tier.name}</span>
            <strong>{getSongsForTier(songs, tier.id).length}</strong>
          </div>
        ))}
      </div>
      <div className="stat-list">
        {artistRows.map(([artist, count]) => (
          <div key={artist}>
            <span>{artist}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function SideDrawer({
  title,
  isOpen,
  onClose,
  children,
}: {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="side-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-header">
          <h3>{title}</h3>
          <button aria-label="Cerrar" className="icon-button" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}

function BoardPage() {
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

  if (!tierList) {
    return <HomePage />;
  }

  const currentTierList = tierList;
  const visibleSongs = getVisibleSongs(currentTierList.songs, query, artistFilter, tierFilter);
  const activeSong = currentTierList.songs.find((song) => song.id === activeSongId);

  function handleDragStart(event: DragStartEvent) {
    setActiveSongId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const overId = event.over?.id ? String(event.over.id) : null;
    const songId = String(event.active.id);
    setActiveSongId(null);

    if (!overId || songId === overId) {
      return;
    }

    const overSong = currentTierList.songs.find((song) => song.id === overId);
    if (overSong) {
      moveSong(songId, overSong.tierId ?? null, overSong.id);
      return;
    }

    if (overId === "drop-unranked") {
      moveSong(songId, null);
      return;
    }

    if (overId.startsWith("drop-")) {
      moveSong(songId, overId.slice(5));
    }
  }

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
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
              <BarChart3 size={16} />
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
            />
            {currentTierList.tiers.map((tier) => (
              <TierColumn
                id={tier.id}
                key={tier.id}
                songs={getSongsForTier(visibleSongs, tier.id)}
                title={tier.name}
                tone={tier.color}
              />
            ))}
          </section>
          <aside className="right-rail">
            <AllSongsPanel songs={currentTierList.songs} tiers={currentTierList.tiers} />
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
          <article className="song-card overlay">
            <SongCardView compact song={activeSong} />
          </article>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export function App() {
  const activeTierListId = useTierBoardStore((state) => state.activeTierListId);

  return (
    <div className="app-shell">
      <AppHeader />
      {activeTierListId ? <BoardPage /> : <HomePage />}
    </div>
  );
}
