"use client";
import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle, Pause, Play, RotateCcw } from 'lucide-react';
import { useSelector } from 'react-redux';
import CryptoJS from 'crypto-js';
import type { RootState } from '@/store/store';
import { FILE_ENDPOINTS, API_UTILS } from '@/config/endpoints';

interface ChunkedUploadResponse {
  upload_id: string;
  file_id: number;
  detail: string;
  total_chunks: number;
  chunk_size: number;
}

interface ChunkUploadResponse {
  detail: string;
  chunk_number: number;
  chunk_size: number;
  uploaded_chunks: number;
  total_chunks: number;
  progress_percentage: number;
}

interface UploadStatus {
  upload_id: string;
  file_title: string;
  total_chunks: number;
  uploaded_chunks: number;
  is_complete: boolean;
  progress_percentage: number;
  missing_chunks: number[];
}

interface ChunkedFileUploadProps {
  onUploadComplete?: (fileId: number) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number; // in bytes, default 100MB
  chunkSize?: number; // in bytes, default 1MB
  acceptedFileTypes?: string[];
  className?: string;
  showProgress?: boolean;
}

interface UploadState {
  file: File | null;
  fileTitle: string;
  uploadId: string | null;
  isUploading: boolean;
  isPaused: boolean;
  progress: number;
  uploadedChunks: number;
  totalChunks: number;
  error: string;
  currentChunk: number;
  retryCount: number;
}

