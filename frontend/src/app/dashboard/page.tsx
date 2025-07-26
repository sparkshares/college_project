"use client";

import { Folder, FileText, Download, Plus, Upload, TrendingUp, Clock, BarChart3, Users, Zap } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import UploadedFilesTable from "@/components/UploadedFilesTable";
import { uploadFile } from "@/store/authSlice";
import Link from "next/link";
import { STATS_ENDPOINTS, FILE_ENDPOINTS, API_UTILS } from "@/config/endpoints";

import ChunkedFileUpload from "@/components/ChunkedFileUpload";

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
    const [uploadError, setUploadError] = useState("");
    const dispatch = useDispatch<AppDispatch>();
    const { access } = useSelector((state: RootState) => state.auth);

    const fetchStats = async () => {
        if (!access) return;
        try {
            const res = await fetch(STATS_ENDPOINTS.ACCOUNT_STATS, {
                headers: API_UTILS.createFormDataHeaders(access),
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
            const res = await fetch(FILE_ENDPOINTS.MY_FILES, {
                headers: API_UTILS.createFormDataHeaders(access),
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
            const res = await fetch(FILE_ENDPOINTS.DOWNLOAD_FILE(file.id), {
                headers: API_UTILS.createFormDataHeaders(access),
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
        setUploadError("");
    };
    const handleCloseModal = () => {
        setShowModal(false);
        setUploadError("");
    };
    
    const handleUploadComplete = (fileId: number) => {
        console.log('Upload completed for file ID:', fileId);
        setShowModal(false);
        fetchAllData(); // refresh data after upload
    };

    const handleUploadError = (error: string) => {
        setUploadError(error);
    };

    const quickActions = [
        { title: "Upload Files", icon: Upload, href: "/dashboard/files", color: "bg-blue-500", description: "Add new documents and files" },
        { title: "Create Document", icon: FileText, href: "/dashboard/contents/write-content", color: "bg-green-500", description: "Write and edit documents" },
        { title: "View Reports", icon: TrendingUp, href: "/dashboard/reports", color: "bg-purple-500", description: "Check analytics and reports" },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
                    <p className="text-gray-600 mt-1">Here's what's happening with your files today.</p>
                </div>
                <button
                    onClick={handleOpenModal}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl"
                >
                    <Plus size={20} />
                    Quick Upload
                </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {quickActions.map((action, index) => (
                    <Link key={index} href={action.href}>
                        <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200 cursor-pointer">
                            <div className={`inline-flex p-3 rounded-xl ${action.color} text-white mb-4 group-hover:scale-110 transition-transform`}>
                                <action.icon size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                            <p className="text-gray-600 text-sm">{action.description}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Total Files</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total_files}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-xl">
                            <FileText className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Storage Used</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">
                                {(stats.total_file_size / (1024 * 1024)).toFixed(1)} MB
                            </p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-xl">
                            <Folder className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Downloads</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total_downloads}</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-xl">
                            <Download className="text-purple-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Files */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-100 p-2 rounded-lg">
                                <Clock className="text-orange-600" size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Recent Files</h2>
                                <p className="text-gray-600 text-sm">Your latest uploads and documents</p>
                            </div>
                        </div>
                        <Link 
                            href="/dashboard/files" 
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                            View all →
                        </Link>
                    </div>
                </div>
                <div className="p-6">
                    <UploadedFilesTable
                        files={recentFiles}
                        loading={loading}
                        onDownload={handleDownload}
                    />
                    {error && (
                        <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg mt-4">{error}</div>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Upload File</h3>
                            <button
                                className="text-gray-400 hover:text-gray-600 p-1"
                                onClick={handleCloseModal}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <ChunkedFileUpload 
                            onUploadComplete={handleUploadComplete}
                            onUploadError={handleUploadError}
                            maxFileSize={500 * 1024 * 1024} // 500MB
                            chunkSize={2 * 1024 * 1024} // 2MB chunks
                            showProgress={true}
                            className="w-full"
                        />
                        
                        {uploadError && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {uploadError}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
