import { useState } from "react";
import Papa from "papaparse";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { UploadCloud } from "lucide-react";

function BulkUploadPage() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setStatus("idle");
      setError("");
    }
  };

  const handleUpload = () => {
    if (!csvFile) return;

    setUploading(true);
    setStatus("idle");
    setError("");

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: Papa.ParseResult<any>) => {
        try {
          const entries = results.data as any[];

          for (const entry of entries) {
            if (!entry["Email"]) continue;

            await addDoc(collection(db, "employees"), {
              fullName: entry["Full Name"],
              designation: entry["Designation"],
              phone: entry["Phone Number"],
              email: entry["Email"],
              address: entry["Address"] || "",
              website: entry["Website"] || "www.selco-india.com",
              photoUrl: entry["Google Drive Link"] || "",
              company: "SELCO Solar Light Pvt Ltd",
            });
          }

          setStatus("success");
          setUploading(false);
          setCsvFile(null);
        } catch (err) {
          setStatus("error");
          setError("Failed to process CSV file.");
          setUploading(false);
        }
      },
      error: () => {
        setStatus("error");
        setError("Invalid CSV file.");
        setUploading(false);
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 relative">
      {/* Back Button */}
      <button
        onClick={() => navigate("/admin/dashboard")}
        className="absolute top-4 left-4 text-gray-600 hover:text-black text-2xl"
      >
        ←
      </button>

      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">
          Bulk Upload Employees
        </h2>

        <p className="text-sm text-gray-500 mb-4">
          Upload a CSV file with the following columns:
        </p>

        <ul className="text-sm text-gray-600 list-disc list-inside mb-6 space-y-1">
          <li><b>Full Name</b></li>
          <li><b>Designation</b></li>
          <li><b>Phone Number</b></li>
          <li><b>Email</b></li>
          <li><b>Address</b></li>
          <li><b>Website</b> (optional)</li>
          <li><b>Google Drive Link</b> (optional)</li>
        </ul>

        <a
          href="/sample.csv"
          download
          className="text-blue-600 text-sm underline mb-6 inline-block"
        >
          📥 Download Sample CSV
        </a>

        <label
          htmlFor="csvInput"
          className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition mb-4"
        >
          <UploadCloud className="w-6 h-6 text-gray-500" />
          <div>
            {csvFile ? (
              <p className="text-gray-700 font-medium">{csvFile.name}</p>
            ) : (
              <p className="text-gray-400 text-sm">Click to select CSV file</p>
            )}
          </div>
        </label>
        <input
          id="csvInput"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={handleUpload}
          disabled={!csvFile || uploading}
          className={`w-full mt-2 px-4 py-2 text-white rounded transition ${
            csvFile
              ? uploading
                ? "bg-blue-300 cursor-wait"
                : "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {uploading ? "Uploading..." : "Upload CSV"}
        </button>

        {/* Status messages */}
        {status === "success" && (
          <p className="mt-4 text-green-600 text-sm">✅ Upload successful!</p>
        )}
        {status === "error" && (
          <p className="mt-4 text-red-600 text-sm">❌ {error}</p>
        )}
      </div>
    </div>
  );
}

export default BulkUploadPage;
