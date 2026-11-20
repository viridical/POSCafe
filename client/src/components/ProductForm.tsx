
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Category, Product } from "../types";

interface ProductFormProps {
  initialData?: Product | null;
  categories: Category[];
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

export default function ProductForm({
  initialData,
  categories,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [isAvailable, setIsAvailable] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(initialData?.name || "");
    setCategoryId(initialData?.category_id ? String(initialData.category_id) : "");
    setDescription(initialData?.description || "");
    setPrice(initialData?.price != null ? String(initialData.price) : "");
    setStock(initialData?.stock != null ? String(initialData.stock) : "0");
    setIsAvailable(initialData?.is_available ?? true);
    setImage(null);
  }, [initialData]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("category_id", categoryId);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("stock", stock);
    formData.append("is_available", String(isAvailable));

    if (image) formData.append("image", image);

    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Nama Produk</label>
        <input required value={name} onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500"
          placeholder="Nama produk" />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Kategori</label>
        <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-red-500">
          <option value="">Pilih kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Deskripsi</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500"
          rows={3} placeholder="Deskripsi produk" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-2 block text-sm font-medium">Harga</label>
          <input required min="0" type="number" value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500"
            placeholder="15000" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Stok</label>
          <input required min="0" type="number" value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500" />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Foto Produk</label>
        <input type="file" accept="image/png,image/jpeg,image/webp"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          className="w-full rounded-xl border border-gray-200 p-3 text-sm" />
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" checked={isAvailable}
          onChange={(e) => setIsAvailable(e.target.checked)}
          className="h-4 w-4 accent-red-600" />
        Produk tersedia
      </label>

      <div className="flex justify-end gap-3 pt-3">
        <button type="button" onClick={onCancel}
          className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold">
          Batal
        </button>
        <button type="submit" disabled={loading}
          className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? "Menyimpan..." : "Simpan Produk"}
        </button>
      </div>
    </form>
  );
}
