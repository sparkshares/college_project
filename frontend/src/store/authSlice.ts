import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { AUTH_ENDPOINTS, FILE_ENDPOINTS, API_UTILS } from "@/config/endpoints";

interface Profile {
  bio: string;
  phone_number: string;
  full_name: string;
  date_of_birth: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  access: string | null;
  refresh: string | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  access: null,
  refresh: null,
  profile: null,
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await fetch(AUTH_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Login failed");
      }
      return await res.json();
    } catch (err: any) {
      return rejectWithValue(err.message || "Login error");
    }
  }
);

export const signup = createAsyncThunk(
  "auth/signup",
  async (
    { email, password, username }: { email: string; password: string; username: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(AUTH_ENDPOINTS.SIGNUP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Signup failed");
      }
      return await res.json();
    } catch (err: any) {
      return rejectWithValue(err.message || "Signup error");
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const res = await fetch(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to send reset email");
      }
      return await res.json();
    } catch (err: any) {
      return rejectWithValue(err.message || "Password reset error");
    }
  }
);

export const uploadFile = createAsyncThunk(
  "auth/uploadFile",
  async (
    { fileTitle, file }: { fileTitle: string; file: File },
    { getState, rejectWithValue }
  ) => {
    try {
      // @ts-ignore
      const access = (getState() as any).auth.access;
      if (!access) {
        throw new Error("Authentication required. Please login again.");
      }
      const formData = new FormData();
      formData.append("file_title", fileTitle);
      formData.append("file", file);
      const res = await fetch(FILE_ENDPOINTS.UPLOAD_FILE, {
        method: "POST",
        headers: { Authorization: `Bearer ${access}` },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.code === "token_not_valid" || data.detail?.includes("token")) {
          throw new Error("Session expired. Please login again.");
        }
        throw new Error(data.detail || "Upload failed");
      }
      return await res.json();
    } catch (err: any) {
      return rejectWithValue(err.message || "Upload error");
    }
  }
);

// Chunked upload async thunks
export const initializeChunkedUpload = createAsyncThunk(
  "auth/initializeChunkedUpload",
  async (
    { fileTitle, fileName, fileSize, totalChunks, chunkSize }: {
      fileTitle: string;
      fileName: string;
      fileSize: number;
      totalChunks: number;
      chunkSize: number;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      // @ts-ignore
      const access = (getState() as any).auth.access;
      if (!access) {
        throw new Error("Authentication required. Please login again.");
      }

      const res = await fetch(FILE_ENDPOINTS.CHUNK_INIT, {
        method: "POST",
        headers: API_UTILS.createJsonHeaders(access),
        body: JSON.stringify({
          file_title: fileTitle,
          file_name: fileName,
          file_size: fileSize,
          total_chunks: totalChunks,
          chunk_size: chunkSize
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to initialize chunked upload");
      }

      return await res.json();
    } catch (err: any) {
      return rejectWithValue(err.message || "Chunked upload initialization error");
    }
  }
);

export const uploadChunk = createAsyncThunk(
  "auth/uploadChunk",
  async (
    { uploadId, chunkNumber, chunkHash, chunk }: {
      uploadId: string;
      chunkNumber: number;
      chunkHash: string;
      chunk: Blob;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      // @ts-ignore
      const access = (getState() as any).auth.access;
      if (!access) {
        throw new Error("Authentication required. Please login again.");
      }

      const formData = new FormData();
      formData.append("chunk_number", chunkNumber.toString());
      formData.append("chunk_hash", chunkHash);
      formData.append("chunk", chunk);

      const res = await fetch(FILE_ENDPOINTS.CHUNK_UPLOAD(uploadId), {
        method: "POST",
        headers: API_UTILS.createFormDataHeaders(access),
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Failed to upload chunk ${chunkNumber}`);
      }

      return await res.json();
    } catch (err: any) {
      return rejectWithValue(err.message || "Chunk upload error");
    }
  }
);

export const completeChunkedUpload = createAsyncThunk(
  "auth/completeChunkedUpload",
  async (
    { uploadId }: { uploadId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      // @ts-ignore
      const access = (getState() as any).auth.access;
      if (!access) {
        throw new Error("Authentication required. Please login again.");
      }

      const res = await fetch(FILE_ENDPOINTS.CHUNK_COMPLETE, {
        method: "POST",
        headers: API_UTILS.createJsonHeaders(access),
        body: JSON.stringify({
          upload_id: uploadId
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to complete chunked upload");
      }

      return await res.json();
    } catch (err: any) {
      return rejectWithValue(err.message || "Complete upload error");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.access = null;
      state.refresh = null;
      state.profile = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.access = action.payload.access;
        state.refresh = action.payload.refresh;
        state.profile = action.payload.profile;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Chunked upload cases
      .addCase(initializeChunkedUpload.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeChunkedUpload.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(initializeChunkedUpload.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(uploadChunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadChunk.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(uploadChunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(completeChunkedUpload.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeChunkedUpload.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(completeChunkedUpload.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
