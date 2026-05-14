import { lazy } from 'react'

// Dashboard with dynamic reducer injection
const DashboardPage = lazy(() => import('@modules/dashboard'))

const LeadOverviewPage = lazy(() => import('@modules/lead-overview/pages/LeadOverviewPage'))
const LeadBulkUploadPage = lazy(() => import('@modules/lead-bulk-upload/pages/LeadBulkUploadPage'))
const CourseManagementPage = lazy(() => import('@modules/course-management/pages/CourseManagementPage'))
const MetaCampaignsPage = lazy(() => import('@modules/meta-campaigns/pages/MetaCampaignsPage'))
const ReviewsPage = lazy(() => import('@modules/reviews/pages/ReviewsPage'))
const MetaLeadsPage = lazy(() => import('@modules/meta-leads/pages/MetaLeadsPage'))
const BatchManagementPage = lazy(() => import('@modules/batch-management/pages/BatchManagementPage'))
const TrainerManagementPage = lazy(() => import('@modules/trainer-management/pages/TrainerManagementPage'))
const UsersManagementPage = lazy(() => import('@modules/users-management/pages/UsersManagementPage'))
const AttendanceTrackingPage = lazy(() => import('@modules/attendance-tracking/pages/AttendanceTrackingPage'))
const EmployeeTrackingPage = lazy(() => import('@modules/employee-tracking/pages/EmployeeTrackingPage'))
const ApplyLeaveForm = lazy(() => import('@modules/leave/ApplyLeaveForm'))
const PaymentInsightsPage = lazy(() => import('@modules/payment-insights/pages/PaymentInsightsPage'))
const PaymentsInvoicesPage = lazy(() => import('@modules/payments-invoices/pages/PaymentsInvoicesPage'))
const TrainerSharePage = lazy(() => import('@modules/trainer-share/pages/TrainerSharePage'))
const CertificationPortalPage = lazy(() => import('@modules/certification-portal/pages/CertificationPortalPage'))
const AnnouncementsPage = lazy(() => import('@modules/announcements/pages/AnnouncementsPage'))
const ReportsAnalyticsPage = lazy(() => import('@modules/reports-analytics/pages/ReportsAnalyticsPage'))
const ArchivedLeadsPage = lazy(() => import('@modules/archived-leads/pages/ArchivedLeadsPage'))
const HallOfFamePage = lazy(() => import('@modules/hall-of-fame/pages/HallOfFamePage'))
const SystemSettingsPage = lazy(() => import('@modules/system-settings/pages/SystemSettingsPage'))
const LoginPage = lazy(() => import('@modules/auth/components/LoginPage'))
const StudentEnrollmentPage = lazy(() => import('@modules/public-enrollment/StudentEnrollmentPage'))
const TrainerEnrollmentPage = lazy(() => import('@modules/public-enrollment/TrainerEnrollmentPage'))
const StudentEnrollmentsPage = lazy(() => import('@modules/student-enrollments/pages/StudentEnrollmentsPage'))
const TrainerEnrollmentsPage = lazy(() => import('@modules/trainer-enrollments/pages/TrainerEnrollmentsPage'))
const EnrollmentRecordsPage = lazy(() => import('@modules/enrollment-records/pages/EnrollmentRecordsPage'))
const ITUpdatesPage = lazy(() => import('@modules/it-updates/pages/ITUpdatesPage'))
const TermsAndConditions = lazy(() => import('@modules/public-enrollment/TermsAndConditions'))
const TrainerTermsAndConditions = lazy(() => import('@modules/public-enrollment/TrainerTermsAndConditions'))
const PrivacyPolicy = lazy(() => import('@modules/public-enrollment/PrivacyPolicy'))
const ProfileDetailsPage = lazy(() => import('@modules/profile/pages/ProfileDetailsPage'))
const ProfilePersonalDetailsPage = lazy(() => import('@modules/profile/pages/ProfilePersonalDetailsPage'))
const ProfileSocialAccountsPage = lazy(() => import('@modules/profile/pages/ProfileSocialAccountsPage'))
const ProfileContactDetailsPage = lazy(() => import('@modules/profile/pages/ProfileContactDetailsPage'))
const ProfileViewPage = lazy(() => import('@modules/profile/pages/ProfileViewPage'))
const ProfilePaymentDetailsPage = lazy(() => import('@modules/profile/pages/ProfilePaymentDetailsPage'))

