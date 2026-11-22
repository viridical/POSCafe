
import { useEffect, useState } from "react";
import {
  Wallet,
  Receipt,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

import Header from "../components/Header";
import StatCard from "../components/StatCard";
import Loading from "../components/Loading";
import { getReports } from "../services/reportService";

interface ReportSummary {
  total_revenue?: number | string;
  total_transactions?: number | string;
  average_transaction?: number | string;
  totalRevenue?: number | string;
  totalTransactions?: number | string;
  averageTransaction?: number | string;
}

interface ReportResponse {
  status?: string;
  summary?: ReportSummary;
  daily?: unknown[];
  data?: {
    summary?: ReportSummary;
    daily?: unknown[];
  } & ReportSummary;
}

const formatRupiah = (value: number) =>
  `Rp${Math.round(Number(value || 0)).toLocaleString("id-ID")}`;

export default function Reports({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const [report, setReport] = useState<ReportSummary>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const result = await getReports() as ReportResponse;

      const summary =
        result.data?.summary ??
        result.summary ??
        result.data ??
        {};

      setReport(summary);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil laporan."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const revenue = Number(
    report.total_revenue ?? report.totalRevenue ?? 0
  );

  const transactions = Number(
    report.total_transactions ?? report.totalTransactions ?? 0
  );

  const average = Number(
    report.average_transaction ??
      report.averageTransaction ??
      (transactions > 0 ? revenue / transactions : 0)
  );

  return (
    <div>
      <Header
        title="Laporan"
        subtitle="Ringkasan performa penjualan POSCafe"
        onMenuClick={onMenuClick}
      />

      <main className="space-y-6 p-4 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Ringkasan Penjualan
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Data transaksi berstatus paid pada bulan ini.
            </p>
          </div>

          <button
            onClick={loadReports}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <Loading text="Mengambil laporan..." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="Total Pendapatan"
              value={formatRupiah(revenue)}
              description="Total transaksi lunas"
              icon={Wallet}
              iconColor="text-green-600"
              iconBackground="bg-green-50"
            />

            <StatCard
              title="Total Transaksi"
              value={transactions.toLocaleString("id-ID")}
              description="Jumlah transaksi lunas"
              icon={Receipt}
              iconColor="text-blue-600"
              iconBackground="bg-blue-50"
            />

            <StatCard
              title="Rata-rata Transaksi"
              value={formatRupiah(average)}
              description="Pendapatan dibagi jumlah transaksi"
              icon={TrendingUp}
              iconColor="text-purple-600"
              iconBackground="bg-purple-50"
            />
          </div>
        )}
      </main>
    </div>
  );
}
