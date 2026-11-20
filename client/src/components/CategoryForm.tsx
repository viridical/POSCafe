import { useEffect, useState } from "react";
import type { Category } from "../types";

interface CategoryFormProps {
  category?: Category | null;
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
}

export default function CategoryForm({
  category,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(category?.name || "");
  }, [category]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Nama kategori wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      await onSubmit(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan kategori.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Nama Kategori
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Coffee"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : category ? "Simpan Perubahan" : "Tambah Kategori"}
        </button>
      </div>
    </form>
  );
}