import React, { useState } from 'react';
import { 
  Gift, 
  Eye, 
  EyeOff, 
  Calendar, 
  DollarSign, 
  Award, 
  CreditCard,
  Star,
  Sparkles,
  Heart,
  Trophy,
  Zap
} from 'lucide-react';
import { useGetUserGiftCardsQuery } from '../store/services/billingApi';

const StudentGiftCards = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showCardNumbers, setShowCardNumbers] = useState({});
  const [filters, setFilters] = useState({
    giftCardType: 'all',
    isActive: 'all'
  });

  const {
    data: giftCardsData,
    isLoading,
    error,
    refetch
  } = useGetUserGiftCardsQuery({
    page: currentPage,
    limit: 10,
    isActive: filters.isActive !== 'all' ? filters.isActive === 'active' : undefined,
    giftCardType: filters.giftCardType !== 'all' ? filters.giftCardType : undefined
  });

  const giftCards = giftCardsData?.data || [];
  const pagination = giftCardsData?.pagination || {};
  const stats = giftCardsData?.stats || {};
  const totalValue = stats.totalValue || 0;

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

  const toggleCardVisibility = (cardId) => {
    setShowCardNumbers(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const maskCardNumber = (cardNumber) => {
    if (!cardNumber) return '****-****-****';
    return `****-****-${cardNumber.slice(-4)}`;
  };

  const getCardTypeIcon = (type) => {
    const iconMap = {
      admin_issued: <Gift className="w-5 h-5" />,
      welcome_bonus: <Star className="w-5 h-5" />,
      commission_reward: <DollarSign className="w-5 h-5" />,
      referral_bonus: <Heart className="w-5 h-5" />,
      achievement_reward: <Trophy className="w-5 h-5" />,
      promotional: <Sparkles className="w-5 h-5" />,
      compensation: <Award className="w-5 h-5" />
    };
    return iconMap[type] || <Gift className="w-5 h-5" />;
  };

  const getCardTypeColor = (type) => {
    const colorMap = {
      admin_issued: 'bg-gradient-to-br from-sky-500 to-sky-600',
      welcome_bonus: 'bg-gradient-to-br from-green-500 to-green-600',
      commission_reward: 'bg-gradient-to-br from-purple-500 to-purple-600',
      referral_bonus: 'bg-gradient-to-br from-pink-500 to-pink-600',
      achievement_reward: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
      promotional: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      compensation: 'bg-gradient-to-br from-red-500 to-red-600'
    };
    return colorMap[type] || 'bg-gradient-to-br from-gray-500 to-gray-600';
  };

  const getStatusColor = (isActive, expiryDate) => {
    if (!isActive) return 'bg-red-100 text-red-800';
    if (expiryDate && new Date(expiryDate) < new Date()) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (isActive, expiryDate) => {
    if (!isActive) return 'Inactive';
    if (expiryDate && new Date(expiryDate) < new Date()) return 'Expired';
    return 'Active';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Gift Cards</h2>
            <p className="text-red-600 mb-4">Unable to load your gift cards. Please try again.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-white p-4 shadow rounded-xl">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Gift className="w-8 h-8 text-sky-600" />
            My Gift Cards
          </h1>
          <p className="text-gray-600 mt-2">View gift cards and rewards issued by administrators</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Gift Cards</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalCards || 0}</p>
              </div>
              <div className="p-3 bg-sky-100 rounded-full">
                <Gift className="w-6 h-6 text-sky-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Cards</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.activeCards || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
              <select
                value={filters.giftCardType}
                onChange={(e) => setFilters(prev => ({ ...prev, giftCardType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="admin_issued">Admin Issued</option>
                <option value="welcome_bonus">Welcome Bonus</option>
                <option value="achievement_reward">Achievement Reward</option>
                <option value="promotional">Promotional</option>
                <option value="compensation">Compensation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <select
                value={filters.isActive}
                onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Gift Cards */}
        {giftCards.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Gift Cards Yet</h3>
            <p className="text-gray-600 mb-6">You don't have any gift cards yet. Administrators may issue gift cards as rewards or bonuses.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {giftCards.map((card, index) => (
              <div key={card._id || index} className="relative">
                {/* Gift Card */}
                <div className={`${getCardTypeColor(card.type || 'admin_issued')} rounded-2xl shadow-xl p-6 text-white relative overflow-hidden`}>
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-full"></div>
                    <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white rounded-full"></div>
                  </div>

                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                      {getCardTypeIcon(card.type)}
                      <span className="text-sm font-medium opacity-90">
                        {card.type?.replace('_', ' ').toUpperCase() || 'GIFT CARD'}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(card.isActive, card.expiryDate)}`}>
                      {getStatusText(card.isActive, card.expiryDate)}
                    </span>
                  </div>

                  {/* Gift Card ID */}
                  <div className="mb-4">
                    <p className="text-sm opacity-75 mb-1">Gift Card ID</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-lg">
                        {showCardNumbers[card._id || index] ? (card._id || `GC-${index + 1}`) : `****-****-${String(card._id || index).slice(-4)}`}
                      </p>
                      <button
                        onClick={() => toggleCardVisibility(card._id || index)}
                        className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                      >
                        {showCardNumbers[card._id || index] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="mb-4">
                    <p className="text-sm opacity-75 mb-1">Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(card.amount)}</p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-sm opacity-75">
                    <div>
                      <p>Issued</p>
                      <p>{formatDate(card.issuedAt || card.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p>Type</p>
                      <p>{card.type?.replace('_', ' ') || 'Gift Card'}</p>
                    </div>
                  </div>
                </div>

                {/* Card Details */}
                <div className="bg-white rounded-xl shadow-lg p-4 mt-4">
                  <div className="space-y-2 text-sm">
                    {card.description && (
                      <div>
                        <span className="font-medium text-gray-700">Description: </span>
                        <span className="text-gray-600">{card.description}</span>
                      </div>
                    )}
                    {card.customNote && (
                      <div>
                        <span className="font-medium text-gray-700">Note: </span>
                        <span className="text-gray-600">{card.customNote}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">Status: </span>
                      <span className={`font-medium ${card.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {card.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Issued by: </span>
                      <span className="text-gray-600">Administrator</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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
                      ? 'bg-sky-600 text-white'
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
    </div>
  );
};

export default StudentGiftCards;
