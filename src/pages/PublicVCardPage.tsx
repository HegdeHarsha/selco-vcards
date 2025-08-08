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
  const shouldDownload = searchParams.get("download") === "true";

  const [employee, setEmployee] = useState<Employee | null>(null);
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
  }, [email]);

  useEffect(() => {
    if (shouldDownload && employee) {
      setTimeout(() => {
        handleDownloadImage();
      }, 500);
    }
  }, [shouldDownload, employee]);

  const handleDownloadImage = async () => {
    const originalButtons = document.getElementById("action-buttons");
    if (originalButtons) originalButtons.style.display = "none";

    const canvas = await html2canvas(cardRef.current!, {
      useCORS: true,
      scale: 2,
    });

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${employee?.fullName || "vcard"}.png`;
    link.click();

    if (originalButtons) originalButtons.style.display = "flex";
  };

  const handleSaveContact = async () => {
    if (!employee) return;

    const contact = {
      name: [employee.fullName],
      tel: [employee.phone],
      email: [employee.email],
    };

    const props = ["name", "tel", "email"];

    try {
      if ("contacts" in navigator && "ContactsManager" in window) {
        await (navigator as any).contacts.save([contact], props);
        return;
      }
      throw new Error("Not supported");
    } catch {
      const vcfData = `
BEGIN:VCARD
VERSION:3.0
FN:${employee.fullName}
ORG:${employee.company}
TITLE:${employee.designation}
TEL:${employee.phone}
EMAIL:${employee.email}
ADR:${employee.address}
URL:${employee.website}
END:VCARD`.trim();

      const blob = new Blob([vcfData], { type: "text/vcard" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${employee.fullName.replace(/\s+/g, "_")}.vcf`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!employee) {
    return <div className="p-6 text-center">Loading or Employee not found...</div>;
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-sky-100 to-sky-300 flex items-center justify-center p-3 relative"
      onClick={() => {
        if (isAdmin) navigate("/admin/dashboard");
      }}
    >
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
        className="bg-orange-200 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-300 overflow-hidden flex flex-col justify-between"
        style={{
          backgroundImage: "url('https://res.cloudinary.com/dtfchlbpc/image/upload/v1754650643/Untitled_50_x_85_mm_1_vuauix.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Section */}
        <div className="p-6 flex flex-col items-center text-center font-[Georgia] text-black">
          {/* Bigger Photo */}
          <img
            src={employee.photoUrl}
            alt="Employee"
            crossOrigin="anonymous"
            onError={(e) => {
              e.currentTarget.src = "/images/logo.png";
            }}
            className="w-32 h-32 rounded-full object-cover border mb-4" // ⬅️ was w-24 h-24 → now w-32 h-32
          />

          {/* Bigger Name */}
          <h2 className="text-3xl font-bold mb-1">{employee.fullName}</h2> {/* ⬅️ text-3xl */}

          {/* Bigger Designation */}
          <p className="text-xl mb-1">{employee.designation}</p> {/* ⬅️ text-xl */}

          {/* Contact Info */}
          <div className="space-y-3 text-center text-[18px]">
            <p>
              📞{" "}
              <a
                href={`tel:${employee.phone}`}
                className="text-blue-700 hover:text-blue-900"
                style={{ textDecoration: "none" }}
              >
                {employee.phone}
              </a>
            </p>
            <p>
              📧{" "}
              <a
                href={`mailto:${employee.email}`}
                className="text-blue-700 hover:text-blue-900"
                style={{ textDecoration: "none" }}
              >
                {employee.email}
              </a>
            </p>
            <p>📍 {employee.address}</p>
            <p>
              🌐{" "}
              <a
                href={employee.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 hover:text-blue-900"
                style={{ textDecoration: "none" }}
              >
                {employee.website}
              </a>
            </p>
          </div>

          {/* Bigger QR Code */}
          <div className="mt-8 text-center">
            <QRCodeCanvas
              value={window.location.href}
              size={140} // increased from 100 to 140
              includeMargin={true}
              className="mx-auto"
            />
            <p className="text-base text-gray-700 mt-3">Scan to open this card</p> {/* ⬅️ text-base */}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white w-full">
          {/* Buttons */}
          <div
            id="action-buttons"
            className="border-t px-4 py-4 flex flex-col sm:flex-row gap-2 bg-white"
          >
            <button
              onClick={handleSaveContact}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Save Contact
            </button>
            <button
              onClick={handleDownloadImage}
              className="w-full px-4 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-800"
            >
              Download as PNG
            </button>
          </div>

          {/* Company Footer */}
          <div className="border-t border-gray-300 my-2"></div>

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
