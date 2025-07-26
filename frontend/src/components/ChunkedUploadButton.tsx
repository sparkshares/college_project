"use client";
import React, { useState } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import useChunkedUpload from '@/hooks/useChunkedUpload';

interface ChunkedUploadButtonProps {
  onUploadComplete?: (fileId: number) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number;
  chunkSize?: number;
  acceptedFileTypes?: string[];
  className?: string;
  buttonText?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const ChunkedUploadButton: React.FC<ChunkedUploadButtonProps> = ({
  onUploadComplete,
  onUploadError,
  maxFileSize = 100 * 1024 * 1024, // 100MB
  chunkSize = 1024 * 1024, // 1MB
  acceptedFileTypes = [],
  className = "",
  buttonText = "Upload File",
  variant = 'primary',
  size = 'md',
  disabled = false
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState("");
  const [showTitleInput, setShowTitleInput] = useState(false);

  const {
    uploadFile,
    isUploading,
    progress,
    uploadedChunks,
    totalChunks,
    error,
    cancelUpload
  } = useChunkedUpload({
    chunkSize,
    onProgress: (progress, uploaded, total) => {
      console.log(`Upload progress: ${progress}% (${uploaded}/${total} chunks)`);
    },
    onComplete: (fileId) => {
      setSelectedFile(null);
      setFileTitle("");
      setShowTitleInput(false);
      onUploadComplete?.(fileId);
    },
    onError: (error) => {
      onUploadError?.(error);
    }
  });

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxFileSize) {
      const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
      onUploadError?.(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }

    // Validate file type if specified
    if (acceptedFileTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const isValidType = acceptedFileTypes.some(type => 
        type.includes(fileExtension || '') || 
        file.type.includes(type.replace('*', ''))
      );
      
      if (!isValidType) {
        onUploadError?.(`File type not supported. Accepted types: ${acceptedFileTypes.join(', ')}`);
        return;
      }
    }

    setSelectedFile(file);
    setFileTitle(file.name.split('.')[0]);
    setShowTitleInput(true);
  };

  // Handle upload start
  const handleUpload = async () => {
    if (!selectedFile || !fileTitle.trim()) return;
    await uploadFile(selectedFile, fileTitle.trim());
  };

  // Handle cancel
  const handleCancel = () => {
    if (isUploading) {
      cancelUpload();
    }
    setSelectedFile(null);
    setFileTitle("");
    setShowTitleInput(false);
  };

  // Get button variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600';
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600';
      case 'outline':
        return 'bg-white hover:bg-gray-50 text-blue-600 border-blue-600';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600';
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'md':
        return 'px-4 py-3 text-base';
      case 'lg':
        return 'px-6 py-4 text-lg';
      default:
        return 'px-4 py-3 text-base';
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (showTitleInput && selectedFile) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* File Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Upload className="text-blue-600" size={20} />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{selectedFile.name}</h4>
              <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>

          {/* Title Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Title
            </label>
            <input
              type="text"
              value={fileTitle}
              onChange={(e) => setFileTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter a title for your file"
            />
          </div>

          {/* Progress Bar (if uploading) */}
          {isUploading && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">
                  Uploading... ({uploadedChunks}/{totalChunks} chunks)
                </span>
                <span className="font-medium text-gray-900">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="text-red-500 flex-shrink-0" size={16} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-200 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              disabled={isUploading}
            >
              {isUploading ? 'Cancel' : 'Back'}
            </button>
            <button
              onClick={handleUpload}
              disabled={!fileTitle.trim() || isUploading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Start Upload
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <input
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        id="chunked-file-input"
        accept={acceptedFileTypes.join(',')}
        disabled={disabled || isUploading}
      />
      <label
        htmlFor="chunked-file-input"
        className={`
          inline-flex items-center justify-center gap-2 font-medium rounded-lg border cursor-pointer transition-all duration-200
          ${getSizeClasses()}
          ${getVariantClasses()}
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        `}
      >
        {isUploading ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            Uploading...
          </>
        ) : progress === 100 ? (
          <>
            <CheckCircle size={16} />
            Uploaded!
          </>
        ) : (
          <>
            <Upload size={16} />
            {buttonText}
          </>
        )}
      </label>
    </div>
  );
};

export default ChunkedUploadButton;
