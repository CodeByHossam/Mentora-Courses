import React, { useState } from 'react';
import { 
  Gift, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  User, 
  Mail, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Eye,
  Download,
  RefreshCw,
  Trash2,
  Edit3
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { 
  useAddGiftCardMutation, 
  useGetGiftCardHistoryQuery 
} from '../store/services/billingApi';

/**
 * ADMIN GIFT CARD MANAGER COMPONENT
 * 
 * Comprehensive gift card management system for administrators to:
 * - Issue gift cards to students and instructors
 * - View gift card history with filtering
 * - Track gift card usage and statistics
 * - Manage different gift card types (gift, refund, bonus, etc.)
 */
const AdminGiftCardManager = () => {
  // 📋 FORM STATE MANAGEMENT
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    userEmail: '',
    amount: '',
    giftCardType: 'gift_card',
    customNote: '',
    expiryDate: '',
    isActive: true
  });

  // 🔍 FILTERING AND SEARCH STATE
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    giftCardType: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    isActive: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  // 📊 API HOOKS
  const [addGiftCard, { isLoading: isAdding }] = useAddGiftCardMutation();
  const { 
    data: giftCardData, 
    isLoading: isLoadingHistory, 
    error: historyError,
    refetch: refetchHistory 
  } = useGetGiftCardHistoryQuery(filters);

  // 🎁 GIFT CARD TYPE OPTIONS
  const giftCardTypes = [
    { value: 'gift_card', label: '🎁 Gift Card', description: 'Promotional credits for users' },
    { value: 'refund', label: '💰 Refund', description: 'Refund credits for course returns' },
    { value: 'bonus', label: '🌟 Bonus', description: 'Performance or loyalty bonuses' },
    { value: 'compensation', label: '🔧 Compensation', description: 'Service issue compensation' },
    { value: 'promotional', label: '🎉 Promotional', description: 'Marketing campaign credits' },
    { value: 'welcome', label: '👋 Welcome Bonus', description: 'New user welcome credits' },
    { value: 'loyalty', label: '💎 Loyalty Reward', description: 'Loyalty program rewards' },
    { value: 'custom', label: '✨ Custom', description: 'Any other reason specified by admin' }
  ];

  // 📝 FORM HANDLERS
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  // 🎯 SUBMIT GIFT CARD
  const handleSubmitGiftCard = async (e) => {
    e.preventDefault();
    
    try {
      const result = await addGiftCard(formData).unwrap();
      
      // Show success message
      toast.success(`Gift card of $${formData.amount} successfully added to ${result.giftCard.recipient.name}'s account!`);
      
      // Reset form
      setFormData({
        userId: '',
        userEmail: '',
        amount: '',
        giftCardType: 'gift_card',
        customNote: '',
        expiryDate: '',
        isActive: true
      });
      setShowAddForm(false);
      
      // Refresh history
      refetchHistory();
      
    } catch (error) {
      console.error('Failed to add gift card:', error);
      toast.error(`Failed to add gift card: ${error.data?.message || error.message}`);
    }
  };

  // 📄 PAGINATION HANDLERS
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // 🧹 CLEAR FILTERS
  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      giftCardType: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
    });
    setSearchTerm('');
  };

  // 📊 GET STATISTICS
  const students = Array.isArray(studentsData?.students) ? studentsData.students : [];
  const statistics = giftCardData?.statistics || {
    totalAmount: 0,
    averageAmount: 0,
    totalCount: 0,
    typeBreakdown: []
  };

  const giftCards = giftCardData?.giftCards || [];
  const pagination = giftCardData?.pagination || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 🎯 HEADER SECTION */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <Gift className="w-8 h-8 text-purple-600 mr-3" />
                Gift Card Manager
              </h1>
              <p className="text-gray-600">
                Issue and manage gift cards for students and instructors
              </p>
            </div>
            
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Gift Card
            </button>
          </div>
        </div>

        {/* 📊 STATISTICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Issued</p>
                <p className="text-2xl font-bold text-purple-600">${statistics.totalAmount.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gift Cards</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.totalCount}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Gift className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Amount</p>
                <p className="text-2xl font-bold text-green-600">${statistics.averageAmount.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Most Popular</p>
                <p className="text-lg font-bold text-orange-600">
                  {statistics.typeBreakdown[0]?._id || 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Eye className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 🎁 ADD GIFT CARD FORM */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Plus className="w-5 h-5 text-purple-600 mr-2" />
              Issue New Gift Card
            </h2>
            
            <form onSubmit={handleSubmitGiftCard} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Identification */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    User ID (Optional)
                  </label>
                  <input
                    type="text"
                    name="userId"
                    value={formData.userId}
                    onChange={handleInputChange}
                    placeholder="Enter user ID"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    User Email
                  </label>
                  <input
                    type="email"
                    name="userEmail"
                    value={formData.userEmail}
                    onChange={handleInputChange}
                    placeholder="Enter user email"
                    required={!formData.userId}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Amount
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0.01"
                    max="10000"
                    step="0.01"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Gift Card Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Gift className="w-4 h-4 inline mr-1" />
                    Gift Card Type
                  </label>
                  <select
                    name="giftCardType"
                    value={formData.giftCardType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {giftCardTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Note */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Note (Optional)
                  </label>
                  <textarea
                    name="customNote"
                    value={formData.customNote}
                    onChange={handleInputChange}
                    placeholder="Add a custom note for this gift card..."
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700">
                    Active Gift Card
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center disabled:opacity-50"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Issuing...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Issue Gift Card
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 🔍 FILTERS AND SEARCH */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search gift cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Type Filter */}
              <select
                name="giftCardType"
                value={filters.giftCardType}
                onChange={handleFilterChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                {giftCardTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              {/* Amount Range */}
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  name="minAmount"
                  value={filters.minAmount}
                  onChange={handleFilterChange}
                  placeholder="Min $"
                  className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  name="maxAmount"
                  value={filters.maxAmount}
                  onChange={handleFilterChange}
                  placeholder="Max $"
                  className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-800 transition-colors flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Clear Filters
              </button>
              
              <button
                onClick={() => refetchHistory()}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* 📋 GIFT CARD HISTORY */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Gift className="w-5 h-5 text-purple-600 mr-2" />
              Gift Card History
            </h2>
          </div>

          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <span className="ml-2 text-gray-600">Loading gift cards...</span>
            </div>
          ) : historyError ? (
            <div className="flex items-center justify-center py-12 text-red-600">
              <AlertCircle className="w-8 h-8 mr-2" />
              <span>Failed to load gift card history</span>
            </div>
          ) : giftCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Gift className="w-16 h-16 mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Gift Cards Found</h3>
              <p>No gift cards match your current filters.</p>
            </div>
          ) : (
            <>
              {/* Gift Cards Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Issued Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Issued By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {giftCards.map((giftCard) => (
                      <tr key={giftCard.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <User className="w-5 h-5 text-purple-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {giftCard.recipient.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {giftCard.recipient.email}
                              </div>
                              <div className="text-xs text-gray-400 capitalize">
                                {giftCard.recipient.role}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-semibold text-green-600">
                            ${giftCard.amount.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {giftCardTypes.find(t => t.value === giftCard.type)?.label || giftCard.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(giftCard.issuedAt), 'MMM dd, yyyy')}
                          <div className="text-xs text-gray-500">
                            {format(new Date(giftCard.issuedAt), 'h:mm a')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {giftCard.issuedBy.name}
                          <div className="text-xs text-gray-500">
                            {giftCard.issuedBy.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            giftCard.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {giftCard.isActive ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalGiftCards)} of{' '}
                    {pagination.totalGiftCards} gift cards
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <span className="px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-md">
                      {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminGiftCardManager;
