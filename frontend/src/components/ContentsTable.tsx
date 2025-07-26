import React from "react";
import Link from "next/link";

interface Doc {
  id: number;
  title: string;
  lastEdited: string;
  slug: string;
}

const ContentsTable = ({ docs }: { docs: Doc[] }) => (
  <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
    <table className="min-w-full text-left">
      <thead>
        <tr>
          <th className="py-2 px-4 text-gray-500">Title</th>
          <th className="py-2 px-4 text-gray-500">Last Edited</th>
        </tr>
      </thead>
      <tbody>
        {docs.length === 0 ? (
          <tr>
            <td colSpan={2} className="py-6 px-4 text-center text-gray-400">
              No documents found.
            </td>
          </tr>
        ) : (
          docs.map((doc, idx) => (
            <tr key={doc.id} className={idx % 2 ? "bg-gray-50" : ""}>
              <td className="py-2 px-4">
                <Link 
                  href={`/dashboard/contents/view-content/${doc.slug}`}
                  className="font-medium text-blue-700 hover:text-blue-900 hover:underline cursor-pointer transition-colors"
                >
                  {doc.title}
                </Link>
              </td>
              <td className="py-2 px-4">{doc.lastEdited}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default ContentsTable;