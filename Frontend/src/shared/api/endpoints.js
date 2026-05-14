export const endpoints = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh-token',
    me: '/auth/me',
  },
  courses: {
    root: '/courses',
    filter: '/courses/filter/courses',
    subCourses: '/api/sub-courses',
  },
  leads: {
    root: '/leads',
    status: (id) => `/leads/status/${id}`,
    deleteLead: (id) => `/leads/delete/${id}`,

    archived: '/leads/archived',
    restore: (id) => `/leads/restore/${id}`,
    comments: (id) => `/leads/${id}/comments`,
    batches: '/leads/batches',
    batchTrainers: (batchId) => `/leads/batch/${batchId}/trainers`,
    units: '/leads/units',
    cardTypes: '/leads/card-types',
    sources: '/leads/sources',
    roles: '/leads/roles',
    bulkUpload: '/bulk-upload-service',
    sampleCsv: '/bulk-upload-service/sample-csv',
    generateCertificate: (id) => `/leads/${id}/generate-certificate`,
    downloadCertificate: (id) => `/leads/${id}/download-certificate`,
  },
  comments: {
    root: (id) => `/comments/${id}`,
  },
  trainers: {
    root: '/api/trainers',
    api: '/api/trainers',
    payouts: '/api/trainers/trainer-payouts',
    payoutStatus: (payoutId) => `/api/trainers/trainer-payouts/${payoutId}/status`,
    sendPayoutEmails: '/api/trainers/send-email-payouts',
  },
  users: {
    root: '/api/users',
    roles: '/api/user_roles',
  },
  metaCampaigns: {
    root: '/meta-campaigns',
    apiRoot: '/api/meta-campaigns',
    detail: (id) => `/api/meta-campaigns/${id}`,
  },
  reviews: {
    apiRoot: '/api/reviews',
    detail: (id) => `/api/reviews/${id}`,
  },
  metaLeads: {
    apiRoot: '/api/meta-leads',
    detail: (id) => `/api/meta-leads/${id}`,
    convert: (id) => `/api/meta-leads/convert/${id}`,
  },
  payments: {
    root: '/payments',
    feeInfo: '/payments/fee-info',
  },
  invoices: {
    root: '/invoices',
  },
  batches: {
    root: '/batches',
    search: '/batches/search',
  },
  attendance: {
    today: '/api/attendance/today',
    checkIn: '/api/attendance/check-in',
    checkOut: '/api/attendance/check-out',
    history: '/api/attendance/history',
    stats: '/api/attendance/stats',
  },
  exportLeads: '/exportLeads',
  leadsSample: '/leads/sample-csv',
}

