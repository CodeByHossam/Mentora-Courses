/**
 * Mentora Main Application Component
 *
 * This is the root component that sets up the entire application routing,
 * layout structure, and global features like error boundaries and loading states.
 *
 * Key Features:
 * - Role-based routing (Admin, Instructor, Student, Public)
 * - Lazy loading for performance optimization
 * - Protected routes with authentication
 * - Persistent login state management
 * - Global error boundary for error handling
 * - Toast notifications for user feedback
 *
 * Route Structure:
 * - Public routes: Home, Login, Register, Course browsing
 * - Protected routes: Profile, Dashboards, Course management
 * - Admin routes: User management, System administration
 * - Instructor routes: Course creation, Student management
 * - Student routes: Enrolled courses, Certificates
 *
 * @author Mentora Team
 * @version 1.0.0
 */

import React, { Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/responsive-fixes.css";

// Import core layout components
import Layout from "./components/Layout"; // Main app layout wrapper
import AdminLayout from "./components/AdminLayout"; // Admin dashboard layout
import InstructorLayout from "./components/InstructorLayout"; // Instructor dashboard layout
import StudentLayout from "./components/StudentLayout"; // Student dashboard layout

// Import authentication and protection components
import ProtectedRoute from "./components/ProtectedRoute"; // Route protection based on roles
import PersistLogin from "./components/PersistLogin"; // Maintains login state across sessions
import ProgressLoader from "./components/ProgressLoader"; // Loading spinner component
import ErrorBoundary from "./components/ErrorBoundary"; // Error handling wrapper
import ScrollToTop from "./components/ScrollToTop"; // Scroll to top on route change

// Import directly loaded pages (critical for initial load)
import Login from "./pages/Login"; // User login page
import Register from "./pages/Register"; // User registration page
import Help from "./pages/Help"; // Help page
import TermsAndConditions from "./pages/TermsAndConditions"; // Terms and Conditions page
import BillingRouter from "./pages/Billing/BillingRouter.jsx"; // Role-based billing router
import CourseDetails from "./pages/CourseDetails/CourseDetails.jsx"; // Course detail view
import NotFound from "./pages/NotFound"; // 404 error page
import MyCourses from "./pages/MyCourses"; // User's enrolled courses
import StudentCertificates from "./components/StudentCertificates.jsx"; // User certificates
import AdminManageCourses from "./pages/AdminManageCourses"; // Admin course management
import CourseStudents from "./pages/CourseStudents"; // Course enrolled students view
import AdminManageUsers from "./pages/AdminManageUsers"; // Admin user management
import AdminEnrollmentRequests from "./pages/AdminEnrollmentRequests"; // Admin enrollment requests
import CourseLesson from "./pages/CourseLesson/CourseLesson"; // Individual lesson viewer
import CourseEnrollment from "./pages/CourseEnrollment"; // Course enrollment page
import PaymentPage from "./pages/PaymentPage/PaymentPage"; // Payment processing page
import PaymentSuccess from "./pages/PaymentPage/PaymentSuccess";
import PaymentCancel from "./pages/PaymentPage/PaymentCancel";
import AddLesson from "./pages/AddLesson.jsx"; // Add new lesson form
import EditLesson from "./pages/EditLesson.jsx"; // Edit lesson form
import AddUserForm from "./pages/AddUserForm"; // Admin add user form
import EditUser from "./pages/EditUser"; // Admin edit user form
import AdminReports from "./pages/AdminReports"; // Admin reports dashboard
import AdminSettings from "./pages/AdminSettings"; // Admin system settings
import AdminBulkDelete from "./pages/AdminBulkDelete"; // Admin bulk deletion page
import AdminPaymentSettings from "./pages/AdminPaymentSettings"; // Admin payment settings
import AdminPayments from "./pages/AdminPayments"; // Admin payments & accounting
import AdminInstructorPayouts from "./pages/AdminInstructorPayouts"; // Admin instructor payouts (new simplified system)
import AdminLiveSessions from "./pages/AdminLiveSessions"; // Admin live sessions management
import AdminMessages from "./pages/AdminMessages"; // Admin messages & communication
import AdminNotifications from "./pages/AdminNotifications"; // Admin notifications management
import AdminSystemLogs from "./pages/AdminSystemLogs"; // Admin system logs viewer
import SystemConfiguration from "./pages/SystemConfiguration"; // System configuration
import SystemHealth from "./pages/SystemHealth"; // System health monitoring
import InstructorReports from "./pages/InstructorReports.jsx"; // Instructor analytics
import InstructorRequestForm from "./pages/InstructorRequestForm.jsx"; // Instructor application form
import InstructorRequests from "./pages/InstructorRequests.jsx"; // Admin instructor requests
import InstructorList from "./pages/InstructorList.jsx"; // Public instructor directory
import InstructorPage from "./pages/InstructorPage.jsx"; // Individual instructor profile
import InstructorPayments from "./pages/InstructorPayments.jsx"; // Instructor payments
// InstructorPayoutRequests removed - using direct payout system now (admin pays directly)
// InstructorAdminFeePayment removed - old admin fee payment system replaced
import InstructorRefunds from "./pages/InstructorRefunds.jsx"; // Instructor refund requests
import InstructorMessages from "./pages/InstructorMessages.jsx"; // Instructor messages
import InstructorGiftCards from "./pages/InstructorGiftCards.jsx"; // Instructor gift cards
import InstructorGrading from "./pages/InstructorGrading.jsx"; // Instructor grading system
import TestGrading from "./pages/TestGrading.jsx"; // Test-specific grading page
import StudentGiftCards from "./pages/StudentGiftCards.jsx"; // Student gift cards
import StudentRefunds from "./pages/StudentRefunds.jsx"; // Student refund requests
import AdminGiftCards from "./pages/AdminGiftCards.jsx"; // Admin gift cards management
import AdminRefundManagement from "./pages/AdminRefundManagement.jsx"; // Admin refund management
import ForgotPassword from "./pages/ForgotPassword"; // Password reset page
import Levels from "./pages/Levels"; // Levels management page

/* ========================================================================
   LAZY LOADED COMPONENTS - Loaded on demand for better performance
   ======================================================================== */

// Main application pages
const HomePage = lazy(() => import("./pages/HomePage")); // Landing page
const AdminDashboard = lazy(() => import("./pages/AdminDashboard")); // Admin main dashboard
const InstructorDashboard = lazy(() => import("./pages/InstructorDashboard")); // Instructor dashboard
const StudentDashboard = lazy(() => import("./pages/StudentDashboard")); // Student dashboard
const CourseList = lazy(() => import("./pages/CourseList")); // Course catalog
const About = lazy(() => import("./pages/About")); // About page
const Contact = lazy(() => import("./pages/Contact")); // Contact page

// Admin-specific pages
const AdminManageCategories = lazy(
  () => import("./pages/AdminManageCategories") // Admin category management
);
const AdminGiftCardManager = lazy(
  () => import("./components/AdminGiftCardManager") // Admin gift card management
);
// AdminPendingFeePayments removed - old admin fee payment system replaced

// User and course management pages
const Profile = lazy(() => import("./pages/Profile")); // User profile page
const InstructorCourses = lazy(() => import("./pages/InstructorCourses")); // Instructor course list
const CreateCourse = lazy(() => import("./pages/CreateCourse")); // Course creation form
const EditCourse = lazy(() => import("./pages/EditCourse")); // Course editing form
const InstructorStudents = lazy(() => import("./pages/InstructorStudents")); // Instructor student management
const InstructorLiveSessions = lazy(() =>
  import("./pages/InstructorLiveSessions")
); // Instructor live sessions
const InstructorNotifications = lazy(() =>
  import("./pages/InstructorNotifications")
); // Instructor notifications
const StudentLiveSessions = lazy(() => import("./pages/StudentLiveSessions")); // Student live sessions
const StudentAssignments = lazy(() => import("./pages/StudentAssignments")); // Student assignments
const StudentGrades = lazy(() => import("./pages/StudentGrades")); // Student grades
const StudentSchedule = lazy(() => import("./pages/StudentSchedule")); // Student schedule
const StudentMessages = lazy(() => import("./pages/StudentMessages")); // Student messages
const StudentNotifications = lazy(() => import("./pages/StudentNotifications")); // Student notifications
const StudentPayments = lazy(() => import("./pages/StudentPayments")); // Student payments

/**
 * Loading Component for Suspense Fallback
 *
 * Displays a centered loading spinner while lazy-loaded components
 * are being fetched and rendered.
 *
 * @returns {JSX.Element} Loading spinner with message
 */
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <ProgressLoader isVisible={true} message="Loading..." />
  </div>
);

