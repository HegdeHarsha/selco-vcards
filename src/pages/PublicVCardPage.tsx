import { useEffect, useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  Phone,
  Mail,
  MapPin,
  Globe,
} from "lucide-react";

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
    const downloadNode = document.getElementById("downloadTarget");
    if (!downloadNode) return;

    const images = downloadNode.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      })
    );

    const canvas = await html2canvas(downloadNode, {
      useCORS: true,
      scale: 2,
      backgroundColor: null,
    });

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${employee?.fullName || "vcard"}.png`;
    link.click();
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
      className="min-h-screen bg-gradient-to-b from-blue-200 to-white flex items-center justify-center p-3 relative"
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
        className="bg-gradient-to-b from-orange-400 to-orange-500 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col justify-between border border-gray-300 overflow-hidden text-center font-[Georgia]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Download Target */}
        <div id="downloadTarget" className="p-6 flex flex-col items-center text-white">
          <img
            src={employee.photoUrl}
            alt="Employee"
            crossOrigin="anonymous"
            onError={(e) => {
              e.currentTarget.src = "/images/logo.png";
            }}
            className="w-24 h-24 rounded-full object-cover border-4 border-white mb-4"
          />
          <h2 className="text-2xl font-bold">{employee.fullName}</h2>
          <p className="text-sm">{employee.designation}</p>
          <p className="text-sm mb-2">{employee.company}</p>

          <div className="text-sm space-y-2 mt-3">
            <p className="flex items-center justify-center gap-2">
              <Phone size={16} />{" "}
              <a href={`tel:${employee.phone}`} className="underline text-white">
                {employee.phone}
              </a>
            </p>
            <p className="flex items-center justify-center gap-2">
              <Mail size={16} />{" "}
              <a href={`mailto:${employee.email}`} className="underline text-white">
                {employee.email}
              </a>
            </p>
            <p className="flex items-center justify-center gap-2">
              <MapPin size={16} /> {employee.address}
            </p>
            <p className="flex items-center justify-center gap-2">
              <Globe size={16} />{" "}
              <a
                href={employee.website}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-white"
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
              className="mx-auto bg-white p-1 rounded"
            />
            <p className="text-xs mt-2">Scan to open this card</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="bg-white p-4 flex flex-col sm:flex-row gap-2">
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
        <div className="text-[11px] text-gray-600 text-center py-2 bg-white">
          <div className="flex items-center justify-center gap-2">
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
