# API Configuration Documentation

This document explains how to use the centralized API configuration in your FileGen project.

## Overview

The API configuration is structured into several layers:

1. **Endpoints Configuration** (`/src/config/endpoints.ts`) - Centralized endpoint definitions
2. **API Service Layer** (`/src/config/apiService.ts`) - Structured service classes for API calls
3. **Utility Functions** - Helper functions for common request patterns

## Basic Usage

### Using Endpoints Directly

```typescript
import { FILE_ENDPOINTS, API_UTILS } from '@/config/endpoints';

// Example: Fetch user files
const response = await fetch(FILE_ENDPOINTS.MY_FILES, {
  headers: API_UTILS.createFormDataHeaders(access_token),
});
```

### Using API Services (Recommended)

```typescript
import { fileService } from '@/config/apiService';

// Example: Fetch user files
const files = await fileService.getMyFiles(access_token);

// Example: Download a file
const blob = await fileService.downloadFile(access_token, fileId);
```

## Available Services

### AuthService
- `login(email, password)`
- `signup(email, password, username)`
- `forgotPassword(email)`
- `getProfile(token)`
- `updateProfile(token, profileData)`

### FileService
- `getMyFiles(token)`
- `downloadFile(token, fileId)`
- `deleteFile(token, fileId)`
- `generateSummary(token, fileId, maxLength)`
- `initializeChunkedUpload(token, uploadData)`
- `uploadChunk(token, uploadId, formData)`
- `getUploadStatus(token, uploadId)`
- `completeUpload(token, uploadId)`

### DocumentService
- `getUserDocuments(token)`
- `createDocument(token, documentData)`
- `getDocument(token, slug)`
- `updateDocument(token, slug, documentData)`
- `deleteDocument(token, slug)`

### StatsService
- `getAccountStats(token)`
- `getDailyDownloads(token)`
- `getDailyUploads(token)`
- `getDeviceDownloadsPie(token)`
- `getAllStatistics(token)` - Fetches all stats in parallel

### ContactService
- `submitContactForm(contactData)`
- `submitFeedback(feedbackData)`
- `getFAQ()`
- `getHelpArticles()`

## Utility Functions

The `API_UTILS` object provides several helper functions:

```typescript
import { API_UTILS } from '@/config/endpoints';

// Create headers for different request types
const jsonHeaders = API_UTILS.createJsonHeaders(token);
const formDataHeaders = API_UTILS.createFormDataHeaders(token);

// Build query strings
const queryString = API_UTILS.buildQueryString({ page: 1, limit: 10 });

// Handle API errors consistently
const errorMessage = await API_UTILS.handleApiError(response);

// Make requests with timeout
const response = await API_UTILS.fetchWithTimeout(url, options, 30000);
```

## Environment Configuration

The endpoints automatically switch between development and production:

```typescript
// Development
BASE_URLS.MAIN_API = 'http://127.0.0.1:8000'
BASE_URLS.DOC_API = 'http://127.0.0.1:3001'

// Production (update these in endpoints.ts)
BASE_URLS.MAIN_API = 'https://your-production-api.com'
BASE_URLS.DOC_API = 'https://your-production-doc-api.com'
```

## Migration Guide

If you're migrating from hardcoded URLs to this centralized configuration:

### Before
```typescript
const response = await fetch("http://127.0.0.1:8000/api/my-files", {
  headers: { Authorization: `Bearer ${access}` },
});
```

### After (Option 1: Direct endpoints)
```typescript
import { FILE_ENDPOINTS, API_UTILS } from '@/config/endpoints';

const response = await fetch(FILE_ENDPOINTS.MY_FILES, {
  headers: API_UTILS.createFormDataHeaders(access),
});
```

### After (Option 2: Service layer)
```typescript
import { fileService } from '@/config/apiService';

const files = await fileService.getMyFiles(access);
```

## Error Handling

All services include built-in error handling:

```typescript
try {
  const files = await fileService.getMyFiles(token);
  // Handle success
} catch (error) {
  // Error message is already processed
  console.error(error.message);
}
```

## Type Safety

The configuration includes TypeScript types for better development experience:

```typescript
import type { FileEndpoints, AuthEndpoints } from '@/config/endpoints';

// Type-safe access to endpoints
const endpoint: FileEndpoints['MY_FILES'] = FILE_ENDPOINTS.MY_FILES;
```

## Best Practices

1. **Use the service layer** for complex operations
2. **Use direct endpoints** for simple fetch operations
3. **Always use API_UTILS** for consistent header creation
4. **Handle errors appropriately** in your components
5. **Update BASE_URLS** for production deployment
6. **Use TypeScript types** for better code quality

## Examples in Your Codebase

Your existing files have been updated to use this configuration:

- `/src/app/dashboard/files/page.tsx` - Uses FILE_ENDPOINTS
- `/src/app/dashboard/contents/page.tsx` - Uses DOCUMENT_ENDPOINTS
- `/src/app/dashboard/settings/page.tsx` - Uses AUTH_ENDPOINTS
- `/src/components/ChunkedFileUpload.tsx` - Uses FILE_ENDPOINTS
- `/src/store/authSlice.ts` - Uses AUTH_ENDPOINTS

This centralized approach makes your codebase more maintainable, type-safe, and easier to update for different environments.
