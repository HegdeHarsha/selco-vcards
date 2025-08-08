import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

function EmployeeFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    fullName: "",
    designation: "",
    phone: "",
    email: "",
    address: "",
    website: "",
    photoUrl: "",
  });

  const [previewUrl, setPreviewUrl] = useState("/images/logo.png");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isEdit) loadEmployee();
  }, [id]);

  const loadEmployee = async () => {
    const ref = doc(db, "employees", id!);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      const data = snapshot.data() as typeof formData;
      setFormData(data);
      setPreviewUrl(data.photoUrl || "/images/logo.png");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "photoUrl") {
      setPreviewUrl(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      await updateDoc(doc(db, "employees", id!), formData);
    } else {
      await addDoc(collection(db, "employees"), formData);
    }
    navigate("/admin/dashboard");
  };

  const handleDelete = async () => {
    const confirmDelete = confirm("Are you sure you want to delete this card?");
    if (!confirmDelete || !id) return;
    await deleteDoc(doc(db, "employees", id));
    alert("Employee card deleted.");
    navigate("/admin/dashboard");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("upload_preset", "employee_photos");

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/dtfchlbpc/image/upload",
      {
        method: "POST",
        body: uploadData,
      }
    );

    const data = await response.json();

    if (data.secure_url) {
      setFormData((prev) => ({ ...prev, photoUrl: data.secure_url }));
      setPreviewUrl(data.secure_url);
    } else {
      alert("Upload failed. Please try again.");
    }

    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
      {/* Close Button */}
      <button
        className="absolute top-4 right-4 text-gray-600 hover:text-black text-2xl"
        onClick={() => navigate("/admin/dashboard")}
      >
        &times;
      </button>

      <div className="w-full max-w-2xl bg-white shadow-xl rounded-xl p-8">
        <h2 className="text-xl font-bold mb-6 text-gray-800 text-center">
          {isEdit ? "Edit Employee Card" : "Create New Employee Card"}
        </h2>

        {/* Image Upload Preview */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
          <img
            src={previewUrl}
            onError={(e) => {
              e.currentTarget.src = "/images/logo.png";
            }}
            alt="Preview"
            className="w-24 h-24 rounded-full border object-cover"
          />
          <div className="w-full">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="text-sm"
              disabled={uploading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Uploads directly to Cloudinary
            </p>
            {uploading && (
              <p className="text-xs text-blue-600 mt-1">Uploading...</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Full Name *</label>
            <input
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring focus:ring-green-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Designation *</label>
            <input
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring focus:ring-green-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone *</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring focus:ring-green-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring focus:ring-green-200"
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring focus:ring-green-200"
              rows={2}
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Website</label>
            <input
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring focus:ring-green-200"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Photo URL (readonly)</label>
            <input
              name="photoUrl"
              value={formData.photoUrl}
              onChange={handleChange}
              className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed"
              readOnly
            />
          </div>

          <div className="col-span-2 flex flex-col sm:flex-row gap-3 mt-4">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition"
            >
              {isEdit ? "Update Card" : "Create Card"}
            </button>

            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Delete this Card
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmployeeFormPage;
