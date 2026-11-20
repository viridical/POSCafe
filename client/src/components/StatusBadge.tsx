interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  const styles: Record<string, string> = {
    completed: "bg-green-50 text-green-700",
    paid: "bg-green-50 text-green-700",
    success: "bg-green-50 text-green-700",
    pending: "bg-yellow-50 text-yellow-700",
    processing: "bg-blue-50 text-blue-700",
    failed: "bg-red-50 text-red-700",
    cancelled: "bg-gray-100 text-gray-600",
    unpaid: "bg-red-50 text-red-700",
  };

  const labels: Record<string, string> = {
    completed: "Selesai",
    paid: "Lunas",
    success: "Berhasil",
    pending: "Menunggu",
    processing: "Diproses",
    failed: "Gagal",
    cancelled: "Dibatalkan",
    unpaid: "Belum Dibayar",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[normalized] || "bg-gray-100 text-gray-600"
      }`}
    >
      {labels[normalized] || status}
    </span>
  );
}