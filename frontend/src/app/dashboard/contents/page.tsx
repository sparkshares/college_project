"use client";
import Link from "next/link";
import { FileText, Plus, BookOpen, PenTool, Calendar } from "lucide-react";
import ContentsTable from "@/components/ContentsTable";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { DOCUMENT_ENDPOINTS, API_UTILS } from "@/config/endpoints";

interface Document {
	id: number;
	title: string;
	thumbnail_path: string;
	keywords: string;
	link_slug: string;
	followers_only: boolean;
	visibility: string;
	created_at: string;
	updated_at: string;
}

const Contents = () => {
	const [documents, setDocuments] = useState<Document[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const { access } = useSelector((state: RootState) => state.auth);

	const fetchDocuments = async () => {
		if (!access) return;
		setLoading(true);
		setError("");
		try {
			const response = await fetch(DOCUMENT_ENDPOINTS.USER_DOCUMENTS, {
				headers: API_UTILS.createFormDataHeaders(access),
			});

			if (!response.ok) {
				throw new Error("Failed to fetch documents");
			}

			const result = await response.json();
			if (result.status === "success") {
				setDocuments(result.data || []);
			} else if (result.status === "error" && result.message === "No documents found for this user") {
				// Handle empty state gracefully - no documents found is not an error
				setDocuments([]);
			} else {
				throw new Error(result.message || "Failed to fetch documents");
			}
		} catch (err: any) {
			setError(err.message || "Failed to fetch documents");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchDocuments();
	}, [access]);

	// Transform documents for the table component
	const writtenDocs = documents.map(doc => ({
		id: doc.id,
		title: doc.title,
		lastEdited: new Date(doc.updated_at).toLocaleDateString(),
		slug: doc.link_slug,
	}));
	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
					<p className="text-gray-600 mt-1">Create, edit, and manage your written content</p>
				</div>
				<Link href="/dashboard/contents/write-content">
					<button className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl">
						<Plus size={20} />
						New Document
					</button>
				</Link>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
				<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-600 text-sm font-medium">Total Documents</p>
							<p className="text-2xl font-bold text-gray-900 mt-1">
								{loading ? (
									<span className="animate-pulse">...</span>
								) : (
									documents.length.toLocaleString()
								)}
							</p>
							<p className="text-gray-500 text-xs mt-1">
								{documents.length === 1 ? 'document' : 'documents'} created
							</p>
						</div>
						<div className="bg-green-100 p-3 rounded-xl">
							<FileText className="text-green-600" size={24} />
						</div>
					</div>
				</div>
				<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-600 text-sm font-medium">Last Edited</p>
							<p className="text-2xl font-semibold text-gray-900 mt-1">
								{documents.length > 0 
									? (() => {
										try {
											const mostRecent = [...documents].sort((a, b) => 
												new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
											)[0];
											const daysDiff = Math.floor(
												(new Date().getTime() - new Date(mostRecent.updated_at).getTime()) / (1000 * 60 * 60 * 24)
											);
											return daysDiff === 0 ? "Today" : 
												   daysDiff === 1 ? "1 day ago" : 
												   `${daysDiff} days ago`;
										} catch (error) {
											return "Unknown";
										}
									})()
									: "No documents"
								}
							</p>
							<p className="text-gray-500 text-xs mt-1">
								latest activity
							</p>
						</div>
						<div className="bg-blue-100 p-3 rounded-xl">
							<Calendar className="text-blue-600" size={24} />
						</div>
					</div>
				</div>
				<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-600 text-sm font-medium">Draft Status</p>
							<p className="text-2xl font-semibold text-gray-900 mt-1">
								{documents.length > 0 ? "All Saved" : "No Drafts"}
							</p>
							<p className="text-gray-500 text-xs mt-1">
								auto-saved changes
							</p>
						</div>
						<div className="bg-purple-100 p-3 rounded-xl">
							<PenTool className="text-purple-600" size={24} />
						</div>
					</div>
				</div>
			</div>

			{/* Documents Table */}
			<div className="bg-white rounded-2xl shadow-sm border border-gray-100">
				<div className="p-6 border-b border-gray-100">
					<div className="flex items-center gap-3">
						<div className="bg-green-100 p-2 rounded-lg">
							<BookOpen className="text-green-600" size={20} />
						</div>
						<div>
							<h2 className="text-xl font-semibold text-gray-900">Your Documents</h2>
							<p className="text-gray-600 text-sm">Manage and edit your written content</p>
						</div>
					</div>
				</div>
				<div className="p-6">
					{error && (
						<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-red-700 text-sm">{error}</p>
							<button 
								onClick={fetchDocuments}
								className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium underline"
							>
								Try again
							</button>
						</div>
					)}
					
					{loading ? (
						<div className="flex justify-center items-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
							<span className="ml-2 text-gray-600">Loading documents...</span>
						</div>
					) : documents.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12">
							<div className="bg-gray-100 p-4 rounded-full mb-4">
								<FileText size={48} className="text-gray-400" />
							</div>
							<h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
							<p className="text-gray-600 text-center mb-6 max-w-sm">
								You haven't created any documents yet. Start by creating your first document to get started.
							</p>
							<Link href="/dashboard/contents/write-content">
								<button className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors">
									<Plus size={20} />
									Create Your First Document
								</button>
							</Link>
						</div>
					) : (
						<ContentsTable docs={writtenDocs} />
					)}
				</div>
			</div>

		</div>
	);
};

export default Contents;