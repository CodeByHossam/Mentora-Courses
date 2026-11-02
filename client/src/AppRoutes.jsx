// AppRoutes: all application routing. Split from App.jsx to keep App.jsx healthy.
// Contains route definitions and lazy component declarations.
import React, { Suspense, lazy } from "react";
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Layout } from "./components/layout";
import { AdminLayout } from "./components/layout";
import { InstructorLayout } from "./components/layout";
import { StudentLayout } from "./components/layout";
import { ProtectedRoute } from "./components/layout";
import { PersistLogin } from "./components/layout";
import { ProgressLoader } from "./components/common";
import { ScrollToTop } from "./components/common";
import { Login } from "./pages/auth";
import { Register } from "./pages/auth";
import { Help } from "./pages/public";
import { TermsAndConditions } from "./pages/public";
import { BillingRouter } from "./pages/Billing";
import { CourseDetails } from "./pages/CourseDetails";
import { NotFound } from "./pages/public";
import { MyCourses } from "./pages/student";
import { StudentCertificates } from "./components/student";
import { AdminManageCourses } from "./pages/admin";
import { CourseStudents } from "./pages/instructor";
import { AdminManageUsers } from "./pages/admin";
import { AdminEnrollmentRequests } from "./pages/admin";
import { CourseLesson } from "./pages/CourseLesson";
import { CourseEnrollment } from "./pages/student";
import { PaymentPage } from "./pages/PaymentPage";
import { PaymentSuccess } from "./pages/PaymentPage";
import { PaymentCancel } from "./pages/PaymentPage";
import { AddLesson } from "./pages/instructor";
import { EditLesson } from "./pages/instructor";
import { AddUserForm } from "./pages/admin";
import { EditUser } from "./pages/admin";
import { AdminReports } from "./pages/admin";
import { AdminSettings } from "./pages/admin";
import { AdminPaymentSettings } from "./pages/admin";
import { AdminPayments } from "./pages/admin";
import { AdminInstructorPayouts } from "./pages/admin";
import { AdminLiveSessions } from "./pages/admin";
import { AdminMessages } from "./pages/admin";
import { AdminNotifications } from "./pages/admin";
import { SystemConfiguration } from "./pages/admin";
import { SystemHealth } from "./pages/admin";
import { InstructorReports } from "./pages/instructor";
import { InstructorRequestForm } from "./pages/instructor";
import { InstructorRequests } from "./pages/instructor";
import { InstructorList } from "./pages/instructor";
import { InstructorPage } from "./pages/instructor";
import { InstructorPayments } from "./pages/instructor";
import { InstructorRefunds } from "./pages/instructor";
import { InstructorMessages } from "./pages/instructor";
import { InstructorGrading } from "./pages/instructor";
import { TestGrading } from "./pages/instructor";
import { StudentRefunds } from "./pages/student";
import { AdminRefundManagement } from "./pages/admin";
import { ForgotPassword } from "./pages/auth";

const HomePage = lazy(() => import("./pages/public").then(m => ({ default: m.HomePage })));
const AdminDashboard = lazy(() => import("./pages/admin").then(m => ({ default: m.AdminDashboard })));
const InstructorDashboard = lazy(() => import("./pages/instructor").then(m => ({ default: m.InstructorDashboard })));
const StudentDashboard = lazy(() => import("./pages/student").then(m => ({ default: m.StudentDashboard })));
const CourseList = lazy(() => import("./pages/public").then(m => ({ default: m.CourseList })));
const About = lazy(() => import("./pages/public").then(m => ({ default: m.About })));
const Contact = lazy(() => import("./pages/public").then(m => ({ default: m.Contact })));
const AdminManageCategories = lazy(() => import("./pages/admin").then(m => ({ default: m.AdminManageCategories })));
const Profile = lazy(() => import("./pages/student").then(m => ({ default: m.Profile })));
const InstructorCourses = lazy(() => import("./pages/instructor").then(m => ({ default: m.InstructorCourses })));
const CreateCourse = lazy(() => import("./pages/instructor").then(m => ({ default: m.CreateCourse })));
const EditCourse = lazy(() => import("./pages/instructor").then(m => ({ default: m.EditCourse })));
const InstructorStudents = lazy(() => import("./pages/instructor").then(m => ({ default: m.InstructorStudents })));
const InstructorLiveSessions = lazy(() => import("./pages/instructor").then(m => ({ default: m.InstructorLiveSessions })));
const InstructorNotifications = lazy(() => import("./pages/instructor").then(m => ({ default: m.InstructorNotifications })));
const StudentLiveSessions = lazy(() => import("./pages/student").then(m => ({ default: m.StudentLiveSessions })));
const StudentAssignments = lazy(() => import("./pages/student").then(m => ({ default: m.StudentAssignments })));
const StudentGrades = lazy(() => import("./pages/student").then(m => ({ default: m.StudentGrades })));
const StudentSchedule = lazy(() => import("./pages/student").then(m => ({ default: m.StudentSchedule })));
const StudentMessages = lazy(() => import("./pages/student").then(m => ({ default: m.StudentMessages })));
const StudentNotifications = lazy(() => import("./pages/student").then(m => ({ default: m.StudentNotifications })));
const StudentPayments = lazy(() => import("./pages/student").then(m => ({ default: m.StudentPayments })));
const Wishlist = lazy(() => import("./pages/student").then(m => ({ default: m.Wishlist })));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <ProgressLoader isVisible={true} message="Loading..." />
  </div>
);

