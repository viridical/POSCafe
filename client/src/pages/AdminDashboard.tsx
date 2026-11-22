import { useEffect, useState } from "react";
import {
  Banknote,
  Package,
  Receipt,
  Users,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import Header from "../components/Header";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import Loading from "../components/Loading";
import { getDashboard } from "../services/reportService";
import type { DashboardStats } from "../types";

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
  onMenuClick?: () => void;
}

const formatRupiah = (value: number) =>
  `Rp${Number(value || 0).toLocaleString("id-ID")}`;

export default function AdminDashboard({
  onNavigate,
  onMenuClick,
}: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard(showLoading = false) {
    try {
      if (showLoading) setLoading(true);
      setError("");

      const result: any = await getDashboard();
      const data = result.data || result;

      // Backend mengirim statistik di dalam object statistics.
      const statistics = data.statistics || data;

      setStats({
        totalRevenue: Number(
          statistics.total_revenue ??
          statistics.totalRevenue ??
          0
        ),
        totalTransactions: Number(
          statistics.total_transactions ??
          statistics.totalTransactions ??
          0
        ),
        totalProducts: Number(
          data.total_products ??
          data.totalProducts ??
          0
        ),
        totalStaff: Number(
          data.total_staff ??
          data.totalStaff ??
          0
        ),
        recentOrders:
          data.recent_transactions ??
          data.recentOrders ??
          data.recent_orders ??
          [],
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard(true);

    // Perbarui dashboard setiap 30 detik.
    const interval = window.setInterval(() => {
      loadDashboard();
    }, 30000);

    // Perbarui ketika admin kembali membuka tab.
    const handleFocus = () => loadDashboard();

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Ringkasan aktivitas POSCafe"
        onMenuClick={onMenuClick}
      />

      <main className="space-y-7 p-4 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Overview
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Pantau performa cafe hari ini.
            </p>
          </div>

          <button
            onClick={() => loadDashboard(true)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {loading ? (
          <Loading text="Memuat dashboard..." />
        ) : error ? (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Pendapatan"
                value={formatRupiah(stats?.totalRevenue || 0)}
                icon={Banknote}
                iconColor="text-green-600"
                iconBackground="bg-green-50"
              />

              <StatCard
                title="Total Transaksi"
                value={String(stats?.totalTransactions || 0)}
                icon={Receipt}
                iconColor="text-blue-600"
                iconBackground="bg-blue-50"
              />

              <StatCard
                title="Total Produk"
                value={String(stats?.totalProducts || 0)}
                icon={Package}
                iconColor="text-orange-600"
                iconBackground="bg-orange-50"
              />

              <StatCard
                title="Total Karyawan"
                value={String(stats?.totalStaff || 0)}
                icon={Users}
                iconColor="text-purple-600"
                iconBackground="bg-purple-50"
              />
            </div>

            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
                <div>
                  <h3 className="font-bold text-gray-900">
                    Transaksi Terbaru
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Daftar transaksi terakhir.
                  </p>
                </div>

                <button
                  onClick={() => onNavigate("transactions")}
                  className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
                >
                  Lihat Semua
                  <ArrowRight size={16} />
                </button>
              </div>

              {stats?.recentOrders?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-5 py-4">Order ID</th>
                        <th className="px-5 py-4">Pelanggan</th>
                        <th className="px-5 py-4">Kasir</th>
                        <th className="px-5 py-4">Total</th>
                        <th className="px-5 py-4">Status</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {stats.recentOrders.map((order: any) => (
                        <tr
                          key={order.id || order.order_number}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-5 py-4 font-semibold text-gray-800">
                            {order.order_number}
                          </td>

                          <td className="px-5 py-4 text-gray-600">
                            {order.customer_name || "Umum"}
                          </td>

                          <td className="px-5 py-4 text-gray-600">
                            {order.cashier || "-"}
                          </td>

                          <td className="px-5 py-4 font-semibold text-gray-800">
                            {formatRupiah(order.total_amount)}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge status={order.payment_status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="p-8 text-center text-sm text-gray-400">
                  Belum ada transaksi.
                </p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}