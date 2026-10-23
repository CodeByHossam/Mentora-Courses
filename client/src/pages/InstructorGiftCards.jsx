import React, { useState } from 'react';
import { Gift, Calendar, DollarSign, Clock, CheckCircle, AlertCircle, Plus, Eye, EyeOff } from 'lucide-react';
import { useGetUserGiftCardsQuery, useClaimGiftCardMutation } from '../store/services/billingApi';
import { toast } from 'react-toastify';

const InstructorGiftCards = () => {
  const [showCardNumbers, setShowCardNumbers] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    isActive: 'all', // all, active, expired
    giftCardType: 'all' // all, welcome_bonus, commission_reward, etc.
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

  const [claimGiftCard, { isLoading: isClaiming }] = useClaimGiftCardMutation();

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

  const maskCardNumber = (cardNumber) => {
    if (!cardNumber) return 'N/A';
    return `****-****-****-${cardNumber.slice(-4)}`;
  };

  const toggleCardVisibility = (cardId) => {
    setShowCardNumbers(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const getStatusColor = (isActive, expiryDate, isRedeemed) => {
    if (isRedeemed) return 'text-gray-600 bg-gray-100';
    if (!isActive) return 'text-red-600 bg-red-100';
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 7) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusText = (isActive, expiryDate, isRedeemed) => {
    if (isRedeemed) return 'Claimed';
    if (!isActive) return 'Expired';
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 0) return 'Expired';
    if (daysUntilExpiry <= 7) return `Expires in ${daysUntilExpiry} days`;
    return 'Active';
  };

  const getCardTypeIcon = (type) => {
    switch (type) {
      case 'welcome_bonus':
        return <Gift className="w-4 h-4" />;
      case 'commission_reward':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  const getCardTypeColor = (type, isRedeemed) => {
    if (isRedeemed) return 'bg-gradient-to-r from-gray-400 to-gray-500';
    switch (type) {
      case 'welcome_bonus':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'commission_reward':
        return 'bg-gradient-to-r from-emerald-500 to-blue-500';
      case 'compensation':
        return 'bg-gradient-to-r from-orange-500 to-red-500';
      default:
        return 'bg-gradient-to-r from-indigo-500 to-purple-500';
    }
  };

  const handleClaimGiftCard = async (cardId) => {
    try {
      await claimGiftCard(cardId).unwrap();
      toast.success('Gift card claimed successfully! Amount added to your pending commissions.');
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to claim gift card');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Gift Cards</h3>
            <p className="text-gray-600 mb-4">There was an error loading your gift cards.</p>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const giftCards = giftCardsData?.data || [];
  const pagination = giftCardsData?.pagination || {};
  const stats = giftCardsData?.stats || {};
  const totalValue = stats.totalValue || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Gift className="w-8 h-8 text-purple-600" />
                My Gift Cards
              </h1>
              <p className="text-gray-600 mt-2">View gift cards and rewards issued by administrators</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Active Value</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalValue)}</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Gift className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Cards</p>
                  <p className="text-xl font-bold text-gray-900">{stats.totalCards || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Cards</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.activeCards || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expiring Soon</p>
                  <p className="text-xl font-bold text-gray-900">
                    {giftCards.filter(card => {
                      if (!card.isActive) return false;
                      const daysUntilExpiry = Math.ceil((new Date(card.expiryDate || card.issuedAt) - new Date()) / (1000 * 60 * 60 * 24));
                      return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
                    }).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.isActive}
                  onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Cards</option>
                  <option value="active">Active Only</option>
                  <option value="expired">Expired Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filters.giftCardType}
                  onChange={(e) => setFilters(prev => ({ ...prev, giftCardType: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="welcome_bonus">Welcome Bonus</option>
                  <option value="commission_reward">Commission Reward</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Gift Cards Grid */}
        {giftCards.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Gift Cards Found</h3>
            <p className="text-gray-600 mb-6">You don't have any gift cards yet. Administrators may issue gift cards as rewards or bonuses.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {giftCards.map((card, index) => (
              <div key={card._id || index} className="relative">
                {/* Gift Card */}
                <div className={`${getCardTypeColor(card.giftCardType || card.type || 'gift_card', card.isRedeemed)} rounded-2xl shadow-xl p-6 text-white relative overflow-hidden ${card.isRedeemed ? 'opacity-75' : ''}`}>
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-full"></div>
                    <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white rounded-full"></div>
                  </div>

                  {/* Card Content */}
                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {getCardTypeIcon(card.giftCardType || card.type)}
                        <span className="text-sm font-medium opacity-90">
                          {(card.giftCardType || card.type)?.replace('_', ' ').toUpperCase() || 'GIFT CARD'}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(card.isActive, card.expiryDate, card.isRedeemed)}`}>
                        {getStatusText(card.isActive, card.expiryDate, card.isRedeemed)}
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
                    {card.isRedeemed && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <span className="font-medium text-gray-700">Claimed on: </span>
                        <span className="text-gray-600">{formatDate(card.redeemedAt || card.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Claim Button */}
                  {!card.isRedeemed && card.isActive && (
                    <button
                      onClick={() => handleClaimGiftCard(card._id)}
                      disabled={isClaiming}
                      className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {isClaiming ? 'Claiming...' : `Claim ${formatCurrency(card.amount)}`}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
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
    </div>
  );
};

export default InstructorGiftCards;
