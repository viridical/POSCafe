import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: number;
  iconColor?: string;
  iconBackground?: string;
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  iconColor = "text-red-600",
  iconBackground = "bg-red-50",
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="mt-3 text-2xl font-bold text-gray-900">{value}</h3>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBackground} ${iconColor}`}
        >
          <Icon size={23} />
        </div>
      </div>

      {(description || trend !== undefined) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {trend !== undefined && (
            <span
              className={`flex items-center gap-1 font-semibold ${
                trend >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend >= 0 ? (
                <TrendingUp size={14} />
              ) : (
                <TrendingDown size={14} />
              )}
              {Math.abs(trend)}%
            </span>
          )}

          {description && <span className="text-gray-400">{description}</span>}
        </div>
      )}
    </div>
  );
}