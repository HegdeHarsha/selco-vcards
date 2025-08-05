import { useEffect, useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface Employee {
  fullName: string;
  designation: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  photoUrl: string;
}

function PublicVCardPage() {
  const { email } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdmin = searchParams.get("admin") === "true";

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [nativeSupported, setNativeSupported] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!email) return;

      const q = query(collection(db, "employees"), where("email", "==", email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as Employee;
        setEmployee(data);
      }
    };

    fetchData();

    if ("contacts" in navigator && "ContactsManager" in window) {
      setNativeSupported(true);
    }
  }, [email]);

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current);
    const dataUrl = canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${employee?.fullName || "vcard"}.png`;
    link.click();
  };

  const handleSaveNativeContact = async () => {
    if (!employee || !nativeSupported) return;

    try {
      const contact = {
        name: [employee.fullName],
        tel: [employee.phone],
        email: [employee.email],
      };
      const props = ["name", "tel", "email"];
      await (navigator as any).contacts.save([contact], props);
    } catch (err) {
      alert("Could not open native contact save. Try downloading instead.");
    }
  };

  if (!employee) {
    return <div className="p-6 text-center">Loading or Employee not found...</div>;
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-300 flex items-center justify-center p-3 relative"
      onClick={() => {
        if (isAdmin) navigate("/admin/dashboard");
      }}
    >
      {/* Close X (only for admin) */}
      {isAdmin && (
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-black text-xl"
          onClick={(e) => {
            e.stopPropagation();
            navigate("/admin/dashboard");
          }}
        >
          &times;
        </button>
      )}

      <div
        ref={cardRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm h-[95vh] flex flex-col justify-between border border-gray-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()} // prevent outside click
      >
        {/* Scrollable Card Content */}
        <div className="overflow-y-auto p-6 flex flex-col items-center bg-gradient-to-b from-white to-gray-50">
          <img
            src={employee.photoUrl}
            alt="Employee"
            className="w-24 h-24 rounded-full object-cover border mb-3"
            onError={(e) => {
              e.currentTarget.src = "/images/logo.png";
            }}
          />
          <h2 className="text-2xl font-bold text-gray-900">{employee.fullName}</h2>
          <p className="text-sm text-gray-700">{employee.designation}</p>
          <p className="text-sm text-gray-600">{employee.company}</p>

          <div className="text-sm text-gray-800 mt-4 space-y-1 text-center">
            <p>{employee.phone}</p>
            <p>{employee.email}</p>
            <p>{employee.address}</p>
            <p className="text-blue-600">{employee.website}</p>
          </div>

          <div className="mt-6 text-center">
            <QRCodeCanvas
              value={window.location.href}
              size={100}
              includeMargin={true}
              className="mx-auto"
            />
            <p className="text-xs text-gray-500 mt-2">Scan to open this card</p>
          </div>
        </div>

        {/* Buttons + Footer */}
        <div className="bg-white">
          <div className="border-t px-4 py-4 flex flex-col sm:flex-row gap-2 bg-white">
            {nativeSupported ? (
              <button
                onClick={handleSaveNativeContact}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Save Contact
              </button>
            ) : (
              <div className="text-sm text-gray-500 italic w-full text-center">
                Native save not supported
              </div>
            )}
            <button
              onClick={handleDownloadImage}
              className="w-full px-4 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-800"
            >
              Download as PNG
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-300 my-2"></div>

          {/* Company Footer with Logo */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 text-center leading-tight pb-3">
            <img
              src="/images/logo.png"
              alt="Company Logo"
              className="h-5 w-5 object-contain"
            />
            <div>
              <p>SELCO Solar Light Pvt Ltd</p>
              <p>
                <a href="mailto:selco@selco-india.com" className="text-blue-600">
                  selco@selco-india.com
                </a>
              </p>
              <p>
                <a
                  href="https://www.selco-india.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600"
                >
                  www.selco-india.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicVCardPage;
