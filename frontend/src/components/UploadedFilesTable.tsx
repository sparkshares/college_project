import React from "react";
import { Download, FileText, Loader2 } from "lucide-react";

interface UploadedFilesTableProps {
  files: any[];
  loading: boolean;
  onDownload: (file: any) => void;
  onSummarize?: (file: any) => void;
}

const UploadedFilesTable: React.FC<UploadedFilesTableProps> = ({ files, loading, onDownload, onSummarize }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="text-gray-600">Loading files...</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <FileText className="text-gray-400" size={32} />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No files yet</h3>
        <p className="text-gray-600">Upload your first file to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">File Title</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">File Name</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Uploaded At</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {files.map((file) => (
            <tr key={file.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <FileText className="text-blue-600" size={16} />
                  </div>
                  <span className="font-medium text-gray-900">{file.file_title}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-gray-600">{file.file_name}</span>
              </td>
              <td className="px-6 py-4">
                <span className="text-gray-600">
                  {new Date(file.uploaded_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onDownload(file)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Download size={16} />
                    Download
                  </button>
                  {onSummarize && (
                    <button
                      onClick={() => onSummarize(file)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors text-sm font-medium"
                    >
                      <FileText size={16} />
                      Summarize
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UploadedFilesTable;
