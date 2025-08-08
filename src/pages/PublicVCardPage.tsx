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
    if (!cardRef.current) return;

    const images = cardRef.current.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      })
    );

    const canvas = await html2canvas(cardRef.current, {
      useCORS: true,
      scale: 2,
    });

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${employee?.fullName || "vcard"}.png`;
    link.click();
  };

  // ✅ Unified Save Contact Logic (Native + Fallback to VCF)
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
      // fallback to .vcf
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
END:VCARD
      `.trim();

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
      className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-300 flex items-center justify-center p-3 relative"
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm h-[95vh] flex flex-col justify-between border border-gray-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto p-6 flex flex-col items-center bg-gradient-to-b from-white to-gray-50">
          <img
            src={employee.photoUrl}
            alt="Employee"
            crossOrigin="anonymous"
            onError={(e) => {
              e.currentTarget.src = "/images/logo.png";
            }}
            className="w-24 h-24 rounded-full object-cover border mb-3"
          />
          <h2 className="text-2xl font-bold text-gray-900">{employee.fullName}</h2>
          <p className="text-sm text-gray-700">{employee.designation}</p>
          <p className="text-sm text-gray-600">{employee.company}</p>

          <div className="text-sm text-gray-800 mt-4 space-y-1 text-center">
            <p>
              <a href={`tel:${employee.phone}`} className="text-blue-600 underline">
                {employee.phone}
              </a>
            </p>
            <p>
              <a href={`mailto:${employee.email}`} className="text-blue-600 underline">
                {employee.email}
              </a>
            </p>
            <p>{employee.address}</p>
            <p>
              <a
                href={employee.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {employee.website}
              </a>
            </p>
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

        <div className="bg-white">
          <div className="border-t px-4 py-4 flex flex-col sm:flex-row gap-2 bg-white">
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
