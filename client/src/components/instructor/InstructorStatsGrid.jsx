import React from "react";

const InstructorStatsGrid = ({ courses, totalStudents, avgRating, formattedRevenue, revenueGrowth, revenueGrowthColor }) => {
  return (
    <>
        {/* Enhanced Stats Grid */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Courses */}
          <div className="card overflow-hidden rounded-lg border-l-4" style={{borderLeftColor: 'var(--primary)'}}>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background: 'var(--primary)'}}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="text-2xl font-bold text-primary">{courses?.length || 0}</div>
                  <div className="text-sm font-medium text-muted">Your Courses</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {courses?.filter(c => c.status === 'published').length || 0} published
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Total Students */}
          <div className="card overflow-hidden rounded-lg border-l-4" style={{borderLeftColor: 'var(--success)'}}>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: 'var(--success)'}}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="text-2xl font-bold text-primary">{totalStudents}</div>
                  <div className="text-sm font-medium text-muted">Total Students</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Across {courses?.length || 0} courses
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Average Rating */}
          <div className="card overflow-hidden rounded-lg border-l-4" style={{borderLeftColor: 'var(--warning)'}}>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: 'var(--warning)'}}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="text-2xl font-bold text-primary">{avgRating}</div>
                  <div className="text-sm font-medium text-muted">Average Rating</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {ratedCurses.length} rated course{ratedCurses.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="card overflow-hidden rounded-lg border-l-4" style={{borderLeftColor: 'var(--secondary)'}}>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: 'var(--secondary)'}}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="text-2xl font-bold text-primary">{formattedRevenue}</div>
                  <div className="text-sm font-medium text-muted">This Month</div>
                  <div className={`text-xs mt-1 ${revenueGrowthColor}`}>
                    {revenueGrowth} from last month
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </>
  );
};

export default InstructorStatsGrid;
