import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { useTierBoardStore } from "../../store/useTierBoardStore";
import type { Song, SongInput } from "../../types";

const emptySong: SongInput = { title: "", artist: "", featuring: "", album: "" };

export function SongForm({ editingSong, onDone }: { editingSong?: Song; onDone?: () => void }) {
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
