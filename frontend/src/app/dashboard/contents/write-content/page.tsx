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

export default function WriteContentPage() {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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
    content: "<p>Start writing your document...</p>",
  });

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      // Replace with your save logic (API call, etc.)
      const content = editor?.getHTML() || "";
      if (!title.trim()) {
        setError("Title is required.");
        setSaving(false);
        return;
      }
      // Example: await saveDoc({ title, content });
      // Simulate save
      setTimeout(() => {
        setSaving(false);
        router.push("/dashboard/contents");
      }, 1000);
    } catch (err: any) {
      setError("Failed to save document.");
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/contents");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-3xl w-full mx-auto mt-10 bg-white rounded-xl shadow-lg p-8 flex flex-col gap-6">
        {/* Title Input */}
        <input
          type="text"
          className="text-3xl font-bold border-none outline-none bg-transparent mb-2 placeholder-gray-400"
          placeholder="Untitled Document"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        {/* Editor Toolbar */}
        <TiptapMenu editor={editor} />

        {/* Editor */}
        <div className="border rounded-lg">
          <EditorContent editor={editor} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-500 text-sm mt-2">{error}</div>
        )}
      </div>

      <div className="0 w-full flex justify-center py-6 z-20">
        <div className="max-w-3xl w-full flex justify-end gap-4 px-8">
          <button
            onClick={handleCancel}
            className="px-6 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-100 transition"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}