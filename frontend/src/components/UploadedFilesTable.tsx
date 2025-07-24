import React from "react";

interface UploadedFilesTableProps {
  files: any[];
  loading: boolean;
  onDownload: (file: any) => void;
}

const UploadedFilesTable: React.FC<UploadedFilesTableProps> = ({ files, loading, onDownload }) => (
  <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
    {loading ? (
      <div className="text-center py-4">Loading files...</div>
    ) : (
      <table className="min-w-full text-left">
        <thead>
          <tr>
            <th className="py-2 px-4 text-gray-500">File Title</th>
            <th className="py-2 px-4 text-gray-500">File Name</th>
            <th className="py-2 px-4 text-gray-500">Uploaded At</th>
            <th className="py-2 px-4 text-gray-500">Download</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id}>
              <td className="py-2 px-4">{file.file_title}</td>
              <td className="py-2 px-4">{file.file_name}</td>
              <td className="py-2 px-4">{file.uploaded_at.slice(0, 19).replace('T', ' ')}</td>
              <td className="py-2 px-4">
                <button
                  className="text-blue-600 underline"
                  onClick={() => onDownload(file)}
                >
                  Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

export default UploadedFilesTable;
