"use client";

import React, { useState, useEffect } from "react";
import { FileText, File, Plus, X, Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import UploadedFilesTable from "@/components/UploadedFilesTable";
import ChunkedFileUpload from "@/components/ChunkedFileUpload";
import { FILE_ENDPOINTS, API_UTILS } from "@/config/endpoints";

const Files = () => {
	const [showModal, setShowModal] = useState(false);
	const [error, setError] = useState("");
	const [files, setFiles] = useState<any[]>([]);
	const [loadingFiles, setLoadingFiles] = useState(false);
	const [showSummaryModal, setShowSummaryModal] = useState(false);
	const [summaryLoading, setSummaryLoading] = useState(false);
	const [summaryText, setSummaryText] = useState("");
	const [summaryError, setSummaryError] = useState("");
	const [selectedFile, setSelectedFile] = useState<any>(null);
	const { access } = useSelector((state: RootState) => state.auth);

	// Format file size utility function
	const formatFileSize = (bytes: number): string => {
		if (!bytes || bytes === 0) return '0 B';
		if (isNaN(bytes) || !isFinite(bytes)) return '0 B';
		
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		
		if (i < 0 || i >= sizes.length) return '0 B';
		
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	};

	// Calculate total storage used with error handling
	const calculateTotalStorage = (): string => {
		if (!files || files.length === 0) return '0 B';
		
		try {
			const totalBytes = files.reduce((acc, file) => {
				const fileSize = parseInt(file.file_size) || 0;
				// Validate that the file size is reasonable (not corrupted data)
				if (fileSize < 0 || fileSize > 10 * 1024 * 1024 * 1024 * 1024) { // 10TB max
					console.warn('Invalid file size detected:', fileSize, 'for file:', file.file_name);
					return acc;
				}
				return acc + fileSize;
			}, 0);
			
			return formatFileSize(totalBytes);
		} catch (error) {
			console.error('Error calculating total storage:', error);
			return '0 B';
		}
	};

	const fetchFiles = async () => {
		if (!access) return;
		setLoadingFiles(true);
		try {
			const res = await fetch(FILE_ENDPOINTS.MY_FILES, {
				headers: API_UTILS.createFormDataHeaders(access),
			});
			if (!res.ok) throw new Error("Failed to fetch files");
			const data = await res.json();
			setFiles(data);
		} catch (err: any) {
			setError(err.message || "Failed to fetch files");
		} finally {
			setLoadingFiles(false);
		}
	};

	useEffect(() => {
		fetchFiles();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [access]);

	const handleOpenModal = () => {
		setShowModal(true);
		setError("");
	};

	const handleCloseModal = () => {
		setShowModal(false);
		setError("");
	};

	const handleUploadComplete = (fileId: number) => {
		console.log('Upload completed for file ID:', fileId);
		setShowModal(false);
		fetchFiles(); // Refresh file list after upload
	};

	const handleUploadError = (error: string) => {
		console.error('Upload error:', error);
		setError(error);
	};

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

	const handleSummarize = async (file: any) => {
		if (!access) {
			setSummaryError("You are not authenticated. Please login again.");
			return;
		}

		setSelectedFile(file);
		setShowSummaryModal(true);
		setSummaryLoading(true);
		setSummaryError("");
		setSummaryText("");

		try {
			const res = await fetch(FILE_ENDPOINTS.GENERATE_SUMMARY, {
				method: "POST",
				headers: API_UTILS.createJsonHeaders(access),
				body: JSON.stringify({
					file_id: file.id,
					max_length: 200,
				}),
			});

			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));
				throw new Error(errorData.detail || "Failed to generate summary");
			}

			const data = await res.json();
			// Handle the case where summary already exists vs new summary
			if (data.detail === "Summary already exists for this file" && data.summary) {
				setSummaryText(data.summary.summary || "No summary available");
			} else {
				// Handle both string and object responses
				if (typeof data.summary === 'string') {
					setSummaryText(data.summary);
				} else if (data.summary && data.summary.summary) {
					setSummaryText(data.summary.summary);
				} else {
					setSummaryText("No summary available");
				}
			}
		} catch (err: any) {
			setSummaryError(err.message || "Failed to generate summary");
		} finally {
			setSummaryLoading(false);
		}
	};

	const handleCloseSummaryModal = () => {
		setShowSummaryModal(false);
		setSummaryText("");
		setSummaryError("");
		setSelectedFile(null);
	};

	const writtenDocs = [
		{ id: 1, title: "Meeting Notes", lastEdited: "2024-06-09" },
		{ id: 2, title: "Research Summary", lastEdited: "2024-06-07" },
		{ id: 3, title: "Personal Journal", lastEdited: "2024-06-03" },
	];

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">My Files</h1>
					<p className="text-gray-600 mt-1">Upload, manage, and organize your files</p>
				</div>
				<button
					onClick={handleOpenModal}
					className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl"
				>
					<Plus size={20} />
					Upload File
				</button>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
				{/* Total Files Card */}
				<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-600 text-sm font-medium">Total Files</p>
							<p className="text-3xl font-bold text-gray-900 mt-1">
								{loadingFiles ? (
									<span className="animate-pulse">...</span>
								) : (
									files.length.toLocaleString()
								)}
							</p>
							<p className="text-gray-500 text-xs mt-1">
								{files.length === 1 ? 'file' : 'files'} stored
							</p>
						</div>
						<div className="bg-blue-100 p-3 rounded-xl">
							<File className="text-blue-600" size={24} />
						</div>
					</div>
				</div>

				{/* Storage Used Card */}
				<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-600 text-sm font-medium">Storage Used</p>
							<p className="text-3xl font-bold text-gray-900 mt-1">
								{loadingFiles ? (
									<span className="animate-pulse">...</span>
								) : (
									calculateTotalStorage()
								)}
							</p>
							<p className="text-gray-500 text-xs mt-1">
								across all files
							</p>
						</div>
						<div className="bg-green-100 p-3 rounded-xl">
							<FileText className="text-green-600" size={24} />
						</div>
					</div>
				</div>

				{/* Recent Uploads Card */}
				<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-600 text-sm font-medium">Recent Uploads</p>
							<p className="text-3xl font-bold text-gray-900 mt-1">
								{loadingFiles ? (
									<span className="animate-pulse">...</span>
								) : (
									files.filter(file => {
										try {
											const uploadDate = new Date(file.uploaded_at);
											const now = new Date();
											const diffTime = Math.abs(now.getTime() - uploadDate.getTime());
											const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
											return diffDays <= 7;
										} catch (error) {
											console.warn('Invalid date for file:', file.file_name);
											return false;
										}
									}).length
								)}
							</p>
							<p className="text-gray-500 text-xs mt-1">
								this week
							</p>
						</div>
						<div className="bg-purple-100 p-3 rounded-xl">
							<Plus className="text-purple-600" size={24} />
						</div>
					</div>
				</div>
			</div>

			{/* Files Table */}
			<div className="bg-white rounded-2xl shadow-sm border border-gray-100">
				<div className="p-6 border-b border-gray-100">
					<div className="flex items-center gap-3">
						<div className="bg-blue-100 p-2 rounded-lg">
							<File className="text-blue-600" size={20} />
						</div>
						<div>
							<h2 className="text-xl font-semibold text-gray-900">Uploaded Files</h2>
							<p className="text-gray-600 text-sm">View, download, and manage your files</p>
						</div>
					</div>
				</div>
				<div className="p-6">
					<UploadedFilesTable files={files} loading={loadingFiles} onDownload={handleDownload} onSummarize={handleSummarize} />
				</div>
			</div>
			
			{/* Upload Modal */}
			{showModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
					<div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between mb-6">
							<div>
								<h3 className="text-2xl font-bold text-gray-900">Upload File</h3>
								<p className="text-gray-600 text-sm">Upload files with advanced chunked uploading</p>
							</div>
							<button
								className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
								onClick={handleCloseModal}
							>
								<X size={24} />
							</button>
						</div>
						
						<ChunkedFileUpload 
							onUploadComplete={handleUploadComplete}
							onUploadError={handleUploadError}
							maxFileSize={1024 * 1024 * 1024} // 1GB
							chunkSize={5 * 1024 * 1024} // 5MB chunks
							showProgress={true}
							className="w-full"
						/>
						
						{error && (
							<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
								{error}
							</div>
						)}
					</div>
				</div>
			)}

			{/* Summary Modal */}
			{showSummaryModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
					<div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl mx-4 max-h-[85vh] overflow-y-auto">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-2xl font-bold text-gray-900">
								File Summary
							</h3>
							<button
								className="text-gray-400 hover:text-gray-600 p-1"
								onClick={handleCloseSummaryModal}
							>
								<X size={24} />
							</button>
						</div>
						
						{summaryLoading ? (
							<div className="flex flex-col items-center justify-center py-16">
								<div className="relative">
									<div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
								</div>
								<p className="text-gray-600 mt-4 text-lg">Generating summary...</p>
								<p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
							</div>
						) : summaryError ? (
							<div className="text-center py-16">
								<div className="bg-red-100 p-4 rounded-xl inline-block mb-4">
									<FileText className="text-red-600" size={48} />
								</div>
								<h4 className="text-xl font-semibold text-red-700 mb-2">Summary Error</h4>
								<p className="text-red-600 mb-6">{summaryError}</p>
								<button
									onClick={() => handleSummarize(selectedFile)}
									className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
								>
									Try Again
								</button>
							</div>
						) : (
							<div className="space-y-6">
								<div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
									<div className="flex items-center gap-3 mb-4">
										<div className="bg-blue-100 p-2 rounded-lg">
											<FileText className="text-blue-600" size={20} />
										</div>
										<h4 className="text-lg font-semibold text-gray-900">Summary</h4>
									</div>
									<div className="prose prose-sm max-w-none">
										<p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
											{summaryText}
										</p>
									</div>
								</div>
								
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="bg-gray-50 rounded-xl p-4">
										<h5 className="font-semibold text-gray-700 mb-2">File Details</h5>
										<div className="space-y-2 text-sm text-gray-600">
											<p><strong>Title:</strong> {selectedFile?.file_title}</p>
											<p><strong>Filename:</strong> {selectedFile?.file_name}</p>
											<p><strong>Size:</strong> {selectedFile?.file_size ? `${(selectedFile.file_size / 1024).toFixed(1)} KB` : 'Unknown'}</p>
										</div>
									</div>
									<div className="bg-gray-50 rounded-xl p-4">
										<h5 className="font-semibold text-gray-700 mb-2">Upload Info</h5>
										<div className="space-y-2 text-sm text-gray-600">
											<p><strong>Uploaded:</strong> {selectedFile?.uploaded_at?.slice(0, 19).replace('T', ' ')}</p>
											<p><strong>Status:</strong> <span className="text-green-600 font-medium">Available</span></p>
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default Files;