import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  RefreshCw,
  Receipt,
  Printer,
} from "lucide-react";

import Header from "../components/Header";
import Modal from "../components/Modal";
import SearchInput from "../components/SearchInput";
import StatusBadge from "../components/StatusBadge";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";

import {
  getOrders,
  getOrderDetail,
} from "../services/transactionService";

import type { Order } from "../types";

interface TransactionsProps {
  onMenuClick?: () => void;
}

const formatRupiah = (value: number) =>
  `Rp${Number(value || 0).toLocaleString("id-ID")}`;

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

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

      const data = await getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat transaksi."
      );
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
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat detail."
      );

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

  function printInvoice() {
    if (!selectedOrder) return;

    const order = selectedOrder.order || selectedOrder;
    const items = selectedOrder.items || [];

    if (order.payment_status !== "paid") {
      setError("Invoice hanya tersedia untuk transaksi yang sudah lunas.");
      return;
    }

    const printWindow = window.open(
      "",
      "_blank",
      "width=800,height=900"
    );

    if (!printWindow) {
      setError("Popup cetak diblokir browser. Izinkan popup untuk POSCafe.");
      return;
    }

    const itemRows = items.map((item: any) => {
      const unitPrice = Number(item.unit_price ?? item.price ?? 0);
      const quantity = Number(item.quantity || 0);
      const subtotal = Number(
        item.subtotal ?? unitPrice * quantity
      );

      return `
        <tr>
          <td>${escapeHtml(item.product_name || item.name)}</td>
          <td class="center">${quantity}</td>
          <td class="right">${formatRupiah(unitPrice)}</td>
          <td class="right">${formatRupiah(subtotal)}</td>
        </tr>
      `;
    }).join("");

    const orderDate = order.created_at
      ? new Date(order.created_at).toLocaleString("id-ID")
      : "-";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>Invoice ${escapeHtml(order.order_number)}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            color: #222;
            padding: 35px;
            max-width: 800px;
            margin: auto;
          }

          .header {
            text-align: center;
            border-bottom: 2px dashed #999;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }

          .header h1 {
            margin: 0 0 8px;
            font-size: 26px;
          }

          .header p {
            margin: 4px 0;
            color: #666;
            font-size: 13px;
          }

          .info {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 25px;
            font-size: 13px;
          }

          .info p {
            margin: 7px 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }

          th {
            background: #f3f3f3;
            text-align: left;
          }

          th, td {
            padding: 12px 8px;
            border-bottom: 1px solid #ddd;
          }

          .center {
            text-align: center;
          }

          .right {
            text-align: right;
          }

          .total {
            margin-top: 20px;
            border-top: 2px solid #222;
            padding-top: 15px;
            text-align: right;
            font-size: 19px;
            font-weight: bold;
          }

          .payment {
            margin-top: 15px;
            font-size: 13px;
            text-align: right;
          }

          .footer {
            margin-top: 45px;
            padding-top: 20px;
            border-top: 1px dashed #999;
            text-align: center;
            font-size: 12px;
            color: #666;
          }

          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>

      <body>
        <div class="header">
          <h1>POSCAFE</h1>
          <p>INVOICE / STRUK PEMBELIAN</p>
          <p>Terima kasih telah melakukan pembelian.</p>
        </div>

        <div class="info">
          <div>
            <p><strong>Nomor Order:</strong> ${escapeHtml(order.order_number)}</p>
            <p><strong>Pelanggan:</strong> ${escapeHtml(order.customer_name || "Pelanggan Umum")}</p>
            <p><strong>Kasir:</strong> ${escapeHtml(order.cashier || "-")}</p>
          </div>

          <div>
            <p><strong>Tanggal:</strong> ${escapeHtml(orderDate)}</p>
            <p><strong>Tipe:</strong> ${escapeHtml(order.order_type || "-")}</p>
            <p><strong>Meja:</strong> ${escapeHtml(order.table_number || "-")}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Produk</th>
              <th class="center">Qty</th>
              <th class="right">Harga</th>
              <th class="right">Subtotal</th>
            </tr>
          </thead>

          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div class="total">
          Total: ${formatRupiah(Number(order.total_amount || 0))}
        </div>

        <div class="payment">
          <p>Metode Pembayaran: ${escapeHtml(order.payment_method || "-")}</p>
          <p>Status Pembayaran: LUNAS</p>
        </div>

        <div class="footer">
          <p>Invoice ini merupakan bukti transaksi POSCafe.</p>
          <p>Terima kasih atas kunjungan Anda.</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
    setError("");
  }

  const order = selectedOrder?.order || selectedOrder;

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
                  {filteredOrders.map((item) => (
                    <tr
                      key={item.id || item.order_number}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-5 py-4 font-semibold text-gray-800">
                        {item.order_number}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {item.customer_name || "Umum"}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {item.cashier || "-"}
                      </td>

                      <td className="px-5 py-4 uppercase text-gray-600">
                        {item.payment_method}
                      </td>

                      <td className="px-5 py-4 font-semibold text-gray-800">
                        {formatRupiah(Number(item.total_amount))}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={item.payment_status} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <button
                            onClick={() => openDetail(item)}
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
                  {order?.order_number}
                </p>

                <p className="text-xs text-gray-500">
                  {order?.customer_name || "Pelanggan umum"}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Kasir: {order?.cashier || "-"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {(selectedOrder.items || []).map(
                (item: any, index: number) => {
                  const price = Number(
                    item.unit_price ?? item.price ?? 0
                  );

                  const subtotal = Number(
                    item.subtotal ?? price * item.quantity
                  );

                  return (
                    <div
                      key={item.id || index}
                      className="flex justify-between gap-4 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">
                          {item.product_name || item.name}
                        </p>

                        <p className="text-xs text-gray-500">
                          {item.quantity} × {formatRupiah(price)}
                        </p>
                      </div>

                      <p className="font-semibold text-gray-800">
                        {formatRupiah(subtotal)}
                      </p>
                    </div>
                  );
                }
              )}
            </div>

            <div className="space-y-2 border-t border-gray-200 pt-4">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Metode Pembayaran</span>
                <span className="uppercase">
                  {order?.payment_method || "-"}
                </span>
              </div>

              <div className="flex justify-between text-sm text-gray-500">
                <span>Status Pembayaran</span>
                <StatusBadge status={order?.payment_status} />
              </div>

              <div className="flex justify-between border-t border-gray-100 pt-3 font-bold text-gray-900">
                <span>Total</span>

                <span>
                  {formatRupiah(Number(order?.total_amount || 0))}
                </span>
              </div>
            </div>

            <button
              onClick={printInvoice}
              disabled={order?.payment_status !== "paid"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <Printer size={18} />
              Cetak Invoice
            </button>

            {order?.payment_status !== "paid" && (
              <p className="text-center text-xs text-gray-400">
                Invoice tersedia setelah pembayaran lunas.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Detail transaksi tidak tersedia.
          </p>
        )}
      </Modal>
    </div>
  );
}