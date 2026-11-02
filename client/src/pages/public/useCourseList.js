import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useGetCoursesQuery } from "../../store/services/courseApi";
import { useGetCategoriesQuery } from "../../store/services/categoryApi";
import { selectCurrentUser } from "../../store/slices/authSlice";

export const useCourseList = ({ limit }) => {
  const user = useSelector(selectCurrentUser);
  const { data: categoriesData, error: categoriesError } = useGetCategoriesQuery();
  const categories = categoriesData?.data ?? [];

  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 10;

  const [filters, setFilters] = useState({ search: "", category: "", level: "", sort: "newest" });
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(filters.search), 500);
    return () => clearTimeout(handler);
  }, [filters.search]);

  const memoizedQueryParams = useMemo(() => {
    if (limit) {
      return { sort: filters.sort, limit: limit, page: 1 };
    } else {
      const params = { sort: filters.sort, limit: coursesPerPage, page: currentPage };
      if (debouncedSearch.trim()) params.search = debouncedSearch;
      if (filters.category && filters.category !== "") params.category = filters.category;
      if (filters.level && filters.level !== "") params.level = filters.level;
      return params;
    }
  }, [filters.sort, filters.category, filters.level, debouncedSearch, limit, coursesPerPage, currentPage]);

  const { data: response, isLoading, error, refetch } = useGetCoursesQuery(memoizedQueryParams, { refetchOnMountOrArgChange: true });
  const allCourses = response?.data ?? [];
  const meta = response?.meta ?? { page: 1, pages: 1, total: 0 };

  useEffect(() => {
    if (error) console.error("Course list failed to load", error);
    if (categoriesError) console.error("Categories failed to load", categoriesError);
  }, [error, categoriesError]);

  const paginatedCourses = useMemo(() => {
    if (limit) {
      let filtered = [...allCourses];
      if (debouncedSearch.trim()) {
        const searchTerm = debouncedSearch.toLowerCase();
        filtered = filtered.filter((course) =>
          course.title?.toLowerCase().includes(searchTerm) ||
          course.description?.toLowerCase().includes(searchTerm) ||
          course.instructor?.name?.toLowerCase().includes(searchTerm) ||
          course.category?.name?.toLowerCase().includes(searchTerm)
        );
      }
      if (filters.category && filters.category !== "") {
        filtered = filtered.filter((course) => course.category?.name === filters.category || course.category?.name?.toLowerCase() === filters.category.toLowerCase());
      }
      if (filters.level && filters.level !== "") {
        filtered = filtered.filter((course) => course.level?.toLowerCase() === filters.level.toLowerCase());
      }
      return filtered.slice(0, limit);
    } else {
      return allCourses;
    }
  }, [allCourses, debouncedSearch, filters.category, filters.level, limit]);

  const totalPages = limit ? 1 : meta.pages;
  const totalCourses = limit ? paginatedCourses.length : meta.total;

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
    if (!limit) setCurrentPage(1);
  };
  const resetFilters = () => {
    setFilters({ search: "", category: "", level: "", sort: "newest" });
    setCurrentPage(1);
  };
  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  return {
    user, categories, isLoading, error, refetch,
    currentPage, setCurrentPage, coursesPerPage,
    filters, setFilters, debouncedSearch, viewMode, setViewMode,
    paginatedCourses, totalPages, totalCourses, meta,
    handleFilterChange, resetFilters, handlePreviousPage, handleNextPage,
    limit,
  };
};
export default useCourseList;
