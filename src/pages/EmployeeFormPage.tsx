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
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {isEdit ? "Edit Employee Card" : "Create New Employee Card"}
        </h2>

        {/* Image Upload + Preview */}
        <div className="flex items-center gap-6 mb-6">
          <img
            src={previewUrl}
            onError={(e) => {
              e.currentTarget.src = "/images/logo.png";
            }}
            alt="Preview"
            className="w-20 h-20 rounded-full border object-cover"
          />
          <div>
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

        <form onSubmit={handleSubmit} className="grid gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name *</label>
            <input
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring focus:ring-green-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Designation *</label>
            <input
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring focus:ring-green-200"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number *</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring focus:ring-green-200"
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
                className="w-full p-2 border rounded-md focus:ring focus:ring-green-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring focus:ring-green-200"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Website <span className="text-gray-400">(optional)</span>
            </label>
            <input
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring focus:ring-green-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Photo URL (auto-filled)</label>
            <input
              name="photoUrl"
              value={formData.photoUrl}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring focus:ring-green-200"
              readOnly
            />
          </div>

          <button
            type="submit"
            className="bg-emerald-600 text-white px-6 py-2 rounded-md hover:bg-emerald-700 transition"
          >
            {isEdit ? "Update Card" : "Create Card"}
          </button>

          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="mt-4 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
            >
              Delete this Card
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default EmployeeFormPage;
