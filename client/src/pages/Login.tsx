import { useState } from "react";
import { Coffee, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { loginRequest } from "../services/authService";
import type { User } from "../types";

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      const user = await loginRequest(email.trim(), password);
      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111827] p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-red-600 p-10 text-white md:flex">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/15 p-3">
              <Coffee size={28} />
            </div>
            <span className="text-2xl font-bold">POSCafe</span>
          </div>

          <div>
            <h1 className="text-4xl font-bold leading-tight">
              Manage Your Cafe Business
            </h1>
            <p className="mt-4 max-w-sm text-red-100">
              Kelola transaksi, produk, karyawan, dan laporan cafe dalam satu
              sistem.
            </p>
          </div>

          <p className="text-sm text-red-100">
            POSCafe Management System
          </p>
        </div>

        <div className="flex items-center justify-center p-7 sm:p-12">
          <form onSubmit={handleSubmit} className="w-full max-w-sm">
            <div className="mb-8">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 md:hidden">
                <Coffee size={28} />
              </div>

              <h2 className="text-3xl font-bold text-gray-900">
                Welcome Back
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Login untuk masuk ke dashboard POSCafe.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@poscafe.com"
                  className="w-full rounded-xl border border-gray-200 py-3.5 pl-11 pr-4 outline-none transition focus:border-red-500"
                />
              </div>
            </div>

            <div className="mb-7">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full rounded-xl border border-gray-200 py-3.5 pl-11 pr-12 outline-none transition focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-red-600 py-3.5 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Login"}
            </button>

            <p className="mt-6 text-center text-xs text-gray-400">
              POSCafe Management System
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}