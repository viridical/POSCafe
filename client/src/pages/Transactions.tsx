import { useEffect, useMemo, useState } from "react";
import { Eye, RefreshCw, Receipt } from "lucide-react";
import Header from "../components/Header";
import Modal from "../components/Modal";
import SearchInput from "../components/SearchInput";
import StatusBadge from "../components/StatusBadge";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { getOrders, getOrderDetail } from "../services/transactionService";
import type { Order } from "../types";

interface TransactionsProps {
  onMenuClick?: () => void;
}

const formatRupiah = (value: number) =>
  `Rp${Number(value || 0).toLocaleString("id-ID")}`;

export default function Transactions({ onMenuClick }: TransactionsProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");
      setOrders(await getOrders());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat transaksi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function openDetail(order: Order) {
    try {
      setDetailLoading(true);
      setDetailOpen(true);
      setSelectedOrder(null);

      const result: any = await getOrderDetail(order.order_number);
      setSelectedOrder(result.data || result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat detail.");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch = [
        order.order_number,
        order.customer_name || "",
        order.cashier || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" ||
        order.payment_status?.toLowerCase() === filter;

      return matchesSearch && matchesFilter;
    });
  }, [orders, search, filter]);

  return (
    <div>
      <Header
        title="Transaksi"
        subtitle="Riwayat seluruh transaksi POSCafe"
        onMenuClick={onMenuClick}
      />

      <main className="space-y-6 p-4 sm:p-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Riwayat Transaksi
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Total {orders.length} transaksi tercatat.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari nomor order atau pelanggan..."
          />

          <div className="flex flex-wrap gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-red-500"
            >
              <option value="all">Semua Status</option>
              <option value="paid">Lunas</option>
              <option value="pending">Pending</option>
              <option value="unpaid">Belum Dibayar</option>
              <option value="failed">Gagal</option>
            </select>

            <button
              onClick={loadOrders}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <Loading text="Memuat transaksi..." />
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            title="Transaksi tidak ditemukan"
            description="Belum ada transaksi yang sesuai pencarian."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Nomor Order</th>
                    <th className="px-5 py-4">Pelanggan</th>
                    <th className="px-5 py-4">Kasir</th>
                    <th className="px-5 py-4">Metode</th>
                    <th className="px-5 py-4">Total</th>
                    <th className="px-5 py-4">Pembayaran</th>
                    <th className="px-5 py-4 text-right">Detail</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-semibold text-gray-800">
                        {order.order_number}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {order.customer_name || "Umum"}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {order.cashier || "-"}
                      </td>

                      <td className="px-5 py-4 uppercase text-gray-600">
                        {order.payment_method}
                      </td>

                      <td className="px-5 py-4 font-semibold text-gray-800">
                        {formatRupiah(order.total_amount)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={order.payment_status} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <button
                            onClick={() => openDetail(order)}
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                            title="Lihat detail"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Modal
        open={detailOpen}
        title="Detail Transaksi"
        onClose={() => setDetailOpen(false)}
        width="max-w-2xl"
      >
        {detailLoading ? (
          <Loading text="Memuat detail transaksi..." />
        ) : selectedOrder ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Receipt size={23} />
              </div>
              <div>
                <p className="font-bold text-gray-900">
                  {selectedOrder.order?.order_number ||
                    selectedOrder.order_number}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedOrder.order?.customer_name ||
                    selectedOrder.customer_name ||
                    "Pelanggan umum"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {(selectedOrder.items || []).map((item: any, index: number) => (
                <div
                  key={item.id || index}
                  className="flex justify-between gap-4 text-sm"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {item.product_name || item.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} × {formatRupiah(item.price)}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-800">
                    {formatRupiah(
                      item.subtotal ?? item.quantity * item.price
                    )}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>
                  {formatRupiah(
                    selectedOrder.order?.total_amount ??
                      selectedOrder.total_amount ??
                      0
                  )}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Detail transaksi tidak tersedia.</p>
        )}
      </Modal>
    </div>
  );
}