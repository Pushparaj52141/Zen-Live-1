import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Determine base URL from environment or fallback to relative path
const getBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
        
    }
    // Fallback to relative URL (proxied by Vite in dev)
    return '/api';
};

/**
 * Base query with credentials enabled for cookie-based auth
 */
const baseQueryWithAuth = fetchBaseQuery({
    baseUrl: getBaseUrl(),
    prepareHeaders: (headers) => {
        // No need to manually inject token from localStorage
        // Browsers handle cookies automatically
        return headers;
    },
    // CRITICAL: This allows cookies to be sent with RTK Query requests
    credentials: 'include',
});

/**
 * Base query with automatic token refresh on 401
 */
const baseQueryWithReauth = async (args, api, extraOptions) => {
    let result = await baseQueryWithAuth(args, api, extraOptions);

    // If we get 401, try to refresh token
    if (result.error?.status === 401) {
        // Skip refresh for certain endpoints
        const skipRefresh =
            typeof args === 'string' && args.includes('/auth/refresh') ||
            typeof args === 'object' && args.url?.includes('/auth/refresh');

        if (!skipRefresh) {
            // Try to refresh token - cookies will be handled automatically
            const refreshResult = await baseQueryWithAuth(
                { url: '/auth/refresh-token', method: 'POST' },
                api,
                extraOptions
            );

            if (refreshResult.data?.success) {
                // Retry original request - cookies are already updated by the browser
                result = await baseQueryWithAuth(args, api, extraOptions);
            } else {
                // Refresh failed, logout user
                window.location.href = '/login';
            }
        }
    }

    return result;
};

/**
 * Base API slice
 */
export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,

    tagTypes: [
        'Leads',
        'Courses',
        'Batches',
        'Trainers',
        'Users',
        'Attendance',
        'Reviews',
        'MetaLeads',
        'Announcements',
        'ITUpdates',
        'Payments',
        'Certifications',
    ],

    refetchOnMountOrArgChange: 30,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    endpoints: () => ({}),
});

export default baseApi;
