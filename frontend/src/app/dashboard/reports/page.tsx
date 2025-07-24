import React from "react";

const summaryStats = [
  { label: "Total Reports", value: 128, color: "bg-blue-100", text: "text-blue-700" },
  { label: "Pending", value: 24, color: "bg-yellow-100", text: "text-yellow-700" },
  { label: "Resolved", value: 96, color: "bg-green-100", text: "text-green-700" },
  { label: "Flagged", value: 8, color: "bg-red-100", text: "text-red-700" },
];

const reportsData = [
  { id: 1, title: "Network Issue", status: "Pending", date: "2024-06-01" },
  { id: 2, title: "Login Failure", status: "Resolved", date: "2024-05-28" },
  { id: 3, title: "UI Bug", status: "Flagged", date: "2024-05-25" },
  { id: 4, title: "Performance Lag", status: "Resolved", date: "2024-05-20" },
];

const statusColor = {
  Pending: "bg-yellow-200 text-yellow-800",
  Resolved: "bg-green-200 text-green-800",
  Flagged: "bg-red-200 text-red-800",
};

const Reports = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Reports Dashboard</h1>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {summaryStats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl shadow-sm p-6 ${stat.color} flex flex-col items-center`}
          >
            <div className={`text-3xl font-bold mb-2 ${stat.text}`}>{stat.value}</div>
            <div className="text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>
      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Recent Reports</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
            + New Report
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr>
                <th className="py-2 px-4 text-gray-500">ID</th>
                <th className="py-2 px-4 text-gray-500">Title</th>
                <th className="py-2 px-4 text-gray-500">Status</th>
                <th className="py-2 px-4 text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {reportsData.map((report) => (
                <tr key={report.id} className="border-t">
                  <td className="py-2 px-4">{report.id}</td>
                  <td className="py-2 px-4">{report.title}</td>
                  <td className="py-2 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold}`}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td className="py-2 px-4">{report.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;