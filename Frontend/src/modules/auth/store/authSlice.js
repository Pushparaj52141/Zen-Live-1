import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@shared/api/client';
import { endpoints } from '@shared/api/endpoints';

// ==================== Async Thunks ====================

/**
 * Login thunk
 */
export const login = createAsyncThunk(
    'auth/login',
    async ({ username, password }, { rejectWithValue }) => {
        try {
            const response = await apiClient.post(endpoints.auth.login, {
                username,
                password,
            });

            const { user } = response.data;

            return { user };
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            return rejectWithValue(message);
        }
    }
);

/**
 * Logout thunk
 */
export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            // Call logout endpoint (handles server-side cleanup and clears cookies)
            await apiClient.post(endpoints.auth.logout);
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
        }
        return null;
    }
);

/**
 * Refresh token thunk
 */
export const refreshToken = createAsyncThunk(
    'auth/refreshToken',
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiClient.post(endpoints.auth.refresh, null, {
                skipAuthRefresh: true,
            });

            // Cookies are updated automatically by the browser
            return response.data;
        } catch (error) {
            return rejectWithValue('Token refresh failed');
        }
    }
);

/**
 * Check auth status on app load
 */
export const checkAuthStatus = createAsyncThunk(
    'auth/checkAuthStatus',
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiClient.get(endpoints.auth.me);
            const user = response.data?.user;
            if (!user) return rejectWithValue('Not authenticated');
            return { user };
        } catch (error) {
            return rejectWithValue('Not authenticated');
        }
    }
);

// ==================== Slice ====================

const authSlice = createSlice({
    name: 'auth',

    initialState: {
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
    },

    reducers: {
        updateUser: (state, action) => {
            state.user = { ...state.user, ...action.payload };
        },
        clearError: (state) => {
            state.error = null;
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
    },

    extraReducers: (builder) => {
        // ===== Login =====
        builder
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.error = null;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.error = action.payload;
            });

        // ===== Logout =====
        builder.addCase(logout.fulfilled, (state) => {
            state.isAuthenticated = false;
            state.user = null;
            state.error = null;
        });

        // ===== Refresh Token =====
        builder
            .addCase(refreshToken.fulfilled, (state, action) => {
                state.isAuthenticated = true;
                // Refresh endpoint returns role info; keep authz enforcement working even
                // when we don't have full user details yet.
                const role_ids = action.payload?.role_ids;
                const role_id = action.payload?.role_id ?? action.payload?.r_id;
                if (role_ids || role_id != null) {
                    state.user = {
                        ...(state.user || {}),
                        ...(Array.isArray(role_ids) ? { role_ids } : {}),
                        ...(role_id != null ? { role_id } : {}),
                    };
                }
            })
            .addCase(refreshToken.rejected, (state) => {
                state.isAuthenticated = false;
                state.user = null;
            });

        // ===== Check Auth Status =====
        builder
            .addCase(checkAuthStatus.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(checkAuthStatus.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
            })
            .addCase(checkAuthStatus.rejected, (state) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.user = null;
            });
    },
});

export const { updateUser, clearError, setLoading } = authSlice.actions;
export default authSlice.reducer;
