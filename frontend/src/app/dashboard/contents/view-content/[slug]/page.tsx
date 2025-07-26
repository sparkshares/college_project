"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Calendar, User, Eye, Tag } from "lucide-react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { DOCUMENT_ENDPOINTS, API_UTILS } from "@/config/endpoints";

interface DocumentData {
  id: number;
  title: string;
  content_json: string;
  thumbnail_path: string;
  keywords: string;
  followers_only: boolean;
  visibility: string;
  created_at: string;
  updated_at: string;
  profile: {
    username: string;
    display_name: string;
    profile_picture: string | null;
  };
}

export default function ViewContentPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const { access } = useSelector((state: RootState) => state.auth);

  const fetchDocument = async () => {
    if (!access) {
      setError("You are not authenticated. Please login again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const response = await fetch(DOCUMENT_ENDPOINTS.GET_DOCUMENT(slug), {
        headers: API_UTILS.createFormDataHeaders(access),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch document");
      }

      const result = await response.json();
      if (result.status === "success") {
        setDocument(result.data);
      } else {
        throw new Error(result.message || "Failed to fetch document");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch document");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchDocument();
    }
  }, [slug, access]);

  const parseContentJson = (contentJson: string) => {
    try {
      const parsed = JSON.parse(contentJson);
      return parsed.content || parsed.title || "";
    } catch {
      return contentJson;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 font-medium">Loading document...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-red-500 mb-4">
              <FileText size={48} className="mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Document</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/dashboard/contents")}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Back to Documents
              </button>
              <button
                onClick={fetchDocument}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Document Not Found</h2>
          <p className="text-gray-600 mb-6">The document you're looking for doesn't exist.</p>
          <Link
            href="/dashboard/contents"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Documents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard/contents"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Back to Documents</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2 text-gray-600">
                <Eye size={18} />
                <span className="text-sm font-medium">View Mode</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <User size={16} />
                <span>{document.profile.display_name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Document Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{document.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>Created: {formatDate(document.created_at)}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>Updated: {formatDate(document.updated_at)}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Eye size={16} />
                <span className="capitalize">{document.visibility}</span>
              </div>
              {document.followers_only && (
                <>
                  <span>•</span>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                    Followers Only
                  </span>
                </>
              )}
            </div>
            
            {/* Keywords */}
            {document.keywords && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag size={16} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Tags:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {document.keywords.split(',').map((keyword, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {keyword.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Document Content */}
          <div className="p-6">
            <div className="prose prose-lg max-w-none">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: parseContentJson(document.content_json) || "<p>No content available.</p>" 
                }} 
              />
            </div>
          </div>

          {/* Document Footer */}
          
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/dashboard/contents"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors shadow-sm"
          >
            <ArrowLeft size={16} />
            Back to All Documents
          </Link>
        </div>
      </div>
    </div>
  );
}
