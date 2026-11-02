import React from "react";
import { BookOpen, Video, Award, Clock } from "lucide-react";

const StudentSummaryCards = ({ isLoadingCourses, enrolledCourses, upcomingSessionsCount, pendingRequestsCount }) => {
  return (
    <>
      {/* Enhanced Dashboard Summary */}
      <div className="mb-8 sm:mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="card rounded-xl p-4 sm:p-6 border-l-4 hover:shadow-xl transition-shadow" style={{borderLeftColor: 'var(--secondary)'}}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: 'var(--accent)'}}>
                <BookOpen className="w-6 h-6" style={{color: 'var(--secondary)'}} />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {isLoadingCourses ? "..." : enrolledCourses?.length ?? 0}
              </div>
              <div className="text-sm font-medium text-muted">
                Enrolled Courses
              </div>
              <div className="text-xs text-muted mt-1">Active learning</div>
            </div>
          </div>
        </div>

        <div className="card rounded-xl p-6 border-l-4 hover:shadow-xl transition-shadow" style={{borderLeftColor: 'var(--info)'}}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: 'var(--info-light)'}}>
                <Video className="w-6 h-6" style={{color: 'var(--info)'}} />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {upcomingSessionsCount}
              </div>
              <div className="text-sm font-medium text-muted">
                Live Sessions
              </div>
              <div className="text-xs text-gray-400 mt-1">Upcoming</div>
            </div>
          </div>
        </div>

        <div className="card rounded-xl p-6 border-l-4 hover:shadow-xl transition-shadow" style={{borderLeftColor: 'var(--warning)'}}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: 'var(--warning-light)'}}>
                <Clock className="w-6 h-6" style={{color: 'var(--warning)'}} />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-primary">
                {pendingRequestsCount}
              </div>
              <div className="text-sm font-medium text-muted">
                Pending Requests
              </div>
              <div className="text-xs text-muted mt-1">
                Awaiting approval
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">-</div>
              <div className="text-sm font-medium text-muted">
                Certificates
              </div>
              <div className="text-xs text-gray-400 mt-1">Earned</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentSummaryCards;
