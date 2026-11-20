
import { Plus } from "lucide-react";
import type { Product } from "../types";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

const API_URL = "http://localhost:5000";

export default function ProductCard({ product, onAdd }: ProductCardProps) {
  const image = product.image_url
    ? product.image_url.startsWith("http")
      ? product.image_url
      : `${API_URL}/uploads/${product.image_url.replace(/^\/?uploads\/?/, "")}`
    : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <span className="text-sm">No Image</span>
          </div>
        )}

        {!product.is_available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-red-600">
              Tidak Tersedia
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-xs text-gray-400">{product.category_name}</p>
        <h3 className="mt-1 truncate font-semibold text-gray-900">
          {product.name}
        </h3>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="font-bold text-red-600">
            Rp{Number(product.price).toLocaleString("id-ID")}
          </span>

          <button
            onClick={() => onAdd(product)}
            disabled={!product.is_available}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <Plus size={19} />
          </button>
        </div>
      </div>
    </div>
  );
}
