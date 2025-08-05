import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/admin/dashboard");
    } catch (err) {
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        {/* Company Branding */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="/images/logo.png"
            alt="SELCO Logo"
            className="w-12 h-12 mb-2"
          />
          <h1 className="text-xl font-semibold text-gray-800 text-center">
            SELCO Solar Light Pvt Ltd
          </h1>
        </div>

        <h2 className="text-lg font-bold mb-4 text-center text-gray-700">
          Admin Login
        </h2>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        <form onSubmit={handleLogin} className="grid gap-4">
          <input
            type="email"
            placeholder="Admin Email"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring focus:ring-blue-100"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring focus:ring-blue-100"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLoginPage;
