
import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Search,
  RefreshCw,
  UserX,
  UserCheck,
} from "lucide-react";
import type { User } from "../types";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
} from "../services/employeeService";
import EmployeeForm from "../components/EmployeeForm";

interface EmployeesProps {
  onMenuClick: () => void;
}

export default function Employees({ onMenuClick }: EmployeesProps) {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [error, setError] = useState("");

  async function loadEmployees() {
    setLoading(true);
    setError("");

    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat karyawan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  async function handleSubmit(data: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) {
    try {
      if (selectedEmployee) {
        await updateEmployee(selectedEmployee.id, {
          name: data.name,
          ...(data.password ? { password: data.password } : {}),
        });
      } else {
        await createEmployee({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role as "admin" | "staff",
        });
      }

      setModalOpen(false);
      setSelectedEmployee(null);
      await loadEmployees();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan karyawan");
    }
  }

  async function handleStatusChange(employee: User) {
    const isResigning = employee.status === "active";

    const confirmed = window.confirm(
      isResigning
        ? `Apakah ${employee.name} benar-benar akan diubah menjadi resign? Akun tidak akan bisa login lagi.`
        : `Aktifkan kembali akun ${employee.name}?`
    );

    if (!confirmed) return;

    try {
      await updateEmployee(employee.id, {
        status: isResigning ? "resigned" : "active",
      });

      await loadEmployees();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Gagal mengubah status karyawan"
      );
    }
  }

  const filteredEmployees = employees.filter((employee) =>
    `${employee.name} ${employee.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen p-5 md:p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-lg border p-2 lg:hidden"
          >
            ☰
          </button>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Karyawan
            </h1>
            <p className="text-sm text-gray-500">
              Kelola akun admin dan staff
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedEmployee(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
        >
          <Plus size={18} />
          Tambah Karyawan
        </button>
      </div>

      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 outline-none focus:border-red-500"
          />
        </div>

        <button
          onClick={loadEmployees}
          className="rounded-xl border border-gray-200 bg-white p-3 text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw size={19} />
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Memuat karyawan...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            Data karyawan tidak ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-5 py-4">Nama</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {employee.name}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {employee.email}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          employee.role === "admin" 
                            ? "bg-purple-50 text-purple-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {employee.role}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          employee.status === "active"
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {employee.status === "active" ? "Aktif" : "Resign"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setModalOpen(true);
                          }}
                          title="Edit karyawan"
                          className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => handleStatusChange(employee)}
                          title={
                            employee.status === "active"
                              ? "Resign"
                              : "Aktifkan kembali"
                          }
                          className={`rounded-lg p-2 ${
                            employee.status === "active"
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-green-50 text-green-600 hover:bg-green-100"
                          }`}
                        >
                          {employee.status === "active" ? (
                            <UserX size={17} />
                          ) : (
                            <UserCheck size={17} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {selectedEmployee ? "Edit Karyawan" : "Tambah Karyawan"}
              </h2>

              <button
                onClick={() => {
                  setModalOpen(false);
                  setSelectedEmployee(null);
                }}
                className="text-xl text-gray-400"
              >
                ×
              </button>
            </div>

            <EmployeeForm
              initialData={selectedEmployee}
              onSubmit={handleSubmit}
              onCancel={() => {
                setModalOpen(false);
                setSelectedEmployee(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
