"use client"

import {
  Upload,
  LayoutDashboard,
  BarChart2,
  Folder,
  FileText,
  Settings,
  HelpCircle,
  LogOut
} from "lucide-react";
import Link from "next/link";

import { usePathname } from "next/navigation";
import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { uploadFile } from "@/store/authSlice";
import type { RootState, AppDispatch } from "@/store/store";

const DashboardSidebar = ({ onUploadSuccess }: { onUploadSuccess?: () => void }) => {
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);
  const [fileTitle, setFileTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const { access, loading: reduxUploading } = useSelector((state: RootState) => state.auth);

  const handleOpenModal = () => {
    setShowModal(true);
    setFileTitle("");
    setFile(null);
    setError("");
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setFileTitle("");
    setFile(null);
    setError("");
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileTitle || !file) {
      setError("Please provide both file title and file.");
      return;
    }
    if (!access) {
      setError("You are not authenticated. Please login again.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const result = await dispatch(uploadFile({ fileTitle, file }));
      if (uploadFile.fulfilled.match(result)) {
        setShowModal(false);
        if (onUploadSuccess) onUploadSuccess(); // trigger parent refresh
      } else {
        setError(result.payload as string || "Upload failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <aside className="w-64 bg-white flex flex-col p-6 shadow-md text-lg">
      {/* New Upload Button */}
      <div
        className="mt-2 flex justify-center items-center gap-3 bg-blue-600 text-white px-6 p-2 rounded-md cursor-pointer text-lg"
        onClick={handleOpenModal}
      >
        <Upload size={20} />
        <span>New Upload</span>
      </div>
      <Link href="/dashboard">
        <div className={`mt-5 flex items-center gap-3 rounded-md transition-all duration-200 px-2 py-2 cursor-pointer
          ${pathname === "/dashboard" ? "bg-blue-100 text-blue-500 scale-102" : "hover:bg-blue-50 hover:text-blue-500 hover:scale-102"}
        `}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </div>
      </Link>
      {/* <Link href="/dashboard/reports">
        <div className={`mt-2 flex items-center gap-3 rounded-md transition-all duration-200 px-2 py-2 cursor-pointer
          ${pathname === "/dashboard/reports" ? "bg-blue-100 text-blue-500 scale-102" : "hover:bg-blue-50 hover:text-blue-500 hover:scale-102"}
        `}>
          <BarChart2 size={20} />
          <span>Reports</span>
        </div>
      </Link> */}
      <Link href="/dashboard/files">
        <div className={`mt-2 flex items-center gap-3 rounded-md transition-all duration-200 px-2 py-2 cursor-pointer
          ${pathname === "/dashboard/files" ? "bg-blue-100 text-blue-500 scale-102" : "hover:bg-blue-50 hover:text-blue-500 hover:scale-102"}
        `}>
          <Folder size={20} />
          <span>Files</span>
        </div>
      </Link>
      <Link href="/dashboard/contents">
        <div className={`mt-2 flex items-center gap-3 rounded-md transition-all duration-200 px-2 py-2 cursor-pointer
          ${pathname === "/dashboard/contents" ? "bg-blue-100 text-blue-500 scale-102" : "hover:bg-blue-50 hover:text-blue-500 hover:scale-102"}
        `}>
          <FileText size={20} />
          <span>Contents</span>
        </div>
      </Link>
      <Link href="/dashboard/settings">
        <div className={`mt-2 mb-5 flex items-center gap-3 rounded-md transition-all duration-200 px-2 py-2 cursor-pointer
          ${pathname === "/dashboard/settings" ? "bg-blue-100 text-blue-500 scale-102" : "hover:bg-blue-50 hover:text-blue-500 hover:scale-102"}
        `}>
          <Settings size={20} />
          <span>Settings</span>
        </div>
      </Link>
      <hr />
      <Link href="/dashboard/help">
        <div className={`mt-2 flex items-center gap-3 rounded-md transition-all duration-200 px-2 py-2 cursor-pointer
          ${pathname === "/dashboard/help" ? "bg-blue-100 text-blue-500 scale-102" : "hover:bg-blue-50 hover:text-blue-500 hover:scale-102"}
        `}>
          <HelpCircle size={20} />
          <span>Help Center</span>
        </div>
      </Link>
      <div className="mt-2 flex items-center gap-3 rounded-md transition-all duration-200 hover:bg-blue-50 hover:text-blue-500 hover:scale-102 cursor-pointer px-2 py-2">
        <Settings size={20} />
        <span>Report Issues</span>
      </div>
      <div className="mt-2 flex items-center gap-3 rounded-md transition-all duration-200 hover:bg-blue-50 hover:text-blue-500 hover:scale-102 cursor-pointer px-2 py-2">
        <LogOut size={20} />
        <span>Logout</span>
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={handleCloseModal}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4">Upload File</h3>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              <input
                type="text"
                placeholder="File Title"
                className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={fileTitle}
                onChange={(e) => setFileTitle(e.target.value)}
                required
              />
              <input
                type="file"
                className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                ref={fileInputRef}
                onChange={handleFileChange}
                required
              />
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              <button
                type="submit"
                className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition"
                disabled={uploading || reduxUploading}
              >
                {uploading || reduxUploading ? "Uploading..." : "Upload"}
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>

  );
};

export default DashboardSidebar;