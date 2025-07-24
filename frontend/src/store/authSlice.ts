import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

interface AuthState {
  access: string | null;
  refresh: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  access: null,
  refresh: null,
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/login", {
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
      const res = await fetch("http://127.0.0.1:8000/api/signup", {
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
      const res = await fetch("http://127.0.0.1:8000/api/upload-file", {
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

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.access = null;
      state.refresh = null;
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
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
