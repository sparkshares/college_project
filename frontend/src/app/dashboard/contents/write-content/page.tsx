"use client";
import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import "./tiptap.css";
import TiptapMenu from "./TiptapMenu";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Blockquote from "@tiptap/extension-blockquote";
import CodeBlock from "@tiptap/extension-code-block";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, FileText, Eye } from "lucide-react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { DOCUMENT_ENDPOINTS, API_UTILS } from "@/config/endpoints";

export default function WriteContentPage() {
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();
  
  // Get access token from Redux store
  const { access } = useSelector((state: RootState) => state.auth);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Heading,
      BulletList,
      OrderedList,
      ListItem,
      Blockquote,
      CodeBlock,
    ],
    content: "",
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      setWordCount(text.length > 0 ? text.split(/\s+/).length : 0);
    },
  });

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const content = editor?.getHTML() || "";
      if (!title.trim()) {
        setError("Title is required.");
        setSaving(false);
        return;
      }

      if (!access) {
        setError("You are not authenticated. Please login again.");
        setSaving(false);
        return;
      }

      // Create document using the new API
      const response = await fetch(DOCUMENT_ENDPOINTS.CREATE_DOCUMENT, {
        method: "POST",
        headers: API_UTILS.createJsonHeaders(access),
        body: JSON.stringify({
          title: title.trim(),
          content_json: JSON.stringify({ title: title.trim(), content }),
          thumbnail_path: "/images/default-thumb.png",
          keywords: keywords.trim() || "document,content",
          followers_only: false,
          visibility: visibility
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save document");
      }

      const result = await response.json();
      if (result.status === "success") {
        // Successfully saved
        router.push("/dashboard/contents");
      } else {
        throw new Error(result.message || "Failed to save document");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save document.");
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/contents");
  };

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
                <FileText size={18} />
                <span className="text-sm font-medium">
                  {wordCount} words
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye size={16} />
                {showPreview ? "Edit" : "Preview"}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving}
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Document Header */}
          <div className="p-6 border-b border-gray-200">
            <input
              type="text"
              className="w-full text-3xl font-bold border-none outline-none bg-transparent placeholder-gray-400 focus:ring-0"
              placeholder="Untitled Document"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {!showPreview ? (
            <>
              {/* Editor Toolbar */}
              <div className="border-b border-gray-200 bg-gray-50/50">
                <div className="p-4">
                  <TiptapMenu editor={editor} />
                </div>
              </div>

              {/* Editor */}
              <div className="">
                <EditorContent 
                  editor={editor} 
                  className="prose prose-lg max-w-none p-6 focus:outline-none"
                />
              </div>
            </>
          ) : (
            <div className="p-6">
              <div className="prose prose-lg max-w-none">
                <h1>{title || "Untitled Document"}</h1>
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: editor?.getHTML() || "<p>No content yet...</p>" 
                  }} 
                />
              </div>
            </div>
          )}

          {/* Keywords and Visibility */}
          <div className="p-6 border-t border-gray-200 bg-gray-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. react, javascript, tutorial"
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={e => setVisibility(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="unlisted">Unlisted</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-t border-red-200">
              <div className="text-red-700 text-sm font-medium">{error}</div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}