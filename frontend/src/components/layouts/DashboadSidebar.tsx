"use client"

import {
  Upload,
  LayoutDashboard,
  BarChart2,
  Folder,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  X,
  Plus
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ChunkedFileUpload from "@/components/ChunkedFileUpload";

const DashboardSidebar = ({ onUploadSuccess }: { onUploadSuccess?: () => void }) => {
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);

  const handleOpenModal = () => {
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleUploadComplete = (fileId: number) => {
    console.log('Upload completed for file ID:', fileId);
    setShowModal(false);
    if (onUploadSuccess) {
      onUploadSuccess();
    }
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    // Error is already handled by the ChunkedFileUpload component
  };

  const menuItems = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      description: "Overview & analytics"
    },
    {
      href: "/dashboard/reports",
      icon: BarChart2,
      label: "Reports",
      description: "View statistics"
    },
    {
      href: "/dashboard/files",
      icon: Folder,
      label: "Files",
      description: "Manage uploads"
    },
    {
      href: "/dashboard/contents",
      icon: FileText,
      label: "Contents",
      description: "Write & edit"
    },
    {
      href: "/dashboard/settings",
      icon: Settings,
      label: "Settings",
      description: "Account & preferences"
    }
  ];

  const supportItems = [
    {
      href: "/dashboard/help",
      icon: HelpCircle,
      label: "Help Center",
      description: "Get support"
    }
  ];

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-4rem)] fixed top-16 left-0 z-30 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <button
          onClick={handleOpenModal}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <Plus size={20} />
          New Upload
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6">
        {/* Main Navigation */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-4">
            Main Menu
          </h3>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <div className={`group flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-sm border-l-4 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                  <div className={`p-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700'
                  }`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {item.description}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Support Section */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-4">
            Support
          </h3>
          <div className="space-y-2">
            {supportItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`group flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-sm border-l-4 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}>
                    <div className={`p-2 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700'
                    }`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                        {item.label}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {item.description}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 text-sm">
          <LogOut size={18} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl mx-4 relative animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors z-10"
              onClick={handleCloseModal}
            >
              <X size={20} />
            </button>
            
            <div className="mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Upload className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Upload New File</h3>
              <p className="text-gray-600 text-sm">Upload files with advanced chunked uploading for large files</p>
            </div>
            
            <ChunkedFileUpload 
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              maxFileSize={500 * 1024 * 1024} // 500MB
              chunkSize={2 * 1024 * 1024} // 2MB chunks
              showProgress={true}
              className="w-full"
            />
          </div>
        </div>
      )}
    </aside>
  );
};

export default DashboardSidebar;