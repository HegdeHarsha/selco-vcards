import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  QuerySnapshot,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import html2canvas from "html2canvas";

function AdminDashboard() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const snapshot: QuerySnapshot = await getDocs(collection(db, "employees"));
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setEmployees(list);
  };

  const handleLogout = async () => {
    const confirmed = confirm("Are you sure you want to logout?");
    if (confirmed) {
      await signOut(auth);
      navigate("/admin/login");
    }
  };

  const handleDownload = async (email: string) => {
    const cardElement = document.getElementById(`vcard-${email}`);
    if (!cardElement) return;

    const canvas = await html2canvas(cardElement);
    const link = document.createElement("a");
    link.download = `${email}-vcard.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const filtered = employees.filter((emp) =>
    emp.email?.toLowerCase().includes(searchEmail.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="bg-white shadow px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo.png"
            alt="SELCO Logo"
            className="h-8 w-8 object-contain"
          />
          <h1 className="text-xl font-bold">SELCO Solar Light Pvt Ltd</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 flex-grow justify-end">
          <input
            type="text"
            placeholder="Search by email"
            className="p-2 border rounded text-sm w-full sm:w-64"
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
                onClick={() => navigate(`/vcard/${emp.email}?admin=true`)}
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
                <div
                  className="flex flex-wrap justify-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="px-4 py-1 text-sm bg-sky-600 text-white rounded hover:bg-sky-700"
                    onClick={() => navigate(`/admin/edit/${emp.id}`)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-4 py-1 text-sm bg-neutral-600 text-white rounded hover:bg-neutral-700"
                    onClick={() => handleDownload(emp.email)}
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
