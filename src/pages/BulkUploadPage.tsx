import { useState } from "react";
import  Papa  from "papaparse";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { UploadCloud } from "lucide-react";

function BulkUploadPage() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
    }
  };

  const handleUpload = () => {
    if (!csvFile) return alert("No file selected");

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: Papa.ParseResult<any>) => {
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
          });
        }

        alert("CSV upload completed.");
        navigate("/admin/dashboard");
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Bulk Upload Employees</h2>
        <p className="text-sm text-gray-500 mb-6">
          Upload a CSV file with columns: <strong>Full Name, Designation, Phone Number, Email, Address, Website, Google Drive Link</strong>.
        </p>

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
          disabled={!csvFile}
          className={`w-full mt-2 px-4 py-2 text-white rounded transition ${
            csvFile
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {csvFile ? "Upload CSV" : "Choose a file to enable upload"}
        </button>
      </div>
    </div>
  );
}

export default BulkUploadPage;