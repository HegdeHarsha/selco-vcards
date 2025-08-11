// src/pages/AdminDashboard.tsx
import { useEffect, useState, useMemo } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

interface Employee {
  id?: string;
  fullName?: string;
  designation?: string;
  email?: string;
  photoUrl?: string;
  phone?: string;
  address?: string;
  website?: string;
  company?: string;
  [k: string]: any;
}

function AdminDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEmployees = async () => {
    try {
      const snap = await getDocs(collection(db, "employees"));
      const list: Employee[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

      // sort alphabetically by fullName (case-insensitive, trimmed)
      list.sort((a, b) =>
        String(a.fullName ?? "")
          .trim()
          .localeCompare(String(b.fullName ?? "").trim(), undefined, { sensitivity: "base" })
      );

      setEmployees(list);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
  };

  const handleLogout = async () => {
    const confirmed = confirm("Are you sure you want to logout?");
    if (confirmed) {
      await signOut(auth);
      navigate("/admin/login");
    }
  };

  // Download should use the vcard route which handles image capture/download
  const handleDownload = (email: string) => {
    navigate(`/vcard/${encodeURIComponent(email)}?admin=true&download=true`);
  };

  // Filter + keep sorted order
  const filtered = useMemo(() => {
    const q = (searchEmail || "").trim().toLowerCase();
    const result = employees.filter((emp) => {
      const email = String(emp.email ?? "").toLowerCase();
      const name = String(emp.fullName ?? "").toLowerCase();
      // search by email OR name; if empty query, everything passes
      return q === "" || email.includes(q) || name.includes(q);
    });

    // keep alphabetical sort by fullName
    result.sort((a, b) =>
      String(a.fullName ?? "")
        .trim()
        .localeCompare(String(b.fullName ?? "").trim(), undefined, { sensitivity: "base" })
    );

    return result;
  }, [employees, searchEmail]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="bg-white shadow px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" alt="SELCO Logo" className="h-8 w-8 object-contain" />
          <h1 className="text-xl font-bold">SELCO Solar Light Pvt Ltd</h1>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by name or email"
            className="p-2 border rounded text-sm w-80"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
          />
          <button
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 text-sm"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            onClick={() => navigate("/admin/create")}
          >
            + Create New Card
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            onClick={() => navigate("/admin/bulk")}
          >
            Upload CSV
          </button>
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-600">No matching employees.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((emp) => (
              <div
                key={emp.id}
                id={`vcard-${emp.email}`}
                onClick={() => navigate(`/vcard/${encodeURIComponent(String(emp.email))}?admin=true`)}
                className="bg-white rounded-lg shadow hover:shadow-md p-4 flex flex-col items-center text-center transition-shadow cursor-pointer"
              >
                <img
                  src={emp.photoUrl || "/images/logo.png"}
                  alt={emp.fullName}
                  className="w-24 h-24 rounded-full object-cover border mb-4"
                />
                <h3 className="text-lg font-semibold">{emp.fullName}</h3>
                <p className="text-sm text-gray-600">{emp.designation}</p>
                <p className="text-sm text-blue-600 mb-4">{emp.email}</p>

                {/* Buttons inside card */}
                <div className="flex flex-wrap justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="px-4 py-1 text-sm bg-sky-600 text-white rounded hover:bg-sky-700"
                    onClick={() => navigate(`/admin/edit/${emp.id}`)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-4 py-1 text-sm bg-neutral-600 text-white rounded hover:bg-neutral-700"
                    onClick={() => handleDownload(String(emp.email))}
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t text-center text-xs text-gray-500 py-3">
        © 2025 SELCO Solar Light Pvt Ltd. All rights reserved.
      </footer>
    </div>
  );
}

export default AdminDashboard;
