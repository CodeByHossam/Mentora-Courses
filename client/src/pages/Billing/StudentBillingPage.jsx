import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  Calendar,
  Gift,
  BookOpen,
  ShoppingCart,
  RefreshCw,
  AlertCircle,
  XCircle
} from "lucide-react";
import {
  useGetBillingAccountQuery,
} from "../../store/services/billingApi";

const StudentBillingPage = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  // 📦 ULTRA SIMPLIFIED - No complex state needed

  // API hooks
  const {
    data: billingData,
    isLoading: billingLoading,
    error: billingError,
    refetch: refetchBilling,
  } = useGetBillingAccountQuery();

  // 📦 ULTRA SIMPLIFIED: Students only need annual fees and gift cards
  const studentAccount = billingData?.data?.account || billingData?.account || {
    totalCoursePurchases: 0,
    annualFees: 0,
    giftCards: [],
    coursePurchases: []
  };

  const availableGiftCards = studentAccount?.giftCards?.filter(c => !c.isUsed) || [];
  const usedGiftCards = studentAccount?.giftCards?.filter(c => c.isUsed) || [];

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // 📦 ULTRA SIMPLIFIED - No transaction filtering needed

  if (!user || user.role !== 'student') {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary mb-2">Access Denied</h2>
          <p className="text-secondary mb-4">Student privileges required to access this page</p>
        </div>
      </div>
    );
  }

  if (billingLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  if (billingError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-2">Error loading billing data</p>
          <p className="text-gray-600 mb-4">{billingError?.data?.message || "Please try again"}</p>
          <button
            onClick={() => refetchBilling()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Billing</h1>
          <p className="text-gray-600">Manage your annual subscription and gift cards</p>
        </div>

        {/* Main Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Annual Subscription Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-orange-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Annual Subscription</h3>
                <p className="text-sm text-gray-600">Your yearly platform fee</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-4xl font-bold text-orange-600 mb-2">
                {formatCurrency(studentAccount?.annualFees || 0)}
              </p>
              {(studentAccount?.annualFees || 0) === 0 && (
                <p className="text-sm text-green-600">✓ No annual fee required</p>
              )}
            </div>

            {(studentAccount?.annualFees || 0) > 0 && (
              <button
                onClick={() => navigate('/student/annual-fee-payment')}
                className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
              >
                Pay Annual Fee
              </button>
            )}
          </div>

          {/* Gift Cards Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-green-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Gift className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Gift Cards</h3>
                <p className="text-sm text-gray-600">Course-specific gift cards</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-4xl font-bold text-green-600 mb-2">
                {availableGiftCards.length}
              </p>
              <p className="text-sm text-gray-600">Available gift cards</p>
            </div>

            {availableGiftCards.length > 0 && (
              <button
                onClick={() => navigate('/student/gift-cards')}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                View Gift Cards
              </button>
            )}
          </div>

          {/* Total Spent Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Spent</h3>
                <p className="text-sm text-gray-600">All-time course purchases</p>
              </div>
            </div>

            <div>
              <p className="text-4xl font-bold text-blue-600 mb-2">
                {formatCurrency(studentAccount?.totalCoursePurchases || 0)}
              </p>
              <p className="text-sm text-gray-600">
                {studentAccount?.coursePurchases?.length || 0} courses purchased
              </p>
            </div>
          </div>

          {/* Course Purchases Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-purple-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Courses</h3>
                <p className="text-sm text-gray-600">Your learning journey</p>
              </div>
            </div>

            <div>
              <p className="text-4xl font-bold text-purple-600 mb-2">
                {studentAccount?.coursePurchases?.length || 0}
              </p>
              <p className="text-sm text-gray-600">Total courses enrolled</p>
            </div>
          </div>
        </div>

        {/* Available Gift Cards List */}
        {availableGiftCards.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Gift className="w-5 h-5 mr-2 text-green-600" />
              Available Gift Cards
            </h3>
            <div className="space-y-3">
              {availableGiftCards.map((card, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{card.courseName}</p>
                    <p className="text-sm text-gray-600">
                      {card.type === 'refund' ? '🔄 Refund' : '🎁 Gift'} • 
                      Issued: {formatDate(card.issuedAt)}
                      {card.expiryDate && ` • Expires: ${formatDate(card.expiryDate)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(card.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Course Purchases */}
        {studentAccount?.coursePurchases && studentAccount.coursePurchases.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
              Recent Course Purchases
            </h3>
            <div className="space-y-3">
              {studentAccount.coursePurchases.slice(-5).reverse().map((purchase, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Course Purchase</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(purchase.purchaseDate)} • 
                      {purchase.paymentMethod === 'gift_card' ? ' 🎁 Gift Card' : 
                       purchase.paymentMethod === 'stripe' ? ' 💳 Card' :
                       purchase.paymentMethod === 'paypal' ? ' 🅿️ PayPal' : ' 🏦 Direct Transfer'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(purchase.purchaseAmount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!studentAccount?.coursePurchases || studentAccount.coursePurchases.length === 0) && (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Courses Yet</h3>
            <p className="text-gray-600 mb-6">Start your learning journey by enrolling in a course!</p>
            <button
              onClick={() => navigate('/courses')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Browse Courses
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentBillingPage;
