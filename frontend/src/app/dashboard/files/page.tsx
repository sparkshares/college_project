"use client";

import React, { useState, useRef, useEffect } from "react";
import { FileText, File, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { uploadFile } from "@/store/authSlice";
import type { RootState, AppDispatch } from "@/store/store";
import UploadedFilesTable from "@/components/UploadedFilesTable";

const Files = () => {
	const [showModal, setShowModal] = useState(false);
	const [fileTitle, setFileTitle] = useState("");
	const [file, setFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState("");
	const [files, setFiles] = useState<any[]>([]);
	const [loadingFiles, setLoadingFiles] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const dispatch = useDispatch<AppDispatch>();
	const { access, loading: reduxUploading } = useSelector((state: RootState) => state.auth);

	const fetchFiles = async () => {
		if (!access) return;
		setLoadingFiles(true);
		try {
			const res = await fetch("http://127.0.0.1:8000/api/my-files", {
				headers: {
					Authorization: `Bearer ${access}`,
				},
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
				await fetchFiles(); // Refresh file list after upload
			} else {
				setError(result.payload as string || "Upload failed. Please try again.");
			}
		} catch (err: any) {
			setError(err.message || "Upload failed. Please try again.");
		} finally {
			setUploading(false);
		}
	};

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

	const writtenDocs = [
		{ id: 1, title: "Meeting Notes", lastEdited: "2024-06-09" },
		{ id: 2, title: "Research Summary", lastEdited: "2024-06-07" },
		{ id: 3, title: "Personal Journal", lastEdited: "2024-06-03" },
	];

	return (
		<div className="p-8 bg-gray-50 min-h-screen">
			<h1 className="text-3xl font-bold mb-6 text-gray-800">My Files</h1>
			{/* Uploaded Files */}
			<div className="mb-10">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
						<File className="text-blue-500" size={22} /> Uploaded Files
					</h2>
					<button
						className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2"
						onClick={handleOpenModal}
					>
						<Plus size={18} /> Upload
					</button>
				</div>
				<UploadedFilesTable files={files} loading={loadingFiles} onDownload={handleDownload} />
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
		</div>
	);
};

export default Files;