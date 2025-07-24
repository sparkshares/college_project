import React from "react";

interface Doc {
  id: number;
  title: string;
  lastEdited: string;
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
              <td className="py-2 px-4 font-medium text-blue-700 hover:underline cursor-pointer">
                {doc.title}
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