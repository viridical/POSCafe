import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Users,
  Receipt,
  BarChart3,
  LogOut,
  Coffee,
  X,
} from "lucide-react";

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  userName: string;
  userRole: string;
  open?: boolean;
  onClose?: () => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "cashier", label: "Kasir", icon: ShoppingCart },
  { id: "products", label: "Produk", icon: Package },
  { id: "categories", label: "Kategori", icon: Tags },
  { id: "employees", label: "Karyawan", icon: Users },
  { id: "transactions", label: "Transaksi", icon: Receipt },
  { id: "reports", label: "Laporan", icon: BarChart3 },
];

export default function Sidebar({
  activePage,
  onNavigate,
  onLogout,
  userName,
  userRole,
  open = true,
  onClose,
}: SidebarProps) {
  const visibleItems =
    userRole === "admin"
      ? menuItems
      : menuItems.filter((item) =>
          ["cashier", "transactions"].includes(item.id)
        );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-gray-800 bg-[#111827] text-white transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-gray-800 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600">
              <Coffee size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold">POSCafe</h1>
              <p className="text-xs text-gray-400">Management System</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Menu Utama
          </p>

          <nav className="space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const active = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose?.();
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-red-600 text-white shadow-lg shadow-red-950/30"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-gray-800 p-4">
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-gray-800/70 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{userName}</p>
              <p className="text-xs capitalize text-gray-400">{userRole}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-400 transition hover:bg-red-500/10"
          >
            <LogOut size={19} />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}