const ChunkedFileUpload: React.FC<ChunkedFileUploadProps> = ({
  onUploadComplete,
  onUploadError,
  maxFileSize = 100 * 1024 * 1024, // 100MB
  chunkSize = 1024 * 1024, // 1MB
  acceptedFileTypes = [],
  className = "",
  showProgress = true
}) => {
  const { access } = useSelector((state: RootState) => state.auth);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    fileTitle: "",
    uploadId: null,
    isUploading: false,
    isPaused: false,
    progress: 0,
    uploadedChunks: 0,
    totalChunks: 0,
    error: "",
    currentChunk: 0,
    retryCount: 0
  });

  // Calculate MD5 hash for chunk verification
  const calculateChunkHash = async (chunk: Blob): Promise<string> => {
    // Get the raw binary data
    const buffer = await chunk.arrayBuffer();
    
    // Convert ArrayBuffer to WordArray for crypto-js
    const wordArray = CryptoJS.lib.WordArray.create(buffer);
    
    // Calculate MD5 hash
    const hash = CryptoJS.MD5(wordArray);
    
    // Convert to hex string and return first 8 characters
    const hashHex = hash.toString(CryptoJS.enc.Hex);
    return hashHex.substring(0, 8);
  };

  // Initialize chunked upload
  const initializeUpload = async (file: File, title: string): Promise<ChunkedUploadResponse> => {
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    const response = await fetch(FILE_ENDPOINTS.CHUNK_INIT, {
      method: 'POST',
      headers: API_UTILS.createJsonHeaders(access),
      body: JSON.stringify({
        file_title: title,
        file_name: file.name,
        file_size: file.size,
        total_chunks: totalChunks,
        chunk_size: chunkSize
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to initialize upload');
    }

    return await response.json();
  };

  // Upload individual chunk
  const uploadChunk = async (
    uploadId: string, 
    file: File, 
    chunkNumber: number
  ): Promise<ChunkUploadResponse> => {
    const start = chunkNumber * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunkBlob = file.slice(start, end);
    
    // Calculate chunk hash for verification using the specified method
    const chunkHash = await calculateChunkHash(chunkBlob);
    
    // Create form data as specified by the user
    const formData = new FormData();
    formData.append('chunk_number', chunkNumber.toString());
    formData.append('chunk_hash', chunkHash);
    formData.append('chunk', chunkBlob);

    console.log(`Uploading chunk ${chunkNumber} with hash ${chunkHash}, size: ${chunkBlob.size}`);

    const response = await fetch(FILE_ENDPOINTS.CHUNK_UPLOAD(uploadId), {
      method: 'POST',
      headers: API_UTILS.createFormDataHeaders(access),
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Chunk upload failed:', errorData);
      throw new Error(errorData.detail || `Failed to upload chunk ${chunkNumber}`);
    }

    return await response.json();
  };

  // Get upload status
  const getUploadStatus = async (uploadId: string): Promise<UploadStatus> => {
    const response = await fetch(FILE_ENDPOINTS.CHUNK_STATUS(uploadId), {
      headers: API_UTILS.createFormDataHeaders(access)
    });

    if (!response.ok) {
      throw new Error('Failed to get upload status');
    }

    return await response.json();
  };

  // Complete upload
  const completeUpload = async (uploadId: string): Promise<void> => {
    console.log('Completing upload for ID:', uploadId);
    
    const requestBody = JSON.stringify({
      upload_id: uploadId
    });
    
    console.log('Complete upload request body:', requestBody);
    console.log('Complete upload headers:', {
      'Authorization': `Bearer ${access}`,
      'Content-Type': 'application/json'
    });
    
    const response = await fetch(FILE_ENDPOINTS.CHUNK_COMPLETE, {
      method: 'POST',
      headers: API_UTILS.createJsonHeaders(access),
      body: requestBody
    });

    console.log('Complete upload response status:', response.status);
    console.log('Complete upload response headers:', response.headers);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Complete upload failed:', errorData);
      
      // Log the actual request details for debugging
      console.error('Complete upload request details:', {
        url: FILE_ENDPOINTS.CHUNK_COMPLETE,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access}`,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });
      
      throw new Error(errorData.detail || 'Failed to complete upload');
    }

    console.log('Upload completed successfully');
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    console.log('File selected:', selectedFile.name, selectedFile.size);

    // Validate file size
    if (selectedFile.size > maxFileSize) {
      const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
      setUploadState(prev => ({
        ...prev,
        error: `File size exceeds ${maxSizeMB}MB limit`
      }));
      return;
    }

    // Validate file type if specified
    if (acceptedFileTypes.length > 0) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      const isValidType = acceptedFileTypes.some(type => 
        type.includes(fileExtension || '') || 
        selectedFile.type.includes(type.replace('*', ''))
      );
      
      if (!isValidType) {
        setUploadState(prev => ({
          ...prev,
          error: `File type not supported. Accepted types: ${acceptedFileTypes.join(', ')}`
        }));
        return;
      }
    }

    setUploadState(prev => ({
      ...prev,
      file: selectedFile,
      fileTitle: selectedFile.name.split('.')[0],
      error: "",
      progress: 0,
      uploadedChunks: 0,
      totalChunks: 0,
      uploadId: null,
      currentChunk: 0,
      retryCount: 0
    }));
  };

  // Main upload function
  const startUpload = async () => {
    if (!uploadState.file || !uploadState.fileTitle.trim()) {
      setUploadState(prev => ({
        ...prev,
        error: "Please select a file and provide a title"
      }));
      return;
    }

    if (!access) {
      setUploadState(prev => ({
        ...prev,
        error: "Authentication required. Please login again."
      }));
      return;
    }

    // Store references to avoid stale closure issues
    const currentFile = uploadState.file;
    const currentTitle = uploadState.fileTitle;

    try {
      setUploadState(prev => ({
        ...prev,
        isUploading: true,
        isPaused: false,
        error: "",
        progress: 0,
        currentChunk: 0,
        retryCount: 0
      }));

      console.log('Starting upload for file:', currentFile.name);

      // Initialize upload
      const initResponse = await initializeUpload(currentFile, currentTitle);
      
      console.log('Upload initialized:', initResponse);

      setUploadState(prev => ({
        ...prev,
        uploadId: initResponse.upload_id,
        totalChunks: initResponse.total_chunks
      }));

      // Upload chunks sequentially
      for (let chunkNumber = 0; chunkNumber < initResponse.total_chunks; chunkNumber++) {
        // Check if upload was paused - need to get current state
        let isPausedCheck = false;
        setUploadState(prev => {
          isPausedCheck = prev.isPaused;
          return prev;
        });
        
        if (isPausedCheck) {
          console.log('Upload paused by user');
          return;
        }

        console.log(`Uploading chunk ${chunkNumber + 1}/${initResponse.total_chunks}`);
        
        try {
          setUploadState(prev => ({ ...prev, currentChunk: chunkNumber }));
          
          const chunkResponse = await uploadChunk(
            initResponse.upload_id,
            currentFile, // Use the stored reference
            chunkNumber
          );

          console.log(`Chunk ${chunkNumber} uploaded successfully:`, chunkResponse);

          setUploadState(prev => ({
            ...prev,
            progress: chunkResponse.progress_percentage,
            uploadedChunks: chunkResponse.uploaded_chunks,
            retryCount: 0 // Reset retry count on successful upload
          }));

        } catch (chunkError: any) {
          console.error(`Error uploading chunk ${chunkNumber}:`, chunkError);
          
          // Check if the error is due to network issues or server errors
          if (chunkError.message.includes('Failed to fetch') || chunkError.message.includes('500') || chunkError.message.includes('502') || chunkError.message.includes('503')) {
            // For network/server errors, stop the upload instead of infinite retries
            throw new Error(`Network error during chunk ${chunkNumber} upload: ${chunkError.message}`);
          }
          
          // Retry failed chunk up to 3 times
          let currentRetryCount = 0;
          setUploadState(prev => {
            currentRetryCount = prev.retryCount;
            return prev;
          });
          
          if (currentRetryCount < 3) {
            setUploadState(prev => ({
              ...prev,
              retryCount: prev.retryCount + 1
            }));
            chunkNumber--; // Retry the same chunk
            console.log(`Retrying chunk ${chunkNumber + 1}, attempt ${currentRetryCount + 2}`);
            
            // Add a small delay between retries to prevent overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 1000 * (currentRetryCount + 1)));
            continue;
          }
          
          throw new Error(`Failed to upload chunk ${chunkNumber} after 3 attempts: ${chunkError.message}`);
        }
        
        // Reset retry count after successful chunk upload
        setUploadState(prev => ({ ...prev, retryCount: 0 }));
      }

      console.log('All chunks uploaded, completing upload...');

      // Check upload status before completing
      try {
        const finalStatus = await getUploadStatus(initResponse.upload_id);
        console.log('Final upload status before completion:', finalStatus);
        
        if (!finalStatus.is_complete && finalStatus.missing_chunks.length === 0) {
          console.log('All chunks uploaded, proceeding to complete upload');
        } else if (finalStatus.missing_chunks.length > 0) {
          console.warn('Some chunks are still missing:', finalStatus.missing_chunks);
          throw new Error(`Upload incomplete. Missing chunks: ${finalStatus.missing_chunks.join(', ')}`);
        }
      } catch (statusError) {
        console.warn('Could not verify upload status before completion:', statusError);
      }

      // Complete upload
      await completeUpload(initResponse.upload_id);

      console.log('Upload completed successfully');

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100
      }));

      // Call success callback
      if (onUploadComplete) {
        onUploadComplete(initResponse.file_id);
      }

      // Reset state after a short delay
      setTimeout(() => {
        resetUpload();
      }, 2000);

    } catch (error: any) {
      console.error('Upload failed:', error);
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: error.message || "Upload failed"
      }));

      if (onUploadError) {
        onUploadError(error.message);
      }
    }
  };

  // Pause upload
  const pauseUpload = () => {
    setUploadState(prev => ({
      ...prev,
      isPaused: true,
      isUploading: false
    }));
  };

  // Resume upload
  const resumeUpload = async () => {
    if (!uploadState.uploadId) return;

    try {
      // Get current status
      const status = await getUploadStatus(uploadState.uploadId);
      
      setUploadState(prev => ({
        ...prev,
        isPaused: false,
        isUploading: true,
        progress: status.progress_percentage,
        uploadedChunks: status.uploaded_chunks,
        currentChunk: status.uploaded_chunks
      }));

      // Continue upload from where it left off
      if (status.missing_chunks.length > 0) {
        // Upload missing chunks
        for (const chunkNumber of status.missing_chunks) {
          if (uploadState.isPaused) return;
          
          await uploadChunk(uploadState.uploadId, uploadState.file!, chunkNumber);
        }
      }

      // Complete upload if all chunks are uploaded
      await completeUpload(uploadState.uploadId);
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100
      }));

      if (onUploadComplete && uploadState.file) {
        // Note: We'd need the file_id from the initial response
        onUploadComplete(0); // Placeholder
      }

    } catch (error: any) {
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: error.message || "Failed to resume upload"
      }));
    }
  };

  // Reset upload state
  const resetUpload = () => {
    setUploadState({
      file: null,
      fileTitle: "",
      uploadId: null,
      isUploading: false,
      isPaused: false,
      progress: 0,
      uploadedChunks: 0,
      totalChunks: 0,
      error: "",
      currentChunk: 0,
      retryCount: 0
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Selection */}
      {!uploadState.file && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer"
        >
          <Upload className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Choose file to upload
          </h3>
          <p className="text-gray-600 mb-4">
            Drag and drop or click to select files
          </p>
          <p className="text-sm text-gray-500">
            Maximum file size: {formatFileSize(maxFileSize)}
          </p>
          {acceptedFileTypes.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Accepted types: {acceptedFileTypes.join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept={acceptedFileTypes.join(',')}
      />

      {/* File Details & Title Input */}
      {uploadState.file && !uploadState.isUploading && uploadState.progress === 0 && (
        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="text-blue-600" size={20} />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{uploadState.file.name}</h4>
                <p className="text-sm text-gray-600">{formatFileSize(uploadState.file.size)}</p>
              </div>
            </div>
            <button
              onClick={resetUpload}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Title
            </label>
            <input
              type="text"
              value={uploadState.fileTitle}
              onChange={(e) => setUploadState(prev => ({ ...prev, fileTitle: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter a title for your file"
            />
          </div>

          <button
            onClick={startUpload}
            disabled={!uploadState.fileTitle.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Start Upload
          </button>
        </div>
      )}

      {/* Upload Progress */}
      {(uploadState.isUploading || uploadState.isPaused || uploadState.progress > 0) && showProgress && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">
                {uploadState.isPaused ? 'Upload Paused' : 
                 uploadState.isUploading ? 'Uploading...' : 
                 uploadState.progress === 100 ? 'Upload Complete!' : 'Upload Ready'}
              </h4>
              <p className="text-sm text-gray-600">
                {uploadState.file?.name} • {formatFileSize(uploadState.file?.size || 0)}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {uploadState.isUploading && (
                <button
                  onClick={pauseUpload}
                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <Pause size={20} />
                </button>
              )}
              
              {uploadState.isPaused && (
                <button
                  onClick={resumeUpload}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Play size={20} />
                </button>
              )}
              
              {!uploadState.isUploading && uploadState.progress < 100 && (
                <button
                  onClick={resetUpload}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <RotateCcw size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Chunk {uploadState.uploadedChunks} of {uploadState.totalChunks}
              </span>
              <span className="font-medium text-gray-900">
                {Math.round(uploadState.progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
          </div>

          {/* Status Message */}
          {uploadState.isUploading && (
            <p className="text-sm text-blue-600">
              Uploading chunk {uploadState.currentChunk + 1}...
            </p>
          )}
        </div>
      )}

      {/* Error Message */}
      {uploadState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-medium text-red-900">Upload Error</h4>
            <p className="text-red-700 text-sm mt-1">{uploadState.error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {uploadState.progress === 100 && !uploadState.error && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="text-green-500" size={20} />
          <div>
            <h4 className="font-medium text-green-900">Upload Successful!</h4>
            <p className="text-green-700 text-sm">Your file has been uploaded successfully.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChunkedFileUpload;