export const AppRoutes = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/instructor-register" element={<InstructorRequestForm />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/courses" element={<CourseList />} />
      <Route path="about" element={<About />} />
      <Route path="contact" element={<Contact />} />
      <Route path="help" element={<Help />} />
      <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
      <Route path="/instructor/:id" element={<InstructorPage />} />
      <Route element={<PersistLogin />}>
        <Route path="/courses/:courseId" element={<CourseDetails />} />
        <Route path="/courses/:courseId/learn" element={<CourseLesson />} />
        <Route path="/courses/:courseId/add-lesson" element={<AddLesson />} />
        <Route path="/lessons/:lessonId/edit" element={<EditLesson />} />
        <Route path="/courses/:courseId/enroll" element={<CourseEnrollment />} />
        <Route path="/payment/:courseId" element={<PaymentPage />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        <Route path="certificates" element={<StudentCertificates />} />
        <Route path="/my-courses" element={<MyCourses />} />
      </Route>
      <Route element={<PersistLogin />}>
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/billing" element={<BillingRouter />} />
          <Route path="/grading/:courseId/:testId" element={<TestGrading />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="instructors" element={<InstructorList />} />
              <Route path="instructor-requests" element={<InstructorRequests />} />
              <Route path="users/create" element={<AddUserForm />} />
              <Route path="users/:userID/edit" element={<EditUser />} />
              <Route path="manage-users" element={<AdminManageUsers />} />
              <Route path="courses/create" element={<CreateCourse />} />
              <Route path="courses/new" element={<CreateCourse />} />
              <Route path="courses/:id/edit" element={<EditCourse />} />
              <Route path="manage-courses" element={<AdminManageCourses />} />
              <Route path="courses/:courseId/students" element={<CourseStudents />} />
              <Route path="manage-categories" element={<AdminManageCategories />} />
              <Route path="enrollment-requests" element={<AdminEnrollmentRequests />} />
              <Route path="live-sessions" element={<AdminLiveSessions />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="instructor-payouts" element={<AdminInstructorPayouts />} />
              <Route path="refunds" element={<AdminRefundManagement />} />
              <Route path="payment-settings" element={<AdminPaymentSettings />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="system-config" element={<SystemConfiguration />} />
              <Route path="system-health" element={<SystemHealth />} />
              <Route path="billing" element={<BillingRouter />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["instructor"]} />}>
            <Route path="/instructor" element={<InstructorLayout />}>
              <Route index element={<InstructorDashboard />} />
              <Route path="courses" element={<InstructorCourses />} />
              <Route path="courses/new" element={<CreateCourse />} />
              <Route path="courses/edit/:id" element={<EditCourse />} />
              <Route path="live-sessions" element={<InstructorLiveSessions />} />
              <Route path="students" element={<InstructorStudents />} />
              <Route path="grading" element={<InstructorGrading />} />
              <Route path="reports" element={<InstructorReports />} />
              <Route path="payments" element={<InstructorPayments />} />
              <Route path="refunds" element={<InstructorRefunds />} />
              <Route path="messages" element={<InstructorMessages />} />
              <Route path="notifications" element={<InstructorNotifications />} />
              <Route path="billing" element={<BillingRouter />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
            <Route element={<StudentLayout />}>
              <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/courses" element={<MyCourses />} />
              <Route path="/my-courses" element={<Navigate to="/student/courses" replace />} />
              <Route path="/student/certificates" element={<StudentCertificates />} />
              <Route path="/student/live-sessions" element={<StudentLiveSessions />} />
              <Route path="/student/assignments" element={<StudentAssignments />} />
              <Route path="/student/grades" element={<StudentGrades />} />
              <Route path="/student/schedule" element={<StudentSchedule />} />
              <Route path="/student/messages" element={<StudentMessages />} />
              <Route path="/student/notifications" element={<StudentNotifications />} />
              <Route path="/student/wishlist" element={<Wishlist />} />
              <Route path="/student/refunds" element={<StudentRefunds />} />
              <Route path="/student/payments" element={<StudentPayments />} />
            </Route>
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
);
export default AppRoutes;
