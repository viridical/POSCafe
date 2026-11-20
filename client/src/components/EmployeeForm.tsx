
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

interface EmployeeFormProps {
  initialData?: {
    id?: number;
    name: string;
    email: string;
    role: string;
  } | null;
  onSubmit: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function EmployeeForm({
  initialData,
  onSubmit,
  onCancel,
}: EmployeeFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(initialData?.name || "");
    setEmail(initialData?.email || "");
    setRole(initialData?.role || "staff");
    setPassword("");
  }, [initialData]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      await onSubmit({ name, email, password, role });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Nama</label>
        <input required value={name} onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500"
          placeholder="Nama karyawan" />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Email</label>
        <input required type="email" disabled={!!initialData} value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500 disabled:bg-gray-100"
          placeholder="email@example.com" />
      </div>

      {!initialData && (
        <div>
          <label className="mb-2 block text-sm font-medium">Password</label>
          <input required minLength={6} type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500"
            placeholder="Minimal 6 karakter" />
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium">Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-red-500">
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-3">
        <button type="button" onClick={onCancel}
          className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold">
          Batal
        </button>
        <button type="submit" disabled={loading}
          className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}
