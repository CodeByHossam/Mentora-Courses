import React, { useState, useEffect } from 'react';
import { 
  useGetLevelsQuery, 
  useGetLevelsDashboardQuery,
  useCreateLevelMutation, 
  useUpdateLevelMutation, 
  useDeleteLevelMutation,
  useReorderLevelsMutation 
} from '../store/services/levelApi';
import { useSelector } from 'react-redux';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  BookOpen, 
  Users, 
  GraduationCap,
  TrendingUp,
  Eye,
  EyeOff,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Target,
  Award,
  Layers
} from 'lucide-react';

const Levels = () => {
  const { user } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [sortBy, setSortBy] = useState('order');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: 1,
    color: '#3B82F6',
    icon: 'BookOpen',
    prerequisites: [],
    isActive: true,
    order: 0
  });

  // API hooks
  const { 
    data: levelsData, 
    isLoading: levelsLoading, 
    error: levelsError,
    refetch: refetchLevels
  } = useGetLevelsQuery({
    page: currentPage,
    limit: 20,
    search: searchTerm,
    isActive: filterActive,
    sortBy,
    sortOrder
  });

  const { 
    data: dashboardData, 
    isLoading: dashboardLoading 
  } = useGetLevelsDashboardQuery();

  const [createLevel, { isLoading: createLoading }] = useCreateLevelMutation();
  const [updateLevel, { isLoading: updateLoading }] = useUpdateLevelMutation();
  const [deleteLevel, { isLoading: deleteLoading }] = useDeleteLevelMutation();
  const [reorderLevels] = useReorderLevelsMutation();

  // Icon options
  const iconOptions = [
    'BookOpen', 'Target', 'Award', 'TrendingUp', 'BarChart3', 
    'GraduationCap', 'Users', 'Layers', 'CheckCircle'
  ];

  // Color options
  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ];

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      difficulty: 1,
      color: '#3B82F6',
      icon: 'BookOpen',
      prerequisites: [],
      isActive: true,
      order: 0
    });
  };

  // Handle create level
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createLevel(formData).unwrap();
      setShowCreateModal(false);
      resetForm();
      refetchLevels();
    } catch (error) {
      console.error('Error creating level:', error);
    }
  };

  // Handle edit level
  const handleEdit = (level) => {
    setSelectedLevel(level);
    setFormData({
      name: level.name,
      description: level.description,
      difficulty: level.difficulty,
      color: level.color,
      icon: level.icon,
      prerequisites: level.prerequisites?.map(p => p._id) || [],
      isActive: level.isActive,
      order: level.order
    });
    setShowEditModal(true);
  };

  // Handle update level
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateLevel({ id: selectedLevel._id, ...formData }).unwrap();
      setShowEditModal(false);
      resetForm();
      setSelectedLevel(null);
      refetchLevels();
    } catch (error) {
      console.error('Error updating level:', error);
    }
  };

  // Handle delete level
  const handleDelete = async () => {
    try {
      await deleteLevel(selectedLevel._id).unwrap();
      setShowDeleteModal(false);
      setSelectedLevel(null);
      refetchLevels();
    } catch (error) {
      console.error('Error deleting level:', error);
    }
  };

  // Get icon component
  const getIconComponent = (iconName) => {
    const icons = {
      BookOpen, Target, Award, TrendingUp, BarChart3,
      GraduationCap, Users, Layers, CheckCircle
    };
    const IconComponent = icons[iconName] || BookOpen;
    return <IconComponent className="w-5 h-5" />;
  };

  // Get difficulty label
  const getDifficultyLabel = (difficulty) => {
    if (difficulty <= 3) return 'Beginner';
    if (difficulty <= 6) return 'Intermediate';
    if (difficulty <= 8) return 'Advanced';
    return 'Expert';
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    if (difficulty <= 3) return 'text-green-600 bg-green-100';
    if (difficulty <= 6) return 'text-yellow-600 bg-yellow-100';
    if (difficulty <= 8) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  // Handle loading state
  if (levelsLoading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-300 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // Handle authentication error
  if (levelsError) {
    console.error('Levels API Error:', levelsError);
    
    // Check if it's an authentication error
    if (levelsError.status === 401 || levelsError.data?.code === 'NOT_AUTHENTICATED') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8 text-center">
              <div className="mb-4">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
                <p className="text-gray-600 mb-6">
                  You need to be logged in to access the levels management page.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 text-sm">
                    <strong>Error:</strong> {levelsError.data?.message || 'Authentication failed'}
                  </p>
                </div>
                <button
                  onClick={() => window.location.href = '/login'}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Handle other errors
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Levels</h2>
            <p className="text-gray-600 mb-4">
              There was an error loading the levels data. Please try again.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">
                <strong>Error:</strong> {levelsError.data?.message || levelsError.message || 'Unknown error'}
              </p>
            </div>
            <button
              onClick={() => refetchLevels()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mr-4"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Debug: Log user and authentication state
  console.log('Current user:', user);
  console.log('User role:', user?.role);
  console.log('Levels data:', levelsData);
  console.log('Dashboard data:', dashboardData);

  return (
    <div className="min-h-screen bg-primary p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📚 Course Levels Management
            </h1>
            <p className="text-gray-600">
              Manage difficulty levels for courses with detailed statistics
            </p>
          </div>
          {(user?.role === 'admin' || user?.role === 'instructor') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 md:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add New Level
            </button>
          )}
        </div>

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Info:</h3>
            <div className="text-xs text-yellow-700 space-y-1">
             
              <p><strong>Levels Count:</strong> {levelsData?.levels?.length || 0}</p>
              <p><strong>Dashboard Data:</strong> {dashboardData ? 'Loaded' : 'Not loaded'}</p>
            </div>
          </div>
        )}

        {/* Dashboard Stats */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Levels</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardData.overview.totalLevels}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Layers className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Levels</p>
                  <p className="text-3xl font-bold text-green-600">
                    {dashboardData.overview.activeLevels}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Courses</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {dashboardData.overview.totalCourses}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {dashboardData.overview.totalStudents}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search levels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter by Active Status */}
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Levels</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="order">Order</option>
              <option value="name">Name</option>
              <option value="difficulty">Difficulty</option>
              <option value="createdAt">Created Date</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

        {/* Levels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {levelsData?.levels?.map((level) => (
            <div
              key={level._id}
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-200"
            >
              {/* Level Header */}
              <div 
                className="p-6 text-white relative"
                style={{ backgroundColor: level.color }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getIconComponent(level.icon)}
                    <div>
                      <h3 className="text-xl font-bold">{level.name}</h3>
                      <p className="text-white/80 text-sm">
                        Order: {level.order} • Difficulty: {level.difficulty}/10
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {level.isActive ? (
                      <Eye className="w-5 h-5 text-white/80" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-white/80" />
                    )}
                  </div>
                </div>
              </div>

              {/* Level Content */}
              <div className="p-6">
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {level.description}
                </p>

                {/* Difficulty Badge */}
                <div className="mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(level.difficulty)}`}>
                    {getDifficultyLabel(level.difficulty)}
                  </span>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {level.courseCount || 0}
                    </div>
                    <div className="text-xs text-gray-500">Courses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {level.studentCount || 0}
                    </div>
                    <div className="text-xs text-gray-500">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {level.instructorCount || 0}
                    </div>
                    <div className="text-xs text-gray-500">Instructors</div>
                  </div>
                </div>

                {/* Created By */}
                <div className="text-sm text-gray-500 mb-4">
                  Created by: {level.createdBy?.name || 'Unknown'}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {(user?.role === 'admin' || 
                    (user?.role === 'instructor' && level.createdBy?._id === user._id)) && (
                    <button
                      onClick={() => handleEdit(level)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        setSelectedLevel(level);
                        setShowDeleteModal(true);
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {levelsData?.pagination && levelsData.pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!levelsData.pagination.hasPrevPage}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                {levelsData.pagination.currentPage} of {levelsData.pagination.totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!levelsData.pagination.hasNextPage}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {showCreateModal ? 'Create New Level' : 'Edit Level'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                      setSelectedLevel(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={showCreateModal ? handleCreate : handleUpdate} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Level Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Difficulty and Order */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Difficulty (1-10) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.difficulty}
                        onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Order
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Color and Icon */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color *
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setFormData({ ...formData, color })}
                            className={`w-8 h-8 rounded-full border-2 ${
                              formData.color === color ? 'border-gray-800' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Icon
                      </label>
                      <select
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {iconOptions.map((icon) => (
                          <option key={icon} value={icon}>
                            {icon}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Active Level
                    </label>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-4 pt-6">
                    <button
                      type="submit"
                      disabled={createLoading || updateLoading}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Save className="w-5 h-5" />
                      {showCreateModal ? 'Create Level' : 'Update Level'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setShowEditModal(false);
                        resetForm();
                        setSelectedLevel(null);
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedLevel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Delete Level
                    </h3>
                    <p className="text-gray-600">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete the level "{selectedLevel.name}"? 
                  This will affect {selectedLevel.courseCount || 0} courses.
                </p>

                <div className="flex gap-4">
                  <button
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleteLoading ? 'Deleting...' : 'Delete Level'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedLevel(null);
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Levels;
