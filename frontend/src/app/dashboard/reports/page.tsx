"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { STATS_ENDPOINTS, API_UTILS } from "@/config/endpoints";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, 
  Download, 
  Upload, 
  Monitor, 
  BarChart3, 
  PieChart as PieChartIcon,
  TrendingDown,
  Calendar,
  RefreshCw
} from "lucide-react";

interface DailyData {
  date: string;
  day_name: string;
  download_count?: number;
  upload_count?: number;
}

interface DeviceData {
  device: string;
  count: number;
  percentage: number;
}

interface ChartResponse {
  chart_type: string;
  title: string;
  data: DailyData[] | DeviceData[];
  total_downloads?: number;
  total_uploads?: number;
}

const Reports = () => {
  const [downloadData, setDownloadData] = useState<ChartResponse | null>(null);
  const [uploadData, setUploadData] = useState<ChartResponse | null>(null);
  const [deviceData, setDeviceData] = useState<ChartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { access } = useSelector((state: RootState) => state.auth);

  const fetchAllData = async () => {
    if (!access) {
      setError("You are not authenticated. Please login again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Fetch all three APIs in parallel
      const [downloadsRes, uploadsRes, deviceRes] = await Promise.all([
        fetch(STATS_ENDPOINTS.DAILY_DOWNLOADS, {
          headers: API_UTILS.createFormDataHeaders(access)
        }),
        fetch(STATS_ENDPOINTS.DAILY_UPLOADS, {
          headers: API_UTILS.createFormDataHeaders(access)
        }),
        fetch(STATS_ENDPOINTS.DEVICE_DOWNLOADS_PIE, {
          headers: API_UTILS.createFormDataHeaders(access)
        })
      ]);

      if (!downloadsRes.ok || !uploadsRes.ok || !deviceRes.ok) {
        throw new Error("Failed to fetch statistics data");
      }

      const [downloadsData, uploadsData, deviceStatsData] = await Promise.all([
        downloadsRes.json(),
        uploadsRes.json(),
        deviceRes.json()
      ]);

      setDownloadData(downloadsData);
      setUploadData(uploadsData);
      setDeviceData(deviceStatsData);
    } catch (err: any) {
      setError(err.message || "Failed to fetch statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [access]);

  // Chart colors
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="animate-spin" size={24} />
          <span className="text-lg text-gray-600">Loading reports...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <p className="text-red-700 mb-4">{error}</p>
            <button 
              onClick={fetchAllData}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">Track your file activity and download statistics</p>
        </div>
        <button
          onClick={fetchAllData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Downloads</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {downloadData?.total_downloads || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Download className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Uploads</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {uploadData?.total_uploads || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <Upload className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Device Types</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {deviceData?.data?.length || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Unique devices</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl">
              <Monitor className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Downloads Line Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <TrendingUp className="text-blue-600" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {downloadData?.title || "Daily Downloads"}
                </h2>
                <p className="text-gray-600 text-sm">Download trends over the past week</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={downloadData?.data as DailyData[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day_name" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="download_count" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Uploads Bar Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <BarChart3 className="text-green-600" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {uploadData?.title || "Daily Uploads"}
                </h2>
                <p className="text-gray-600 text-sm">Upload activity over the past week</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={uploadData?.data as DailyData[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day_name" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar 
                  dataKey="upload_count" 
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Device Downloads Pie Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <PieChartIcon className="text-purple-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {deviceData?.title || "Downloads by Device Type"}
              </h2>
              <p className="text-gray-600 text-sm">Breakdown of downloads by device category</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {deviceData?.data && (deviceData.data as DeviceData[]).length > 0 ? (
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Pie Chart */}
              <div className="flex-1 w-full lg:w-1/2">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={deviceData.data as DeviceData[]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ device, percentage }) => `${percentage.toFixed(1)}%`}
                    >
                      {(deviceData.data as DeviceData[]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} downloads`, 'Count']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="w-full lg:w-1/2 lg:pl-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h3>
                <div className="space-y-3">
                  {(deviceData.data as DeviceData[]).map((entry, index) => (
                    <div key={entry.device} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: colors[index % colors.length] }}
                        ></div>
                        <span className="text-gray-700 font-medium">{entry.device}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{entry.count}</div>
                        <div className="text-sm text-gray-500">{entry.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Total Summary */}
                <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-700 font-medium">Total Downloads</span>
                    <span className="text-2xl font-bold text-purple-900">
                      {deviceData.total_downloads || (deviceData.data as DeviceData[]).reduce((sum, item) => sum + item.count, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Monitor className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">No device data available</p>
              <p className="text-sm text-gray-400 mt-2">Upload some files and generate downloads to see device statistics</p>
            </div>
          )}
        </div>
      </div>

      
    </div>
  );
};

export default Reports;