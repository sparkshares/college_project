/**
 * Centralized API Endpoints Configuration
 * This file contains all API endpoints used throughout the application
 * 
 * @author FileGen Team
 * @version 1.0.0
 * @since 2024
 */

// =======================================
// BASE CONFIGURATION
// =======================================

/**
 * Environment configuration
 * Switch between development and production environments
 */
const ENV = process.env.NODE_ENV || 'development';

/**
 * Base URLs for different services
 * Update these URLs based on your deployment environment
 */
export const BASE_URLS = {
  // Main backend service (FastAPI - port 8000)
  MAIN_API: ENV === 'production' 
    ? 'https://your-production-api.com' 
    : 'http://127.0.0.1:8000',
  // Document service (Node.js - port 3001)
  DOC_API: ENV === 'production' 
    ? 'https://your-production-doc-api.com' 
    : 'http://127.0.0.1:3001',
} as const;

// =======================================
// AUTHENTICATION ENDPOINTS
// =======================================

/**
 * Authentication related API endpoints
 * Handles user login, signup, password reset, and profile management
 */
export const AUTH_ENDPOINTS = {
  LOGIN: `${BASE_URLS.MAIN_API}/api/login`,
  SIGNUP: `${BASE_URLS.MAIN_API}/api/signup`,
  FORGOT_PASSWORD: `${BASE_URLS.MAIN_API}/api/forgot-password`,
  RESET_PASSWORD: `${BASE_URLS.MAIN_API}/api/reset-password`,
  PROFILE: `${BASE_URLS.MAIN_API}/api/profile`,
  CHANGE_PASSWORD: `${BASE_URLS.MAIN_API}/api/change-password`,
  LOGOUT: `${BASE_URLS.MAIN_API}/api/logout`,
  REFRESH_TOKEN: `${BASE_URLS.MAIN_API}/api/token/refresh`,
} as const;

// =======================================
// FILE MANAGEMENT ENDPOINTS
// =======================================

/**
 * File management API endpoints
 * Handles file uploads, downloads, and file operations
 */
export const FILE_ENDPOINTS = {
  // Regular file upload
  UPLOAD_FILE: `${BASE_URLS.MAIN_API}/api/upload-file`,
  
  // Chunked upload endpoints for large files
  CHUNK_INIT: `${BASE_URLS.MAIN_API}/api/upload-chunk/init`,
  CHUNK_UPLOAD: (uploadId: string) => `${BASE_URLS.MAIN_API}/api/upload-chunk/${uploadId}`,
  CHUNK_STATUS: (uploadId: string) => `${BASE_URLS.MAIN_API}/api/upload-chunk/status/${uploadId}`,
  CHUNK_COMPLETE: `${BASE_URLS.MAIN_API}/api/upload-chunk/complete`,
  CHUNK_CANCEL: (uploadId: string) => `${BASE_URLS.MAIN_API}/api/upload-chunk/cancel/${uploadId}`,
  
  // File operations
  MY_FILES: `${BASE_URLS.MAIN_API}/api/my-files`,
  FILE_DETAILS: (fileId: number) => `${BASE_URLS.MAIN_API}/api/file/${fileId}`,
  DOWNLOAD_FILE: (fileId: number) => `${BASE_URLS.MAIN_API}/api/download-file/${fileId}`,
  DELETE_FILE: (fileId: number) => `${BASE_URLS.MAIN_API}/api/file/${fileId}`,
  UPDATE_FILE: (fileId: number) => `${BASE_URLS.MAIN_API}/api/file/${fileId}`,
  
  // File analysis and processing
  GENERATE_SUMMARY: `${BASE_URLS.MAIN_API}/api/generate-summary`,
  ANALYZE_FILE: (fileId: number) => `${BASE_URLS.MAIN_API}/api/analyze-file/${fileId}`,
  FILE_PREVIEW: (fileId: number) => `${BASE_URLS.MAIN_API}/api/file-preview/${fileId}`,
} as const;

// =======================================
// DOCUMENT MANAGEMENT ENDPOINTS
// =======================================

/**
 * Document management API endpoints (Node.js service)
 * Handles document creation, editing, and management
 */
export const DOCUMENT_ENDPOINTS = {
  USER_DOCUMENTS: `${BASE_URLS.DOC_API}/api/user-doc/`,
  CREATE_DOCUMENT: `${BASE_URLS.DOC_API}/api/create-doc`,
  GET_DOCUMENT: (slug: string) => `${BASE_URLS.DOC_API}/api/doc/${slug}`,
  UPDATE_DOCUMENT: (slug: string) => `${BASE_URLS.DOC_API}/api/doc/${slug}`,
  DELETE_DOCUMENT: (slug: string) => `${BASE_URLS.DOC_API}/api/doc/${slug}`,
  DOCUMENT_ANALYTICS: (slug: string) => `${BASE_URLS.DOC_API}/api/doc/${slug}/analytics`,
  PUBLISH_DOCUMENT: (slug: string) => `${BASE_URLS.DOC_API}/api/doc/${slug}/publish`,
  UNPUBLISH_DOCUMENT: (slug: string) => `${BASE_URLS.DOC_API}/api/doc/${slug}/unpublish`,
} as const;

