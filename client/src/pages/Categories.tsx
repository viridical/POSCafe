import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Tags, RefreshCw } from "lucide-react";
import Header from "../components/Header";
import Modal from "../components/Modal";
import CategoryForm from "../components/CategoryForm";
import ConfirmDialog from "../components/ConfirmDialog";
import SearchInput from "../components/SearchInput";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/categoryService";
import type { Category } from "../types";

interface CategoriesProps {
  onMenuClick?: () => void;
}

export default function Categories({ onMenuClick }: CategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat kategori.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function openCreateModal() {
    setSelectedCategory(null);
    setModalOpen(true);
  }

  function openEditModal(category: Category) {
    setSelectedCategory(category);
    setModalOpen(true);
  }

  async function handleSave(name: string) {
    if (selectedCategory) {
      await updateCategory(selectedCategory.id, name);
    } else {
      await createCategory(name);
    }

    setModalOpen(false);
    setSelectedCategory(null);
    await loadCategories();
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus kategori.");
    } finally {
      setDeleting(false);
    }
  }

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Header
        title="Kategori"
        subtitle="Kelola kategori menu cafe"
        onMenuClick={onMenuClick}
      />

      <main className="space-y-6 p-4 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Daftar Kategori
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Total {categories.length} kategori.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Plus size={18} />
            Tambah Kategori
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari kategori..."
          />

          <button
            onClick={loadCategories}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <Loading text="Memuat kategori..." />
        ) : filteredCategories.length === 0 ? (
          <EmptyState
            title="Kategori tidak ditemukan"
            description="Belum ada kategori yang cocok dengan pencarian."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <Tags size={22} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {category.name}
                    </h3>
                    <p className="mt-1 text-xs text-gray-400">
                      ID Kategori: {category.id}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(category)}
                    className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                    title="Edit"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    onClick={() => setDeleteTarget(category)}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    title="Hapus"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal
        open={modalOpen}
        title={selectedCategory ? "Edit Kategori" : "Tambah Kategori"}
        onClose={() => setModalOpen(false)}
      >
        <CategoryForm
          category={selectedCategory}
          onSubmit={handleSave}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Kategori"
        message={`Yakin ingin menghapus kategori "${deleteTarget?.name}"? Produk yang memakai kategori ini bisa membuat penghapusan ditolak database.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}