const routes = [
  {
    path: '/login',
    component: LoginPage,
    isPublic: true,
  },
  {
    path: '/enroll/student',
    component: StudentEnrollmentPage,
    isPublic: true,
  },
  {
    path: '/enroll/trainer',
    component: TrainerEnrollmentPage,
    isPublic: true,
  },
  {
    path: '/terms-and-conditions',
    component: TermsAndConditions,
    isPublic: true,
  },
  {
    path: '/trainer-terms-and-conditions',
    component: TrainerTermsAndConditions,
    isPublic: true,
  },
  {
    path: '/privacy-policy',
    component: PrivacyPolicy,
    isPublic: true,
  },
  {
    path: '/dashboard',
    component: DashboardPage,
    allowedRoles: [1, 2, 3, 4, 5], // All authenticated users
  },
  {
    path: '/lead-overview',
    component: LeadOverviewPage,
    allowedRoles: [1, 3, 5],
  },
  {
    path: '/lead-bulk-upload',
    component: LeadBulkUploadPage,
    allowedRoles: [1, 3, 5],
  },
  {
    path: '/courses',
    component: CourseManagementPage,
    allowedRoles: [1, 2, 3],
  },
  {
    path: '/batches',
    component: BatchManagementPage,
    allowedRoles: [1, 2, 3],
  },
  {
    path: '/trainers',
    component: TrainerManagementPage,
    allowedRoles: [1, 3],
  },
  {
    path: '/users',
    component: UsersManagementPage,
    allowedRoles: [1],
  },
  {
    path: '/enrollment-records',
    component: EnrollmentRecordsPage,
    allowedRoles: [1, 3],
  },
  // Legacy individual routes kept for backward compatibility
  {
    path: '/student-enrollments',
    component: StudentEnrollmentsPage,
    allowedRoles: [1, 3],
  },
  {
    path: '/trainer-enrollments',
    component: TrainerEnrollmentsPage,
    allowedRoles: [1, 3],
  },
  {
    path: '/attendance',
    component: AttendanceTrackingPage,
    allowedRoles: [1, 2, 3, 5],
  },
  {
    path: '/employee-tracking',
    component: EmployeeTrackingPage,
    allowedRoles: [1],
  },
  {
    path: '/it-updates',
    component: ITUpdatesPage,
    allowedRoles: [1, 2, 3, 4, 5],
  },
  {
    path: '/leave/apply',
    component: ApplyLeaveForm,
    allowedRoles: [1, 2, 3, 5],
  },
  {
    path: '/payments',
    component: PaymentInsightsPage,
    allowedRoles: [1],
  },
  {
    path: '/invoices',
    component: PaymentsInvoicesPage,
    allowedRoles: [1, 3],
  },
  {
    path: '/share',
    component: TrainerSharePage,
    allowedRoles: [1],
  },
  {
    path: '/certifications',
    component: CertificationPortalPage,
    allowedRoles: [1, 2],
  },
  {
    path: '/announcements',
    component: AnnouncementsPage,
    allowedRoles: [1, 2, 3],
  },
  {
    path: '/meta-campaigns',
    component: MetaCampaignsPage,
    allowedRoles: [1, 3, 5],
  },
  {
    path: '/reviews',
    component: ReviewsPage,
    allowedRoles: [1, 3, 5],
  },
  {
    path: '/meta-leads',
    component: MetaLeadsPage,
    allowedRoles: [1, 3, 5],
  },
  {
    path: '/reports',
    component: ReportsAnalyticsPage,
    allowedRoles: [1, 3, 5],
  },
  {
    path: '/archived',
    component: ArchivedLeadsPage,
    allowedRoles: [1, 3, 5],
  },
  {
    path: '/hall-of-fame',
    component: HallOfFamePage,
    allowedRoles: [1, 2, 3],
  },
  {
    path: '/settings',
    component: SystemSettingsPage,
    allowedRoles: [1, 2],
  },
  {
    path: '/profile-details',
    component: ProfileDetailsPage,
    allowedRoles: [1, 2, 3, 4, 5],
  },
  {
    path: '/profile-details/personal',
    component: ProfilePersonalDetailsPage,
    allowedRoles: [1, 2, 3, 4, 5],
  },
  {
    path: '/profile-details/social',
    component: ProfileSocialAccountsPage,
    allowedRoles: [1, 2, 3, 4, 5],
  },
  {
    path: '/profile-details/contact',
    component: ProfileContactDetailsPage,
    allowedRoles: [1, 2, 3, 4, 5],
  },
  {
    path: '/profile-details/payment',
    component: ProfilePaymentDetailsPage,
    allowedRoles: [1, 2, 3, 4, 5],
  },
  {
    path: '/profile-view',
    component: ProfileViewPage,
    allowedRoles: [1, 2, 3, 4, 5],
  },
  {
    path: '/',
    component: DashboardPage,
    allowedRoles: [1, 2, 3, 4, 5],
  },
]

export default routes