// =======================================
// STATISTICS & ANALYTICS ENDPOINTS
// =======================================

/**
 * Statistics and analytics API endpoints
 * Provides insights and data visualization
 */
export const STATS_ENDPOINTS = {
  ACCOUNT_STATS: `${BASE_URLS.MAIN_API}/api/account-stats`,
  DAILY_DOWNLOADS: `${BASE_URLS.MAIN_API}/api/statistics/daily-downloads`,
  DAILY_UPLOADS: `${BASE_URLS.MAIN_API}/api/statistics/daily-uploads`,
  DEVICE_DOWNLOADS_PIE: `${BASE_URLS.MAIN_API}/api/statistics/device-downloads-pie`,
  MONTHLY_ACTIVITY: `${BASE_URLS.MAIN_API}/api/statistics/monthly-activity`,
  STORAGE_USAGE: `${BASE_URLS.MAIN_API}/api/statistics/storage-usage`,
  TOP_FILES: `${BASE_URLS.MAIN_API}/api/statistics/top-files`,
  USER_ACTIVITY: `${BASE_URLS.MAIN_API}/api/statistics/user-activity`,
} as const;

// =======================================
// CONTACT & SUPPORT ENDPOINTS
// =======================================

/**
 * Contact and support related endpoints
 * Handles contact forms, support tickets, and feedback
 */
export const CONTACT_ENDPOINTS = {
  CONTACT_FORM: `${BASE_URLS.MAIN_API}/api/contact`,
  SUPPORT_TICKET: `${BASE_URLS.MAIN_API}/api/support/ticket`,
  FEEDBACK: `${BASE_URLS.MAIN_API}/api/feedback`,
  FAQ: `${BASE_URLS.MAIN_API}/api/faq`,
  HELP_ARTICLES: `${BASE_URLS.MAIN_API}/api/help`,
} as const;

// =======================================
// API UTILITY FUNCTIONS
// =======================================

/**
 * Utility functions for common request patterns
 * These functions help standardize API requests across the application
 */
export const API_UTILS = {
  /**
   * Create headers with authentication
   * @param token - The access token
   * @param contentType - Optional content type
   * @returns Headers object
   */
  createAuthHeaders: (token: string | null, contentType?: string) => {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    return headers;
  },

  /**
   * Create standard JSON headers with auth
   * @param token - The access token
   * @returns Headers object with JSON content type
   */
  createJsonHeaders: (token: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  /**
   * Create FormData headers with auth (for file uploads)
   * @param token - The access token
   * @returns Headers object without content type (browser sets it)
   */
  createFormDataHeaders: (token: string | null) => {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData - let browser set it
    return headers;
  },

  /**
   * Build query string from object
   * @param params - Object with key-value pairs
   * @returns Query string
   */
  buildQueryString: (params: Record<string, string | number | boolean>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    return searchParams.toString();
  },

  /**
   * Handle API errors consistently
   * @param response - Fetch response object
   * @returns Error message
   */
  handleApiError: async (response: Response): Promise<string> => {
    try {
      const errorData = await response.json();
      return errorData.detail || errorData.message || 'An error occurred';
    } catch {
      return `HTTP Error: ${response.status} ${response.statusText}`;
    }
  },

  /**
   * Create a fetch request with timeout
   * @param url - Request URL
   * @param options - Fetch options
   * @param timeout - Timeout in milliseconds (default: 30000)
   * @returns Promise with fetch response
   */
  fetchWithTimeout: async (
    url: string, 
    options: RequestInit = {}, 
    timeout: number = 30000
  ): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  },
} as const;

// =======================================
// EXPORT CONFIGURATION
// =======================================

/**
 * Export all endpoints as a single object for easy access
 * This provides a centralized way to access all API endpoints
 */
export const API_ENDPOINTS = {
  ...AUTH_ENDPOINTS,
  ...FILE_ENDPOINTS,
  ...DOCUMENT_ENDPOINTS,
  ...STATS_ENDPOINTS,
  ...CONTACT_ENDPOINTS,
} as const;

/**
 * Type definitions for better TypeScript support
 */
export type AuthEndpoints = typeof AUTH_ENDPOINTS;
export type FileEndpoints = typeof FILE_ENDPOINTS;
export type DocumentEndpoints = typeof DOCUMENT_ENDPOINTS;
export type StatsEndpoints = typeof STATS_ENDPOINTS;
export type ContactEndpoints = typeof CONTACT_ENDPOINTS;
export type AllEndpoints = typeof API_ENDPOINTS;

/**
 * Default export for convenience
 */
export default {
  BASE_URLS,
  AUTH_ENDPOINTS,
  FILE_ENDPOINTS,
  DOCUMENT_ENDPOINTS,
  STATS_ENDPOINTS,
  CONTACT_ENDPOINTS,
  API_UTILS,
  API_ENDPOINTS,
} as const;
