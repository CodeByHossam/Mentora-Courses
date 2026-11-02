import React, { memo } from "react";
import useCourseList from "./useCourseList";
import { CourseCard } from "../../components/course";
import { LoadingSpinner } from "../../components/common";
import { Card } from "../../components/common";
import { Search, Filter, Grid, List, ChevronLeft, ChevronRight } from "lucide-react";

const CourseList = memo(({ limit }) => {
  const {
    categories, isLoading, error,
    currentPage, coursesPerPage,
    filters, viewMode, setViewMode,
    paginatedCourses, totalPages, totalCourses, meta,
    handleFilterChange, resetFilters, handlePreviousPage, handleNextPage,
  } = useCourseList({ limit });

  if (isLoading)
    return (
      <div className="container-app section-padding">
        <LoadingSpinner size="lg" text="Loading courses..." />
      </div>
    );

  if (error)
    return (
      <Card className="container-app section-padding">
        <div className="text-center text-red-600" role="alert">
          <h3 className="text-lg font-semibold mb-2">Error Loading Courses</h3>
          <p>Please try again later or contact support if the problem persists.</p>
        </div>
      </Card>
    );

  return (
    <div className="min-h-screen bg-primary overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="card rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="text-center">
            <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4">🎓</div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold" style={{ background: "linear-gradient(to right, var(--secondary), var(--primary))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              {limit ? "🌟 Featured Courses" : "📚 Course Catalog"}
            </h1>
            <p className="mt-2 text-secondary max-w-2xl mx-auto">
              {limit ? "Discover our most popular and highly-rated courses" : `Explore ${totalCourses} amazing courses and find your perfect learning path`}
            </p>
            {!limit && (
              <div className="mt-4 flex justify-center items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--secondary)" }}></div>
                <span className="text-sm text-secondary">
                  {filters.search.trim() || filters.category || filters.level ? `Found ${meta.total} courses` : `Total Courses: ${meta.total}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {!limit && (
          <div className="card rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex-1 max-w-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">🔍 Search Courses</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
                    <input
                      name="search"
                      type="text"
                      placeholder="Search courses by title, description..."
                      value={filters.search}
                      onChange={handleFilterChange}
                      className="w-full pl-10 pr-4 py-3 border rounded-lg transition-all duration-200"
                      style={{ borderColor: "var(--card-border)" }}
                      onFocus={(e) => { e.target.style.borderColor = "var(--primary)"; e.target.style.outline = "2px solid var(--primary)"; e.target.style.outlineOffset = "2px"; }}
                      onBlur={(e) => { e.target.style.borderColor = "var(--card-border)"; e.target.style.outline = "none"; }}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-secondary mr-2">View:</span>
                  <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-all duration-200 ${viewMode === "grid" ? "bg-purple-100 text-purple-600" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}>
                    <Grid className="w-5 h-5" />
                  </button>
                  <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-all duration-200 ${viewMode === "list" ? "bg-purple-100 text-purple-600" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}>
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📂 Category</label>
                  <select name="category" value={filters.category} onChange={handleFilterChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200">
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.name}>📂 {category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📈 Level</label>
                  <select name="level" value={filters.level} onChange={handleFilterChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200">
                    <option value="">All Levels</option>
                    <option value="Beginner">🌱 Beginner</option>
                    <option value="Intermediate">🚀 Intermediate</option>
                    <option value="Advanced">⚡ Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🔄 Sort By</label>
                  <select name="sort" value={filters.sort} onChange={handleFilterChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200">
                    <option value="newest">🆕 Newest First</option>
                    <option value="oldest">📅 Oldest First</option>
                    <option value="price-asc">💰 Price: Low to High</option>
                    <option value="price-desc">💎 Price: High to Low</option>
                    <option value="rating">⭐ Highest Rated</option>
                    <option value="popular">🔥 Most Popular</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {paginatedCourses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="flex flex-col items-center">
              <div className="text-8xl mb-6">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600 mb-8 max-w-md">We couldn't find any courses matching your criteria. Try adjusting your filters or search terms.</p>
              {!limit && (
                <button onClick={resetFilters} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium">
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
            {paginatedCourses.map((course) => (
              <CourseCard key={course._id} course={course} viewMode={viewMode} className="h-full" />
            ))}
          </div>
        )}

        {!limit && allCourses.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mt-8">
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
              <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                {totalPages === 1 ? (
                  <>Showing all <span className="font-semibold">{totalCourses}</span> courses</>
                ) : (
                  <>Showing <span className="font-semibold">{(currentPage - 1) * coursesPerPage + 1}</span> to <span className="font-semibold">{Math.min(currentPage * coursesPerPage, totalCourses)}</span> of <span className="font-semibold">{totalCourses}</span> courses</>
                )}
              </div>
              <div className="flex items-center justify-center space-x-2 sm:space-x-4">
                <button onClick={handlePreviousPage} disabled={currentPage <= 1} className="flex items-center px-3 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md">
                  <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </button>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <span className="text-xs sm:text-sm text-gray-600">Page</span>
                  <span className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm font-semibold text-purple-600 bg-purple-100 rounded-lg">{currentPage}</span>
                  <span className="text-xs sm:text-sm text-gray-600">of {Math.max(1, totalPages)}</span>
                </div>
                <button onClick={handleNextPage} disabled={currentPage >= totalPages} className="flex items-center px-3 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md">
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

CourseList.displayName = "CourseList";
export default CourseList;
