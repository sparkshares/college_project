import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
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

interface UseChunkedUploadOptions {
  chunkSize?: number;
  maxRetries?: number;
  onProgress?: (progress: number, uploadedChunks: number, totalChunks: number) => void;
  onChunkComplete?: (chunkNumber: number) => void;
  onError?: (error: string) => void;
  onComplete?: (fileId: number) => void;
}

interface UseChunkedUploadReturn {
  uploadFile: (file: File, title: string) => Promise<void>;
  pauseUpload: () => void;
  resumeUpload: () => Promise<void>;
  cancelUpload: () => void;
  getUploadStatus: (uploadId: string) => Promise<UploadStatus>;
  isUploading: boolean;
  isPaused: boolean;
  progress: number;
  uploadedChunks: number;
  totalChunks: number;
  error: string | null;
  uploadId: string | null;
}

export const useChunkedUpload = (options: UseChunkedUploadOptions = {}): UseChunkedUploadReturn => {
  const {
    chunkSize = 1024 * 1024, // 1MB default
    maxRetries = 3,
    onProgress,
    onChunkComplete,
    onError,
    onComplete
  } = options;

  const { access } = useSelector((state: RootState) => state.auth);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedChunks, setUploadedChunks] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Calculate simple hash for chunk verification (using a simple checksum since MD5 is not available in browsers)
  const calculateChunkHash = async (chunk: Blob): Promise<string> => {
    // Simple checksum based on chunk size and content
    // For better security, you might want to use a proper hashing library
    const arrayBuffer = await chunk.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let hash = 0;
    for (let i = 0; i < bytes.length; i++) {
      hash = ((hash << 5) - hash + bytes[i]) & 0xffffffff;
    }
    return Math.abs(hash).toString(16);
  };

  // Initialize chunked upload
  const initializeUpload = async (file: File, title: string): Promise<ChunkedUploadResponse> => {
    const chunks = Math.ceil(file.size / chunkSize);
    
    const response = await fetch(FILE_ENDPOINTS.CHUNK_INIT, {
      method: 'POST',
      headers: API_UTILS.createJsonHeaders(access),
      body: JSON.stringify({
        file_title: title,
        file_name: file.name,
        file_size: file.size,
        total_chunks: chunks,
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
    const chunk = file.slice(start, end);
    
    const chunkHash = await calculateChunkHash(chunk);
    
    const formData = new FormData();
    formData.append('chunk_number', chunkNumber.toString());
    formData.append('chunk_hash', chunkHash);
    formData.append('chunk', chunk);

    const response = await fetch(FILE_ENDPOINTS.CHUNK_UPLOAD(uploadId), {
      method: 'POST',
      headers: API_UTILS.createFormDataHeaders(access),
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to upload chunk ${chunkNumber}`);
    }

    return await response.json();
  };

  // Get upload status
  const getUploadStatus = useCallback(async (uploadId: string): Promise<UploadStatus> => {
    const response = await fetch(FILE_ENDPOINTS.CHUNK_STATUS(uploadId), {
      headers: API_UTILS.createFormDataHeaders(access)
    });

    if (!response.ok) {
      throw new Error('Failed to get upload status');
    }

    return await response.json();
  }, [access]);

  // Complete upload
  const completeUpload = async (uploadId: string): Promise<void> => {
    const response = await fetch(FILE_ENDPOINTS.CHUNK_COMPLETE, {
      method: 'POST',
      headers: API_UTILS.createJsonHeaders(access),
      body: JSON.stringify({
        upload_id: uploadId
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to complete upload');
    }
  };

  // Main upload function
  const uploadFile = useCallback(async (file: File, title: string) => {
    if (!access) {
      const errorMsg = 'Authentication required. Please login again.';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    try {
      setIsUploading(true);
      setIsPaused(false);
      setError(null);
      setProgress(0);
      setUploadedChunks(0);
      setRetryCount(0);
      setCurrentFile(file);

      console.log('Starting upload for file:', file.name);

      // Initialize upload
      const initResponse = await initializeUpload(file, title);
      
      console.log('Upload initialized:', initResponse);

      setUploadId(initResponse.upload_id);
      setTotalChunks(initResponse.total_chunks);

      // Upload chunks sequentially
      for (let chunkNumber = 0; chunkNumber < initResponse.total_chunks; chunkNumber++) {
        console.log(`Uploading chunk ${chunkNumber + 1}/${initResponse.total_chunks}`);

        let chunkRetries = 0;
        let chunkSuccess = false;

        while (!chunkSuccess && chunkRetries < maxRetries) {
          try {
            const chunkResponse = await uploadChunk(
              initResponse.upload_id,
              file,
              chunkNumber
            );

            console.log(`Chunk ${chunkNumber} uploaded:`, chunkResponse);

            setProgress(chunkResponse.progress_percentage);
            setUploadedChunks(chunkResponse.uploaded_chunks);
            
            onProgress?.(
              chunkResponse.progress_percentage, 
              chunkResponse.uploaded_chunks, 
              chunkResponse.total_chunks
            );
            onChunkComplete?.(chunkNumber);

            chunkSuccess = true;

          } catch (chunkError: any) {
            console.error(`Error uploading chunk ${chunkNumber}, attempt ${chunkRetries + 1}:`, chunkError);
            chunkRetries++;
            if (chunkRetries >= maxRetries) {
              throw new Error(`Failed to upload chunk ${chunkNumber} after ${maxRetries} attempts: ${chunkError.message}`);
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * chunkRetries));
          }
        }
      }

      console.log('All chunks uploaded, completing upload...');

      // Complete upload
      await completeUpload(initResponse.upload_id);

      console.log('Upload completed successfully');

      setIsUploading(false);
      setProgress(100);
      onComplete?.(initResponse.file_id);

    } catch (error: any) {
      const errorMsg = error.message || 'Upload failed';
      setIsUploading(false);
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [access, chunkSize, maxRetries, isPaused, onProgress, onChunkComplete, onError, onComplete]);

  // Pause upload
  const pauseUpload = useCallback(() => {
    setIsPaused(true);
    setIsUploading(false);
  }, []);

  // Resume upload
  const resumeUpload = useCallback(async () => {
    if (!uploadId || !currentFile) return;

    try {
      setIsPaused(false);
      setIsUploading(true);
      setError(null);

      // Get current status
      const status = await getUploadStatus(uploadId);
      
      setProgress(status.progress_percentage);
      setUploadedChunks(status.uploaded_chunks);

      // Continue upload from missing chunks
      if (status.missing_chunks.length > 0) {
        for (const chunkNumber of status.missing_chunks) {
          if (isPaused) return;
          
          await uploadChunk(uploadId, currentFile, chunkNumber);
        }
      }

      // Complete upload if all chunks are uploaded
      await completeUpload(uploadId);
      
      setIsUploading(false);
      setProgress(100);
      onComplete?.(0); // Note: We'd need the file_id from the initial response

    } catch (error: any) {
      const errorMsg = error.message || 'Failed to resume upload';
      setIsUploading(false);
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [uploadId, currentFile, isPaused, getUploadStatus, onComplete, onError]);

  // Cancel upload
  const cancelUpload = useCallback(() => {
    setIsUploading(false);
    setIsPaused(false);
    setProgress(0);
    setUploadedChunks(0);
    setTotalChunks(0);
    setError(null);
    setUploadId(null);
    setCurrentFile(null);
    setRetryCount(0);
  }, []);

  return {
    uploadFile,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    getUploadStatus,
    isUploading,
    isPaused,
    progress,
    uploadedChunks,
    totalChunks,
    error,
    uploadId
  };
};

export default useChunkedUpload;
