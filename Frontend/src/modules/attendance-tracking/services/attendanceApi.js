import { baseApi } from '@shared/api/baseApi';

export const attendanceApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getTodayAttendance: builder.query({
            query: () => '/api/attendance/today',
            providesTags: ['Attendance'],
        }),

        getAttendanceHistory: builder.query({
            query: ({ startDate, endDate, userId } = {}) => ({
                url: '/api/attendance/history',
                params: { startDate, endDate, userId },
            }),
            providesTags: ['Attendance'],
        }),

        getAttendanceStats: builder.query({
            query: ({ month, year } = {}) => ({
                url: '/api/attendance/stats',
                params: { month, year },
            }),
            providesTags: ['Attendance'],
        }),

        checkIn: builder.mutation({
            query: (data) => ({
                url: '/api/attendance/check-in',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Attendance'],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    attendanceApi.util.updateQueryData('getTodayAttendance', undefined, (draft) => {
                        if (draft && draft.data) {
                            draft.data.check_in_time = new Date().toISOString();
                        }
                    })
                );

                try {
                    await queryFulfilled;
                    window.dispatchEvent(new CustomEvent('zen:checkedIn'));
                } catch {
                    patchResult.undo();
                }
            },
        }),

        checkOut: builder.mutation({
            query: (data) => ({
                url: '/api/attendance/check-out',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Attendance'],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    attendanceApi.util.updateQueryData('getTodayAttendance', undefined, (draft) => {
                        if (draft && draft.data) {
                            draft.data.check_out_time = new Date().toISOString();
                        }
                    })
                );

                try {
                    await queryFulfilled;
                    window.dispatchEvent(new CustomEvent('zen:checkedOut'));
                } catch {
                    patchResult.undo();
                }
            },
        }),

    }),
    overrideExisting: false,
});

export const {
    useGetTodayAttendanceQuery,
    useGetAttendanceHistoryQuery,
    useGetAttendanceStatsQuery,
    useCheckInMutation,
    useCheckOutMutation,
} = attendanceApi;
