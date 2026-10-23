import React, { useState } from 'react';
import { Gift, Plus, Search, Filter, Users, DollarSign, Calendar, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { useAddGiftCardMutation, useGetGiftCardHistoryQuery, useDeleteGiftCardMutation } from '../store/services/billingApi';

const AdminGiftCards = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [giftCardToDelete, setGiftCardToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    giftCardType: 'all',
    isActive: 'all',
    userId: ''
  });

  const [createForm, setCreateForm] = useState({
    userId: '',
    userEmail: '',
    userRole: 'instructor', // instructor or student
    amount: '',
    giftCardType: 'admin_issued',
    courseId: '', // For student gift cards
    courseName: '', // For student gift cards
    description: '',
    expiryDays: 365
  });

  const [roleError, setRoleError] = useState('');

  const { 
    data: giftCardsData, 
    isLoading, 
    error,
    refetch 
  } = useGetGiftCardHistoryQuery({
    page: currentPage,
    limit: 10,
    giftCardType: filters.giftCardType !== 'all' ? filters.giftCardType : undefined,
    isActive: filters.isActive !== 'all' ? filters.isActive === 'active' : undefined,
    userId: filters.userId || undefined
  });

  const [addGiftCard, { isLoading: isCreating }] = useAddGiftCardMutation();
  const [deleteGiftCard, { isLoading: isDeleting }] = useDeleteGiftCardMutation();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCreateGiftCard = async (e) => {
    e.preventDefault();
    setRoleError('');
    
    // Validate user identification
    if (!createForm.userId && !createForm.userEmail) {
      setRoleError('Please enter either User ID or User Email');
      return;
    }
    
    // Validation for student gift cards
    if (createForm.userRole === 'student') {
      if (!createForm.courseId && !createForm.courseName) {
        setRoleError('Please enter either Course ID or Course Name for student gift cards');
        return;
      }
      if (createForm.giftCardType !== 'course_purchase') {
        setRoleError('Student gift cards can only be used for course purchases');
        return;
      }
    }
    
    try {
      const payload = {
        userId: createForm.userId || undefined,
        userEmail: createForm.userEmail || undefined,
        userRole: createForm.userRole,
        amount: parseFloat(createForm.amount),
        giftCardType: createForm.giftCardType,
        description: createForm.description,
        expiryDays: parseInt(createForm.expiryDays)
      };

      // Add course info for student gift cards
      if (createForm.userRole === 'student') {
        payload.courseId = createForm.courseId || undefined;
        payload.courseName = createForm.courseName || undefined;
      }

      await addGiftCard(payload).unwrap();

      // Reset form and close modal
      setCreateForm({
        userId: '',
        userEmail: '',
        userRole: 'instructor',
        amount: '',
        giftCardType: 'admin_issued',
        courseId: '',
        courseName: '',
        description: '',
        expiryDays: 365
      });
      setRoleError('');
      setShowCreateModal(false);
      refetch();
    } catch (error) {
      console.error('Failed to create gift card:', error);
      // Check if error is about role mismatch
      if (error?.data?.message?.includes('role')) {
        setRoleError(error.data.message);
      }
    }
  };

  const handleDeleteClick = (card) => {
    setGiftCardToDelete(card);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!giftCardToDelete) return;
    
    try {
      await deleteGiftCard(giftCardToDelete._id).unwrap();
      setShowDeleteModal(false);
      setGiftCardToDelete(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete gift card:', error);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setGiftCardToDelete(null);
  };

  const instructorGiftCardTypes = [
    { value: 'admin_issued', label: 'Admin Issued' },
    { value: 'welcome_bonus', label: 'Welcome Bonus' },
    { value: 'commission_reward', label: 'Commission Reward' },
    { value: 'referral_bonus', label: 'Referral Bonus' },
    { value: 'achievement_reward', label: 'Achievement Reward' },
    { value: 'promotional', label: 'Promotional' },
    { value: 'compensation', label: 'Compensation' }
  ];

  const studentGiftCardTypes = [
    { value: 'course_purchase', label: 'Course Purchase' }
  ];

  const giftCardTypes = createForm.userRole === 'student' ? studentGiftCardTypes : instructorGiftCardTypes;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const giftCards = giftCardsData?.data || [];
  const pagination = giftCardsData?.pagination || {};
  const stats = giftCardsData?.stats || {};


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Gift className="w-8 h-8 text-purple-600" />
              Gift Card Management
            </h1>
            <p className="text-gray-600 mt-2">Create and manage gift cards for users</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Gift Card
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.giftCardType}
                onChange={(e) => setFilters(prev => ({ ...prev, giftCardType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {giftCardTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.isActive}
                onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <input
                type="text"
                value={filters.userId}
                onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                placeholder="Filter by user ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Gift Cards List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {giftCards.map((card, index) => (
                  <tr key={card._id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {card.recipient?.name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {card.recipient?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(card.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        {card.type?.replace('_', ' ') || 'Gift Card'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        card.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {card.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(card.issuedAt || card.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {card.description || 'No description'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteClick(card)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors"
                        title="Delete Gift Card"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex gap-1">
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-2 rounded-lg ${
                    currentPage === i + 1
                      ? 'bg-purple-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              disabled={currentPage === pagination.totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Create Gift Card Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Create Gift Card</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateGiftCard} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User ID
                  </label>
                  <input
                    type="text"
                    value={createForm.userId}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, userId: e.target.value }))}
                    placeholder="Enter user ID..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Email
                  </label>
                  <input
                    type="email"
                    value={createForm.userEmail}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, userEmail: e.target.value }))}
                    placeholder="Enter user email..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">⚠️ At least one is required (User ID or Email)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Role *
                  </label>
                  <select
                    value={createForm.userRole}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setCreateForm(prev => ({ 
                        ...prev, 
                        userRole: newRole,
                        giftCardType: newRole === 'student' ? 'course_purchase' : 'admin_issued',
                        courseId: '',
                        courseName: ''
                      }));
                      setRoleError('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="instructor">Instructor</option>
                    <option value="student">Student</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {createForm.userRole === 'student' 
                      ? '⚠️ Student gift cards can only be used for course purchases'
                      : '✓ Instructor gift cards can be claimed and added to commissions'}
                  </p>
                </div>

                {/* Course fields for student gift cards */}
                {createForm.userRole === 'student' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course ID
                      </label>
                      <input
                        type="text"
                        value={createForm.courseId}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, courseId: e.target.value }))}
                        placeholder="Enter course ID..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course Name
                      </label>
                      <input
                        type="text"
                        value={createForm.courseName}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, courseName: e.target.value }))}
                        placeholder="Enter course name..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        ⚠️ At least one is required (Course ID or Name)
                      </p>
                    </div>
                  </>
                )}

                {/* Role error message */}
                {roleError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">
                      <strong>Error:</strong> {roleError}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount {createForm.userRole === 'student' ? '(Auto-filled from course price)' : '*'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10000"
                    value={createForm.amount}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder={createForm.userRole === 'student' ? 'Will be set from course price' : 'Enter amount...'}
                    required={createForm.userRole !== 'student'}
                    readOnly={createForm.userRole === 'student'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                  />
                  {createForm.userRole === 'student' && (
                    <p className="mt-1 text-xs text-blue-600">
                      ℹ️ Amount will be automatically set based on the course price
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={createForm.giftCardType}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, giftCardType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {giftCardTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={createForm.expiryDays}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, expiryDays: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isCreating || 
                      (!createForm.userId && !createForm.userEmail) ||
                      (createForm.userRole === 'instructor' && !createForm.amount) ||
                      (createForm.userRole === 'student' && (!createForm.courseId && !createForm.courseName))
                    }
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCreating ? 'Creating...' : 'Create Gift Card'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && giftCardToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Delete Gift Card
                </h3>
                <button
                  onClick={handleCancelDelete}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete this gift card? This action cannot be undone.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm">
                    <p><strong>Card Number:</strong> {giftCardToDelete.cardNumber}</p>
                    <p><strong>Amount:</strong> {formatCurrency(giftCardToDelete.amount)}</p>
                    <p><strong>Recipient:</strong> {giftCardToDelete.recipient?.name || 'Unknown'}</p>
                    <p><strong>Type:</strong> {giftCardToDelete.type?.replace('_', ' ') || 'Unknown'}</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Warning:</strong> This will remove {formatCurrency(giftCardToDelete.amount)} from the recipient's account and delete the gift card permanently.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Gift Card'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGiftCards;
