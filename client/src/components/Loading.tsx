import { LoaderCircle } from "lucide-react";

interface LoadingProps {
  text?: string;
  fullScreen?: boolean;
}

export default function Loading({
  text = "Memuat data...",
  fullScreen = false,
}: LoadingProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        fullScreen ? "min-h-screen" : "min-h-64"
      }`}
    >
      <LoaderCircle size={34} className="animate-spin text-red-600" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}