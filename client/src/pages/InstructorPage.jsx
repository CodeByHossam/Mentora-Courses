import React from "react";
import { useParams, Link } from "react-router-dom";
import { useGetUserQuery } from "../store/services/userApi";
import ProgressLoader from "../components/ProgressLoader";
import { Mail, Award, BookOpen, Users, Calendar, Star, CheckCircle, ExternalLink, Printer, ArrowLeft, GraduationCap, Briefcase, CreditCard, User } from "lucide-react";

const InfoRow = ({ label, value, mono = false }) => (
  <div className="flex flex-col gap-1">
    <span className="text-sm text-text-secondary">{label}</span>
    <span
      className={
        mono ? "font-mono text-text-primary break-all" : "text-text-primary"
      }
    >
      {value || "N/A"}
    </span>
  </div>
);

const Section = ({ title, children }) => (
  <section className="card space-y-4">
    <h2 className="text-xl font-semibold text-text-primary border-b border-border-light pb-2">
      {title}
    </h2>
    {children}
  </section>
);

const InstructorPage = () => {
  const { id } = useParams();
  const { data: user, isLoading, isError, error } = useGetUserQuery(id);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ProgressLoader
          isVisible={true}
          message="Loading instructor profile..."
        />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center">
        <div className="card">
          <p className="text-red-600 font-medium mb-2">
            Failed to load instructor profile.
          </p>
          {!!error?.data?.message && (
            <p className="text-sm text-text-secondary">{error.data.message}</p>
          )}
          <div className="mt-4">
            <Link to="/instructors" className="btn btn-secondary">
              Back to Instructors
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user.role !== "instructor") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center">
        <div className="card">
          <p className="text-text-secondary">This user is not an instructor.</p>
          <div className="mt-4">
            <Link to="/instructors" className="btn btn-secondary">
              Back to Instructors
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const profile = user.instructorProfile || {};
  const created = user.createdAt ? new Date(user.createdAt) : null;

  return (
    <div className="min-h-screen bg-primary">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{background: 'linear-gradient(to right, var(--info), var(--success))'}}></div>
        <div className="absolute bottom-20 left-10 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-1000" style={{background: 'linear-gradient(to right, var(--success), var(--info))'}}></div>
      </div>
      
      <div className="relative mx-auto w-full max-w-7xl px-4 py-8 md:py-12">
        {/* Enhanced Breadcrumbs */}
        <nav className="mb-8 flex items-center gap-2 text-sm">
          <Link to="/admin/instructors" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Instructors
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700 font-medium">{user.name}</span>
        </nav>

        {/* Enhanced Header */}
        <header className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 mb-12">
          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            {/* Profile Image */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-3xl border-4 border-white shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-3xl object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`${user.avatar ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                <User className="w-12 h-12 md:w-16 md:h-16 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-3">
                    {user.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Expert Instructor
                    </span>
                    {user.isActive ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                        Inactive
                      </span>
                    )}
                    {user.isVerified && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        <Award className="w-4 h-4 mr-1" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">{user.email}</span>
                </div>
                {created && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">
                      Joined {created.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <a 
                  href={`mailto:${user.email}`} 
                  className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-2xl hover:from-blue-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold"
                >
                  <Mail className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Contact Instructor
                </a>
                <button
                  type="button"
                  className="group inline-flex items-center px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl hover:border-blue-500 hover:text-blue-600 hover:shadow-lg transition-all duration-300 font-semibold"
                  onClick={() => window.print()}
                >
                  <Printer className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Print Profile
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Enhanced Content */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Stats & Quick Info */}
          <div className="space-y-6 lg:col-span-1">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center border border-blue-200">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mb-3">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {user.createdCourses?.length || 0}
                </div>
                <div className="text-sm text-blue-600 font-medium">Courses Created</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center border border-green-200">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl mb-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {user.enrolledCourses?.length || 0}
                </div>
                <div className="text-sm text-green-600 font-medium">Enrolled In</div>
              </div>
            </div>
            
            {/* Expertise Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Briefcase className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Expertise</h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                  <div className="text-sm font-medium text-purple-600 mb-1">Field of Expertise</div>
                  <div className="text-gray-900 font-semibold">
                    {profile.field || "Professional Development"}
                  </div>
                </div>
                {profile.additionalInfo && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-100">
                    <div className="text-sm font-medium text-blue-600 mb-1">Additional Info</div>
                    <div className="text-gray-700 text-sm leading-relaxed">
                      {profile.additionalInfo}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column - Detailed Information */}
          <div className="space-y-6 lg:col-span-2">
            {/* About Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">About</h3>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 border border-blue-100">
                <p className="text-gray-700 leading-relaxed text-lg">
                  {user.bio || "A dedicated instructor passionate about sharing knowledge and helping students achieve their learning goals."}
                </p>
              </div>
            </div>

            {/* Education & Certificates */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Education & Certificates</h3>
              </div>
              <div className="space-y-6">
                {/* University Certificate */}
                <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-5 h-5 text-green-600" />
                    <h4 className="text-lg font-semibold text-gray-900">University Certificate</h4>
                  </div>
                  {profile.universityCertificate ? (
                    <a
                      href={profile.universityCertificate}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-blue-600 hover:text-blue-800 hover:shadow-md transition-all duration-200 font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Certificate
                    </a>
                  ) : (
                    <p className="text-gray-600 italic">Certificate not uploaded</p>
                  )}
                </div>

                {/* Experience Certificates */}
                <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    <h4 className="text-lg font-semibold text-gray-900">Experience Certificates</h4>
                  </div>
                  {Array.isArray(profile.experienceCertificates) && profile.experienceCertificates.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {profile.experienceCertificates.map((href, i) => (
                        <a
                          key={i}
                          href={href?.url || href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-purple-600 hover:text-purple-800 hover:shadow-md transition-all duration-200 font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {href?.name || `Certificate ${i + 1}`}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 italic">No experience certificates uploaded</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Financial Information</h3>
              </div>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200 mb-6">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-yellow-500 rounded-full">
                    <ExternalLink className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-yellow-800 mb-1">Confidential Information</h4>
                    <p className="text-sm text-yellow-700">These details are sensitive and should only be shared with authorized personnel.</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-sm font-medium text-gray-600 mb-1">Bank Name</div>
                  <div className="text-gray-900 font-semibold">
                    {profile.bankName || "Not provided"}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-sm font-medium text-gray-600 mb-1">Account Number</div>
                  <div className="text-gray-900 font-mono text-sm break-all">
                    {profile.bankAccountNumber || "Not provided"}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 md:col-span-2">
                  <div className="text-sm font-medium text-gray-600 mb-1">IBAN</div>
                  <div className="text-gray-900 font-mono text-sm break-all">
                    {profile.iban || "Not provided"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default InstructorPage;
