"use client";

import { Folder, FileText, Download } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import UploadedFilesTable from "@/components/UploadedFilesTable";
import { uploadFile } from "@/store/authSlice";

const Dashboard = () => {
    const [recentFiles, setRecentFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [stats, setStats] = useState({
        total_files: 0,
        total_file_size: 0,
        total_downloads: 0,
    });
    const [showModal, setShowModal] = useState(false);
    const [fileTitle, setFileTitle] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dispatch = useDispatch<AppDispatch>();
    const { access } = useSelector((state: RootState) => state.auth);

    const fetchStats = async () => {
        if (!access) return;
        try {
            const res = await fetch("http://127.0.0.1:8000/api/account-stats", {
                headers: { Authorization: `Bearer ${access}` },
            });
            if (!res.ok) throw new Error("Failed to fetch stats");
            const data = await res.json();
            setStats({
                total_files: data.total_files,
                total_file_size: data.total_file_size,
                total_downloads: data.total_downloads,
            });
        } catch (err) {
            // Optionally handle error
        }
    };

    const fetchRecentFiles = async () => {
        if (!access) return;
        setLoading(true);
        try {
            const res = await fetch("http://127.0.0.1:8000/api/my-files", {
                headers: { Authorization: `Bearer ${access}` },
            });
            if (!res.ok) throw new Error("Failed to fetch files");
            const data = await res.json();
            setRecentFiles(data.slice(0, 5)); // Show only the latest 5 files
        } catch (err: any) {
            setError(err.message || "Failed to fetch files");
        } finally {
            setLoading(false);
        }
    };

    // Fetch both stats and files
    const fetchAllData = () => {
        fetchStats();
        fetchRecentFiles();
    };

    useEffect(() => {
        fetchAllData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [access]);

    // Download handler for files
    const handleDownload = async (file: any) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/download-file/${file.id}`, {
                headers: {
                    Authorization: `Bearer ${access}`,
                },
            });
            if (!res.ok) throw new Error("Failed to download file");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = file.file_name;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert("Download failed");
        }
    };

    // Upload modal logic
    const handleOpenModal = () => {
        setShowModal(true);
        setFileTitle("");
        setFile(null);
        setUploadError("");
    };
    const handleCloseModal = () => {
        setShowModal(false);
        setFileTitle("");
        setFile(null);
        setUploadError("");
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileTitle || !file) {
            setUploadError("Please provide both file title and file.");
            return;
        }
        if (!access) {
            setUploadError("You are not authenticated. Please login again.");
            return;
        }
        setUploading(true);
        setUploadError("");
        try {
            const result = await dispatch(uploadFile({ fileTitle, file }));
            if (uploadFile.fulfilled.match(result)) {
                setShowModal(false);
                fetchAllData(); // refresh data after upload
            } else {
                setUploadError(result.payload as string || "Upload failed. Please try again.");
            }
        } catch (err: any) {
            setUploadError(err.message || "Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-1">
            <main className="flex-1 p-6">
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
                                {uploadError && (
                                    <div className="text-red-500 text-sm">{uploadError}</div>
                                )}
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition"
                                    disabled={uploading}
                                >
                                    {uploading ? "Uploading..." : "Upload"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex items-center gap-4 rounded-lg p-6 shadow-sm bg-blue-50">
                        <FileText className="text-blue-500" size={32} />
                        <div>
                            <div className="text-2xl font-bold">{stats.total_files}</div>
                            <div className="text-gray-600">Files</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-lg p-6 shadow-sm bg-green-50">
                        <Folder className="text-green-500" size={32} />
                        <div>
                            <div className="text-2xl font-bold">
                                {(stats.total_file_size / (1024 * 1024)).toFixed(2)} MB
                            </div>
                            <div className="text-gray-600">Total Size</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-lg p-6 shadow-sm bg-purple-50">
                        <Download className="text-purple-500" size={32} />
                        <div>
                            <div className="text-2xl font-bold">{stats.total_downloads}</div>
                            <div className="text-gray-600">Downloads</div>
                        </div>
                    </div>
                </div>

                {/* Recently Uploaded Files */}
                <div><br />
                    <h2 className="text-xl font-semibold mb-4">
                        Recently Uploaded Files
                    </h2>
                    <UploadedFilesTable
                        files={recentFiles}
                        loading={loading}
                        onDownload={handleDownload}
                    />
                    {error && (
                        <div className="p-4 text-center text-red-500">{error}</div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;