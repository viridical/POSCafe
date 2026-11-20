import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, RefreshCw } from "lucide-react";
import type { Product, Category } from "../types";
import { getAdminProducts, createProduct, updateProduct, deleteProduct } from "../services/productService";
import { getCategories } from "../services/categoryService";
import ProductForm from "../components/ProductForm";

interface ProductsProps {
  onMenuClick: () => void;
}

export default function Products({ onMenuClick }: ProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [productData, categoryData] = await Promise.all([
        getAdminProducts(),
        getCategories(),
      ]);

      setProducts(productData);
      setCategories(categoryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(data: FormData) {
    try {
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, data);
      } else {
        await createProduct(data);
      }

      setModalOpen(false);
      setSelectedProduct(null);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan produk");
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Yakin ingin menghapus produk ini?")) return;

    try {
      await deleteProduct(id);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus produk");
    }
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  function openCreateModal() {
    setSelectedProduct(null);
    setModalOpen(true);
  }

  function openEditModal(product: Product) {
    setSelectedProduct(product);
    setModalOpen(true);
  }

  return (
    <div className="min-h-screen p-5 md:p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="rounded-lg border p-2 lg:hidden">
            ☰
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Produk</h1>
            <p className="text-sm text-gray-500">Kelola menu dan produk cafe</p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
        >
          <Plus size={18} />
          Tambah Produk
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 outline-none focus:border-red-500"
          />
        </div>

        <button
          onClick={loadData}
          className="rounded-xl border border-gray-200 bg-white p-3 text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw size={19} />
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Memuat produk...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            Produk tidak ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-5 py-4">Produk</th>
                  <th className="px-5 py-4">Kategori</th>
                  <th className="px-5 py-4">Harga</th>
                  <th className="px-5 py-4">Stok</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img
                            src={`http://localhost:5000${product.image_url}`}
                            alt={product.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                            No img
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{product.name}</p>
                          <p className="max-w-[200px] truncate text-xs text-gray-400">
                            {product.description || "-"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {product.category_name || "-"}
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900">
                      Rp {Number(product.price).toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {product.stock ?? 0}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        product.is_available
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-600"
                      }`}>
                        {product.is_available ? "Tersedia" : "Tidak tersedia"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {selectedProduct ? "Edit Produk" : "Tambah Produk"}
              </h2>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setSelectedProduct(null);
                }}
                className="text-xl text-gray-400"
              >
                ×
              </button>
            </div>

            <ProductForm
              initialData={selectedProduct}
              categories={categories}
              onSubmit={handleSubmit}
              onCancel={() => {
                setModalOpen(false);
                setSelectedProduct(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
