import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  RefreshCw,
  Coffee,
  CheckCircle2,
  Copy,
} from "lucide-react";

import Header from "../components/Header";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import ProductCard from "../components/ProductCard";
import Modal from "../components/Modal";

import { getProducts } from "../services/productService";
import { getCategories } from "../services/categoryService";
import { createOrder } from "../services/transactionService";

import type { Product, Category, CartItem } from "../types";

interface CashierProps {
  onMenuClick?: () => void;
}

type PaymentMethod = "cash" | "snap" | "qris";

const formatRupiah = (value: number) =>
  `Rp${Number(value || 0).toLocaleString("id-ID")}`;

export default function Cashier({ onMenuClick }: CashierProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");

  const [customerName, setCustomerName] = useState("");
  const [orderType, setOrderType] = useState("dine_in");
  const [tableNumber, setTableNumber] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash");

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentResultOpen, setPaymentResultOpen] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [successPopupOpen, setSuccessPopupOpen] = useState(false);
  useEffect(() => {
  if (!successPopupOpen) return;

  const timer = window.setTimeout(() => {
    setSuccessPopupOpen(false);
  }, 2000);

    return () => window.clearTimeout(timer);
  }, [successPopupOpen]);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [productData, categoryData] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);

      setProducts(Array.isArray(productData) ? productData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat menu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const categoryNames = useMemo(
    () => ["Semua", ...categories.map((category) => category.name)],
    [categories]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "Semua" ||
        product.category_name?.toLowerCase() === activeCategory.toLowerCase();

      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesCategory && matchesSearch && product.is_available;
    });
  }, [products, activeCategory, search]);

  const subtotal = cart.reduce(
    (total, item) => total + Number(item.product.price) * item.quantity,
    0
  );

  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find(
        (item) => item.product.id === product.id
      );

      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: number, amount: number) {
    setCart((current) =>
      current
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(productId: number) {
    setCart((current) =>
      current.filter((item) => item.product.id !== productId)
    );
  }

  function resetOrder() {
    setCart([]);
    setCustomerName("");
    setOrderType("dine_in");
    setTableNumber("");
    setPaymentMethod("cash");
    setCheckoutOpen(false);
  }

  async function handleCheckout() {
    if (cart.length === 0) {
      setError("Keranjang masih kosong.");
      return;
    }

    if (orderType === "dine_in" && !tableNumber.trim()) {
      setError("Nomor meja wajib diisi untuk pesanan dine in.");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setSuccess("");

      const result = await createOrder({
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        payment_method: paymentMethod,
        customer_name: customerName.trim() || "Pelanggan Umum",
        order_type: orderType,
        table_number: orderType === "dine_in" ? tableNumber.trim() : undefined,
      });

      setPaymentResult(result);
      setCheckoutOpen(false);

      if (paymentMethod === "cash") {
        setSuccessPopupOpen(true);
        resetOrder();
      } else if (paymentMethod === "snap" && result.redirect_url) {
        setPaymentResultOpen(true);
      } else if (paymentMethod === "qris") {
        setPaymentResultOpen(true);
      } else {
        setError("Transaksi dibuat, tetapi informasi pembayaran tidak tersedia.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaksi gagal dibuat.");
    } finally {
      setProcessing(false);
    }
  }

  function closePaymentResult() {
    setPaymentResultOpen(false);
    setPaymentResult(null);
    resetOrder();
  }

  async function copyQRString() {
    if (!paymentResult?.qr_string) return;

    try {
      await navigator.clipboard.writeText(paymentResult.qr_string);
      setSuccess("QR string berhasil disalin.");
    } catch {
      setError("Tidak bisa menyalin QR string.");
    }
  }

  return (
    <div>
      <Header
        title="Kasir"
        subtitle="Buat pesanan dan proses pembayaran"
        onMenuClick={onMenuClick}
      />

      <main className="grid min-h-[calc(100vh-80px)] gap-6 p-4 xl:grid-cols-[1fr_380px] sm:p-8">
        <section className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Menu Produk</h2>
              <p className="mt-1 text-sm text-gray-500">
                Pilih produk untuk dimasukkan ke keranjang.
              </p>
            </div>

            <button
              onClick={loadData}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 hover:bg-gray-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          <div className="relative">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama produk..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 outline-none focus:border-red-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categoryNames.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  activeCategory === category
                    ? "bg-red-600 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {loading ? (
            <Loading text="Memuat menu..." />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              title="Menu tidak ditemukan"
              description="Coba pilih kategori lain atau ubah kata pencarian."
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 2xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="flex min-h-[600px] flex-col rounded-2xl border border-gray-100 bg-white shadow-sm xl:sticky xl:top-24 xl:h-[calc(100vh-120px)]">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Keranjang</h2>
              <p className="mt-1 text-xs text-gray-400">
                {cart.reduce((total, item) => total + item.quantity, 0)} item
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <ShoppingCart size={21} />
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {cart.length === 0 ? (
              <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <Coffee size={28} />
                </div>
                <p className="font-semibold text-gray-700">
                  Keranjang masih kosong
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  Pilih menu untuk memulai pesanan.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-3 border-b border-gray-100 pb-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {item.product.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatRupiah(item.product.price)}
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <Minus size={14} />
                      </button>

                      <span className="min-w-4 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <p className="text-sm font-bold text-gray-900">
                      {formatRupiah(
                        Number(item.product.price) * item.quantity
                      )}
                    </p>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-4 border-t border-gray-100 p-5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>

            <div className="flex justify-between border-t border-gray-100 pt-4 text-base font-bold text-gray-900">
              <span>Total</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>

            <button
              onClick={() => {
                setError("");
                setCheckoutOpen(true);
              }}
              disabled={cart.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <CreditCard size={19} />
              Checkout
            </button>
          </div>
        </aside>
      </main>

      <Modal
        open={checkoutOpen}
        title="Checkout Pesanan"
        onClose={() => setCheckoutOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Nama Pelanggan
            </label>
            <input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Nama pelanggan"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Tipe Pesanan
            </label>
            <select
              value={orderType}
              onChange={(event) => setOrderType(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-red-500"
            >
              <option value="dine_in">Dine In</option>
              <option value="takeaway">Take Away</option>
            </select>
          </div>

          {orderType === "dine_in" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Nomor Meja
              </label>
              <input
                value={tableNumber}
                onChange={(event) => setTableNumber(event.target.value)}
                placeholder="Contoh: 05"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Metode Pembayaran
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "cash", label: "Tunai" },
                { id: "snap", label: "Midtrans" },
                { id: "qris", label: "QRIS" },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() =>
                    setPaymentMethod(method.id as PaymentMethod)
                  }
                  className={`rounded-xl border px-2 py-3 text-sm font-semibold ${
                    paymentMethod === method.id
                      ? "border-red-600 bg-red-50 text-red-600"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Total pembayaran</span>
              <span className="font-bold text-gray-900">
                {formatRupiah(subtotal)}
              </span>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            onClick={handleCheckout}
            disabled={processing || cart.length === 0}
            className="w-full rounded-xl bg-red-600 py-3.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {processing ? "Memproses transaksi..." : "Buat Transaksi"}
          </button>
        </div>
      </Modal>

      <Modal
        open={paymentResultOpen}
        title="Informasi Pembayaran"
        onClose={closePaymentResult}
        width="max-w-lg"
      >
        {paymentResult?.redirect_url ? (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <CreditCard size={30} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Lanjutkan Pembayaran
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Order {paymentResult.order_number} berhasil dibuat. Lanjutkan
                pembayaran melalui halaman Midtrans.
              </p>
            </div>

            <a
              href={paymentResult.redirect_url}
              className="block w-full rounded-xl bg-red-600 py-3.5 font-semibold text-white hover:bg-red-700"
            >
              Bayar Sekarang
            </a>

            <p className="text-xs text-gray-400">
              Status pembayaran akan diperbarui melalui notifikasi Midtrans.
            </p>
          </div>
        ) : paymentResult?.qr_string ? (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
              <CheckCircle2 size={30} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">
                QRIS Berhasil Dibuat
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Order {paymentResult.order_number}
              </p>
            </div>

            <div className="break-all rounded-xl bg-gray-50 p-4 text-left text-xs text-gray-600">
              {paymentResult.qr_string}
            </div>

            <button
              onClick={copyQRString}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Copy size={17} />
              Salin QR String
            </button>

            <p className="text-xs text-gray-400">
              QR string ini belum berupa gambar QR. Gunakan QR renderer atau
              action URL dari respons Midtrans untuk menampilkan kode yang bisa
              dipindai.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Informasi pembayaran tidak tersedia.
          </p>
        )}
      </Modal>
      {successPopupOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-sm animate-in zoom-in-95 rounded-2xl bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2
            size={45}
            className="text-green-600"
            strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
          Pesanan Berhasil!
          </h2>

          <p className="mt-2 text-sm text-gray-500">
          Transaksi berhasil dibuat.
          </p>

        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full w-full origin-left animate-[shrink_2s_linear_forwards] rounded-full bg-green-500" />
          </div>
        </div>
      </div>
    )}
    </div>
  );
}