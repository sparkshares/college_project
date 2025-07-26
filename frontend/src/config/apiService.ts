/**
 * API Service Layer
 * This file provides a structured way to make API calls using the centralized endpoints
 * 
 * @author FileGen Team
 * @version 1.0.0
 * @since 2024
 */

import { 
  AUTH_ENDPOINTS, 
  FILE_ENDPOINTS, 
  DOCUMENT_ENDPOINTS, 
  STATS_ENDPOINTS, 
  CONTACT_ENDPOINTS,
  API_UTILS 
} from './endpoints';

// =======================================
// BASE API SERVICE CLASS
// =======================================

class BaseApiService {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit & { token?: string } = {}
  ): Promise<T> {
    const { token, ...fetchOptions } = options;
    
    const headers = {
      ...this.defaultHeaders,
      ...fetchOptions.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await API_UTILS.fetchWithTimeout(endpoint, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const errorMessage = await API_UTILS.handleApiError(response);
      throw new Error(errorMessage);
    }

    return response.json();
  }

  protected async requestWithoutJson(
    endpoint: string,
    options: RequestInit & { token?: string } = {}
  ): Promise<Response> {
    const { token, ...fetchOptions } = options;
    
    const headers = {
      ...fetchOptions.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await API_UTILS.fetchWithTimeout(endpoint, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const errorMessage = await API_UTILS.handleApiError(response);
      throw new Error(errorMessage);
    }

    return response;
  }
}

// =======================================
// AUTHENTICATION SERVICE
// =======================================

export class AuthService extends BaseApiService {
  async login(email: string, password: string) {
    return this.request(AUTH_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(email: string, password: string, username: string) {
    return this.request(AUTH_ENDPOINTS.SIGNUP, {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    });
  }

  async forgotPassword(email: string) {
    return this.request(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async getProfile(token: string) {
    return this.request(AUTH_ENDPOINTS.PROFILE, { token });
  }

  async updateProfile(token: string, profileData: any) {
    return this.request(AUTH_ENDPOINTS.PROFILE, {
      method: 'PUT',
      token,
      body: JSON.stringify(profileData),
    });
  }
}

// =======================================
// FILE SERVICE
// =======================================

export class FileService extends BaseApiService {
  async getMyFiles(token: string) {
    return this.request(FILE_ENDPOINTS.MY_FILES, { token });
  }

  async downloadFile(token: string, fileId: number): Promise<Blob> {
    const response = await this.requestWithoutJson(FILE_ENDPOINTS.DOWNLOAD_FILE(fileId), { token });
    return response.blob();
  }

  async deleteFile(token: string, fileId: number) {
    return this.request(FILE_ENDPOINTS.DELETE_FILE(fileId), {
      method: 'DELETE',
      token,
    });
  }

  async generateSummary(token: string, fileId: number, maxLength: number = 200) {
    return this.request(FILE_ENDPOINTS.GENERATE_SUMMARY, {
      method: 'POST',
      token,
      body: JSON.stringify({ file_id: fileId, max_length: maxLength }),
    });
  }

  async initializeChunkedUpload(token: string, uploadData: {
    file_title: string;
    file_name: string;
    file_size: number;
    total_chunks: number;
    chunk_size: number;
  }) {
    return this.request(FILE_ENDPOINTS.CHUNK_INIT, {
      method: 'POST',
      token,
      body: JSON.stringify(uploadData),
    });
  }

  async uploadChunk(token: string, uploadId: string, formData: FormData) {
    return this.request(FILE_ENDPOINTS.CHUNK_UPLOAD(uploadId), {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      token,
      body: formData,
    });
  }

  async getUploadStatus(token: string, uploadId: string) {
    return this.request(FILE_ENDPOINTS.CHUNK_STATUS(uploadId), { token });
  }

  async completeUpload(token: string, uploadId: string) {
    return this.request(FILE_ENDPOINTS.CHUNK_COMPLETE, {
      method: 'POST',
      token,
      body: JSON.stringify({ upload_id: uploadId }),
    });
  }
}

// =======================================
// DOCUMENT SERVICE
// =======================================

export class DocumentService extends BaseApiService {
  async getUserDocuments(token: string) {
    return this.request(DOCUMENT_ENDPOINTS.USER_DOCUMENTS, { token });
  }

  async createDocument(token: string, documentData: any) {
    return this.request(DOCUMENT_ENDPOINTS.CREATE_DOCUMENT, {
      method: 'POST',
      token,
      body: JSON.stringify(documentData),
    });
  }

  async getDocument(token: string, slug: string) {
    return this.request(DOCUMENT_ENDPOINTS.GET_DOCUMENT(slug), { token });
  }

  async updateDocument(token: string, slug: string, documentData: any) {
    return this.request(DOCUMENT_ENDPOINTS.UPDATE_DOCUMENT(slug), {
      method: 'PUT',
      token,
      body: JSON.stringify(documentData),
    });
  }

  async deleteDocument(token: string, slug: string) {
    return this.request(DOCUMENT_ENDPOINTS.DELETE_DOCUMENT(slug), {
      method: 'DELETE',
      token,
    });
  }
}

// =======================================
// STATISTICS SERVICE
// =======================================

export class StatsService extends BaseApiService {
  async getAccountStats(token: string) {
    return this.request(STATS_ENDPOINTS.ACCOUNT_STATS, { token });
  }

  async getDailyDownloads(token: string) {
    return this.request(STATS_ENDPOINTS.DAILY_DOWNLOADS, { token });
  }

  async getDailyUploads(token: string) {
    return this.request(STATS_ENDPOINTS.DAILY_UPLOADS, { token });
  }

  async getDeviceDownloadsPie(token: string) {
    return this.request(STATS_ENDPOINTS.DEVICE_DOWNLOADS_PIE, { token });
  }

  async getAllStatistics(token: string) {
    const [downloads, uploads, deviceStats] = await Promise.all([
      this.getDailyDownloads(token),
      this.getDailyUploads(token),
      this.getDeviceDownloadsPie(token),
    ]);

    return {
      downloads,
      uploads,
      deviceStats,
    };
  }
}

// =======================================
// CONTACT SERVICE
// =======================================

export class ContactService extends BaseApiService {
  async submitContactForm(contactData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    return this.request(CONTACT_ENDPOINTS.CONTACT_FORM, {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  }

  async submitFeedback(feedbackData: any) {
    return this.request(CONTACT_ENDPOINTS.FEEDBACK, {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
  }

  async getFAQ() {
    return this.request(CONTACT_ENDPOINTS.FAQ);
  }

  async getHelpArticles() {
    return this.request(CONTACT_ENDPOINTS.HELP_ARTICLES);
  }
}

// =======================================
// SERVICE INSTANCES
// =======================================

import { BASE_URLS } from './endpoints';

export const authService = new AuthService(BASE_URLS.MAIN_API);
export const fileService = new FileService(BASE_URLS.MAIN_API);
export const documentService = new DocumentService(BASE_URLS.DOC_API);
export const statsService = new StatsService(BASE_URLS.MAIN_API);
export const contactService = new ContactService(BASE_URLS.MAIN_API);

// =======================================
// COMBINED API SERVICE
// =======================================

/**
 * Combined API service that provides access to all services
 */
export const apiService = {
  auth: authService,
  file: fileService,
  document: documentService,
  stats: statsService,
  contact: contactService,
} as const;

export default apiService;