/**
 * Main App Component Function
 *
 * Sets up the complete application routing structure with role-based access control,
 * error boundaries, and loading states. The routing is organized hierarchically
 * with public routes at the top level and protected routes nested within.
 *
 * @returns {JSX.Element} Complete application with routing and global components
 */
function App() {
  useEffect(() => {
    console.log("Vite MODE:", import.meta.env.MODE);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Router wrapper for all application routing */}
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {/* Scroll to top on route change */}
        <ScrollToTop />
        {/* Global error boundary to catch and handle React errors */}
        <ErrorBoundary>
          <main>
            {/* Suspense wrapper for lazy-loaded components */}
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Main layout wrapper for all routes */}
                <Route element={<Layout />}>
                  {/* ========================================
                      PUBLIC ROUTES - No authentication required
                      ======================================== */}

                  {/* Authentication pages */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route
                    path="/instructor-register"
                    element={<InstructorRequestForm />}
                  />

                  {/* Public content pages */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/courses" element={<CourseList />} />
                  <Route path="about" element={<About />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="help" element={<Help />} />
                  <Route
                    path="/terms-and-conditions"
                    element={<TermsAndConditions />}
                  />
                  <Route path="/instructor/:id" element={<InstructorPage />} />

                  {/* ========================================
                      SEMI-PROTECTED ROUTES - Enhanced with login state
                      ======================================== */}

                  {/* Routes that benefit from login state but don't require it */}
                  <Route element={<PersistLogin />}>
                    <Route
                      path="/courses/:courseId"
                      element={<CourseDetails />}
                    />
                    <Route
                      path="/courses/:courseId/learn"
                      element={<CourseLesson />}
                    />
                    <Route
                      path="/courses/:courseId/add-lesson"
                      element={<AddLesson />}
                    />
                    <Route
                      path="/lessons/:lessonId/edit"
                      element={<EditLesson />}
                    />
                    <Route
                      path="/courses/:courseId/enroll"
                      element={<CourseEnrollment />}
                    />
                    <Route
                      path="/payment/:courseId"
                      element={<PaymentPage />}
                    />
                    <Route
                      path="/payment/success"
                      element={<PaymentSuccess />}
                    />
                    <Route path="/payment/cancel" element={<PaymentCancel />} />
                    <Route
                      path="certificates"
                      element={<StudentCertificates />}
                    />
                    <Route path="/my-courses" element={<MyCourses />} />
                  </Route>

                  {/* ========================================
                      FULLY PROTECTED ROUTES - Authentication required
                      ======================================== */}

                  <Route element={<PersistLogin />}>
                    <Route element={<ProtectedRoute />}>
                      {/* General authenticated user routes */}
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/billing" element={<BillingRouter />} />
                      <Route
                        path="/grading/:courseId/:testId"
                        element={<TestGrading />}
                      />
                      <Route
                        path="/dashboard"
                        element={<Navigate to="/" replace />}
                      />

                      {/* ========================================
                          ADMIN ROUTES - Admin role required
                          ======================================== */}

                      <Route
                        element={<ProtectedRoute allowedRoles={["admin"]} />}
                      >
                        <Route path="/admin" element={<AdminLayout />}>
                          {/* Admin dashboard and main pages */}
                          <Route index element={<AdminDashboard />} />

                          {/* User management */}
                          <Route
                            path="instructors"
                            element={<InstructorList />}
                          />
                          <Route
                            path="instructor-requests"
                            element={<InstructorRequests />}
                          />
                          <Route
                            path="users/create"
                            element={<AddUserForm />}
                          />
                          <Route
                            path="users/:userID/edit"
                            element={<EditUser />}
                          />
                          <Route
                            path="manage-users"
                            element={<AdminManageUsers />}
                          />

                          {/* Course management */}
                          <Route
                            path="courses/create"
                            element={<CreateCourse />}
                          />
                          <Route
                            path="courses/new"
                            element={<CreateCourse />}
                          />
                          <Route
                            path="courses/:id/edit"
                            element={<EditCourse />}
                          />
                          <Route
                            path="manage-courses"
                            element={<AdminManageCourses />}
                          />
                          <Route
                            path="courses/:courseId/students"
                            element={<CourseStudents />}
                          />
                          <Route
                            path="manage-categories"
                            element={<AdminManageCategories />}
                          />
                          <Route path="levels" element={<Levels />} />

                          {/* System management */}
                          <Route
                            path="enrollment-requests"
                            element={<AdminEnrollmentRequests />}
                          />
                          <Route
                            path="live-sessions"
                            element={<AdminLiveSessions />}
                          />
                          <Route path="messages" element={<AdminMessages />} />
                          <Route
                            path="notifications"
                            element={<AdminNotifications />}
                          />
                          <Route path="reports" element={<AdminReports />} />
                          <Route path="payments" element={<AdminPayments />} />
                          <Route
                            path="instructor-payouts"
                            element={<AdminInstructorPayouts />}
                          />
                          <Route
                            path="refunds"
                            element={<AdminRefundManagement />}
                          />
                          <Route
                            path="gift-cards"
                            element={<AdminGiftCards />}
                          />
                          <Route
                            path="payment-settings"
                            element={<AdminPaymentSettings />}
                          />
                          {/* pending-fee-payments route removed - old system replaced */}
                          <Route path="settings" element={<AdminSettings />} />
                          <Route
                            path="bulk-delete"
                            element={<AdminBulkDelete />}
                          />
                          <Route
                            path="system-logs"
                            element={<AdminSystemLogs />}
                          />
                          <Route
                            path="system-config"
                            element={<SystemConfiguration />}
                          />
                          <Route
                            path="system-health"
                            element={<SystemHealth />}
                          />
                          <Route path="billing" element={<BillingRouter />} />
                        </Route>
                      </Route>

                      {/* ========================================
                          INSTRUCTOR ROUTES - Instructor role required
                          ======================================== */}

                      <Route
                        element={
                          <ProtectedRoute allowedRoles={["instructor"]} />
                        }
                      >
                        <Route
                          path="/instructor"
                          element={<InstructorLayout />}
                        >
                          {/* Instructor dashboard */}
                          <Route index element={<InstructorDashboard />} />

                          {/* Course management for instructors */}
                          <Route
                            path="courses"
                            element={<InstructorCourses />}
                          />
                          <Route
                            path="courses/new"
                            element={<CreateCourse />}
                          />
                          <Route
                            path="courses/edit/:id"
                            element={<EditCourse />}
                          />

                          {/* Live sessions management */}
                          <Route
                            path="live-sessions"
                            element={<InstructorLiveSessions />}
                          />

                          {/* Student and analytics management */}
                          <Route
                            path="students"
                            element={<InstructorStudents />}
                          />
                          <Route
                            path="grading"
                            element={<InstructorGrading />}
                          />
                          <Route
                            path="reports"
                            element={<InstructorReports />}
                          />
                          <Route
                            path="payments"
                            element={<InstructorPayments />}
                          />
                          {/* Payout requests route removed - using direct payout system now */}
                          {/* Instructors can view their payout history in the billing page */}
                          {/* admin-fee-payment route removed - old system replaced */}
                          <Route
                            path="refunds"
                            element={<InstructorRefunds />}
                          />
                          <Route
                            path="gift-cards"
                            element={<InstructorGiftCards />}
                          />
                          <Route
                            path="messages"
                            element={<InstructorMessages />}
                          />
                          <Route
                            path="notifications"
                            element={<InstructorNotifications />}
                          />
                          <Route path="levels" element={<Levels />} />
                          <Route path="billing" element={<BillingRouter />} />
                        </Route>
                      </Route>
                    </Route>

                    {/* ========================================
                        STUDENT ROUTES - Student role required
                        ======================================== */}

                    <Route
                      element={<ProtectedRoute allowedRoles={["student"]} />}
                    >
                      <Route element={<StudentLayout />}>
                        <Route
                          path="/student"
                          element={<Navigate to="/student/dashboard" replace />}
                        />
                        <Route
                          path="/student/dashboard"
                          element={<StudentDashboard />}
                        />
                        <Route
                          path="/student/courses"
                          element={<MyCourses />}
                        />
                        <Route
                          path="/my-courses"
                          element={<Navigate to="/student/courses" replace />}
                        />
                        <Route
                          path="/student/certificates"
                          element={<StudentCertificates />}
                        />
                        <Route
                          path="/student/live-sessions"
                          element={<StudentLiveSessions />}
                        />
                        <Route
                          path="/student/assignments"
                          element={<StudentAssignments />}
                        />
                        <Route
                          path="/student/grades"
                          element={<StudentGrades />}
                        />
                        <Route
                          path="/student/schedule"
                          element={<StudentSchedule />}
                        />
                        <Route
                          path="/student/messages"
                          element={<StudentMessages />}
                        />
                        <Route
                          path="/student/notifications"
                          element={<StudentNotifications />}
                        />
                        <Route
                          path="/student/gift-cards"
                          element={<StudentGiftCards />}
                        />
                        <Route
                          path="/student/refunds"
                          element={<StudentRefunds />}
                        />
                        <Route
                          path="/student/payments"
                          element={<StudentPayments />}
                        />
                      </Route>
                    </Route>
                  </Route>
                </Route>

                {/* ========================================
                    FALLBACK ROUTE - 404 Not Found
                    ======================================== */}

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
        </ErrorBoundary>
      </Router>

      {/* Global toast notification container */}
      <ToastContainer />
    </div>
  );
}

export default App;
