import React from "react";

const InstructorBillingPageView = (props) => {
  return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            Instructor privileges required to access this page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                👨‍🏫 Instructor Earnings Dashboard
              </h1>
              <p className="text-gray-600">
                Track your course earnings, student progress, and payout history
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => refetchBilling()}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Financial Management Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Wallet className="w-6 h-6 mr-2 text-emerald-600" />
              Financial Management
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => navigate("/instructor/refunds")}
                className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Request Refund
              </button>
              <button
                onClick={() => navigate("/instructor/gift-cards")}
                className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Gift className="w-5 h-5 mr-2" />
                Gift Cards
              </button>
              {/* Payout request button removed - admin pays directly now */}
              <div className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-600 rounded-lg border border-gray-300">
                <Clock className="w-5 h-5 mr-2" />
                <span className="text-sm">Admin pays directly (monthly or at $1000)</span>
              </div>
              {/* Annual Fee Payment */}
              <button
                onClick={() => navigate("/instructor/annual-fee-payment")}
                className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Annual Fee Payment
              </button>
            </div>
          </div>

          {/* Error State */}
          {billingError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    API Connection Error
                  </h3>
                  <p className="text-red-700 mb-4">
                    Unable to load earnings data. Showing demo data for
                    interface preview.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Comprehensive Financial Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* What You Have (Green Border) */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-green-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Wallet className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Your Earnings
                  </h3>
                  <p className="text-sm text-gray-600">
                    Available funds and commissions
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Total Gift Cards & Admin Credits */}
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <Gift className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Total Gift Cards & Admin Credits
                      </p>
                      <p className="text-sm text-gray-600">
                        Gift cards + credits added by admin
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(instructorAccount?.totalGiftAmount || 0)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Total Gift Cards & Bonuses
                    </p>
                  </div>
                </div>

                {/* Pending Commissions */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Pending Commissions
                      </p>
                      <p className="text-sm text-gray-600">Unpaid commissions (ready for payout)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(
                        instructorAccount?.pendingCommissions || 0
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      History: {formatCurrency(instructorAccount?.totalCommissionEarned || 0)}
                    </p>
                  </div>
                </div>

                {/* Welcome Credits removed - simplified system */}
              </div>
            </div>

            {/* What You Owe (Orange/Red Border) */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-orange-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Outstanding Amounts
                  </h3>
                  <p className="text-sm text-gray-600">Fees and payments due</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Admin fees removed from UI per product decision. Only annual fees remain. */}

                {/* Pending Payouts */}
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Total Payouts Received
                      </p>
                      <p className="text-sm text-gray-600">
                        Already paid by admin
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(instructorAccount?.totalPayoutsReceived || 0)}
                    </p>
                  </div>
                </div>

                {/* Annual Fees */}
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-gray-900">Annual Fees</p>
                      <p className="text-sm text-gray-600">
                        Yearly platform fee
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-600">
                      {formatCurrency(instructorAccount?.annualFees || 0)}
                    </p>
                    {(instructorAccount?.annualFees || 0) > 0 && (
                      <button
                        onClick={() => navigate("/instructor/annual-fee-payment")}
                        className="mt-2 px-3 py-1 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Pay Annual Fee
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
            </div>
          </div>

          {/* Available Balance Formula Breakdown */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-emerald-600" />
              💰 Available Balance Calculation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Formula */}
              <div className="space-y-4">
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <h4 className="font-semibold text-emerald-800 mb-2">
                    Complete Formula:
                  </h4>
                  <p className="text-emerald-700 font-mono text-xs leading-relaxed">
                    Available Balance = pendingCommissions + totalGiftAmount - annualFees
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    Simplified:
                  </h4>
                  <p className="text-blue-700 font-mono text-sm">
                    {formatCurrency(totalYourEarnings)} -{" "}
                    {formatCurrency(totalDeductions)} ={" "}
                    {formatCurrency(correctAvailableBalance)}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2">
                    Breakdown:
                  </h4>
                  <div className="text-purple-700 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Pending Commissions:</span>
                      <span>
                        {formatCurrency(
                          instructorAccount?.pendingCommissions || 0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gift Cards & Admin Credits:</span>
                      <span>
                        {formatCurrency(instructorAccount?.totalGiftAmount || 0)}
                      </span>
                    </div>
                    <div className="border-t border-purple-300 pt-1 mt-1">
                      <div className="flex justify-between font-semibold">
                        <span>Total Earnings:</span>
                        <span className="text-green-600">
                          {formatCurrency(totalYourEarnings)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>- Annual Fees:</span>
                      <span>
                        (
                        {formatCurrency(instructorAccount?.annualFees || 0)}
                        )
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2 pt-2 border-t">
                      <span>Total Paid Out (History):</span>
                      <span>
                        {formatCurrency(
                          instructorAccount?.totalPayoutsReceived || 0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 ml-4">
                      <span>
                        {" "}
                        • Total Paid:{" "}
                        {formatCurrency(
                          instructorAccount?.totalAdminFeesPaid || 0
                        )}{" "}
                        (for reporting)
                      </span>
                    </div>
                    <div className="border-t border-purple-300 pt-1 mt-1">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Available Balance:</span>
                        <span
                          className={
                            correctAvailableBalance >= 0
                              ? "text-emerald-600"
                              : "text-red-600"
                          }
                        >
                          {formatCurrency(correctAvailableBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Balance Display */}
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Your Available Balance
                  </p>
                  <p
                    className={`text-4xl font-bold mb-2 ${
                      correctAvailableBalance >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {showBalance
                      ? formatCurrency(correctAvailableBalance)
                      : "••••••"}
                  </p>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    {showBalance ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    {showBalance ? "Hide" : "Show"} Balance
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Available Balance */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Available Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {showBalance
                      ? formatCurrency(correctAvailableBalance)
                      : "••••••"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Total Earnings - Outstanding Amounts
                  </p>
                </div>
              </div>
            </div>

            {/* Monthly Earnings */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(instructorAccount?.monthlyEarnings || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Outstanding Fees */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Outstanding Fees</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(instructorAccount?.outstanding || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Courses Sold */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Courses Sold</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {instructorAccount?.courseSales || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Available Balance */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Wallet className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Available Balance</p>
                  <div className="flex items-center gap-2">
                    {showBalance ? (
                      <p className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(instructorMetrics.availableBalance)}
                      </p>
                    ) : (
                      <p className="text-2xl font-bold text-gray-400">••••••</p>
                    )}
                    <button
                      onClick={() => setShowBalance(!showBalance)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {showBalance ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">
                Ready for withdrawal
              </span>
            </div>
          </div>

          {/* Monthly Earnings */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Monthly Earnings</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(instructorMetrics.monthlyEarnings)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">
                +{formatPercentage(instructorMetrics.monthlyGrowth)} from last
                month
              </span>
            </div>
          </div>

          {/* Total Commissions */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Commissions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(instructorMetrics.totalCommissions)}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Lifetime earnings</p>
          </div>

          {/* Pending Payouts */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Payouts</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(instructorMetrics.totalPayoutsReceived)}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Processing withdrawals</p>
          </div>

          {/* Outstanding Admin Fees */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Annual Fees</p>
                <p
                  className={`text-2xl font-bold ${
                    instructorMetrics.annualFees > 0
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {formatCurrency(instructorMetrics.annualFees)}
                </p>
              </div>
            </div>
            {instructorMetrics.annualFees > 0 ? (
              <button
                onClick={() => navigate("/instructor/admin-fee-payment")}
                className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Upload className="w-4 h-4" />
                Pay Fees
              </button>
            ) : (
              <p className="text-sm text-green-600 text-center">
                All fees paid
              </p>
            )}
          </div>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Earnings Trends Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                📈 Monthly Earnings Trend
              </h3>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {filteredEarningsByMonth.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      {item.month}
                    </span>
                    <span className="text-gray-600">
                      {formatCurrency(item.earnings)}
                    </span>
                  </div>
                  <div className="flex gap-1 h-3">
                    <div
                      className="bg-emerald-500 rounded-sm"
                      style={{
                        width: `${
                          (item.earnings /
                            Math.max(
                              ...earningsByMonth.map((r) => r.earnings)
                            )) *
                          80
                        }%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{item.students} students</span>
                    <span>{item.courses} courses</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Courses */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                🏆 Top Performing Courses
              </h3>
              <BookOpen className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {topCourses.map((course, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {course.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{course.students} students</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span>{course.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600 text-sm">
                      {formatCurrency(course.earnings)}
                    </p>
                    <p className="text-xs text-gray-500">This month</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Course Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="p-3 bg-blue-100 rounded-xl w-fit mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {instructorMetrics.totalCourses}
            </p>
            <p className="text-sm text-gray-600">Total Courses</p>
            <p className="text-xs text-green-600 mt-1">All published</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="p-3 bg-green-100 rounded-xl w-fit mx-auto mb-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {instructorMetrics.totalStudents}
            </p>
            <p className="text-sm text-gray-600">Total Students</p>
            <p className="text-xs text-gray-500 mt-1">Across all courses</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="p-3 bg-yellow-100 rounded-xl w-fit mx-auto mb-4">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {instructorMetrics.averageRating}
            </p>
            <p className="text-sm text-gray-600">Average Rating</p>
            <p className="text-xs text-gray-500 mt-1">
              {instructorMetrics.totalReviews} reviews
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="p-3 bg-purple-100 rounded-xl w-fit mx-auto mb-4">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatPercentage(instructorMetrics.conversionRate)}
            </p>
            <p className="text-sm text-gray-600">Conversion Rate</p>
            <p className="text-xs text-green-600 mt-1">+5.2% this month</p>
          </div>
        </div>

        {/* Recent Course Sales */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              💰 Recent Course Sales
            </h3>
            <button
              onClick={() => navigate("/instructor/courses")}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              View All Courses →
            </button>
          </div>
          <div className="space-y-4">
            {recentSales.map((sale, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <PlayCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{sale.course}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Student: {sale.student}</span>
                      <span>{formatDate(sale.date)}</span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs capitalize">
                        {sale.method.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-emerald-600">
                    +{formatCurrency(sale.commission)}
                  </p>
                  <p className="text-sm text-gray-500">
                    From {formatCurrency(sale.amount)} sale
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Transactions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              💳 All Transactions
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <select
                value={transactionFilter}
                onChange={(e) => setTransactionFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="credit">Credits</option>
                <option value="debit">Debits</option>
                <option value="gift_card">🎁 Gift Cards</option>
                <option value="commission">💰 Commissions</option>
                <option value="instructor_payout">📤 Payouts</option>
              </select>
            </div>
          </div>

          {billingLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No transactions found</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => {
                  // Check if this is a gift card transaction
                  const isGiftCard =
                    transaction.category === "credit_addition" ||
                    transaction.description
                      ?.toLowerCase()
                      .includes("gift card") ||
                    transaction.description?.toLowerCase().includes("gift") ||
                    transaction.description?.toLowerCase().includes("bonus") ||
                    transaction.description?.toLowerCase().includes("refund") ||
                    transaction.description
                      ?.toLowerCase()
                      .includes("welcome") ||
                    transaction.description
                      ?.toLowerCase()
                      .includes("loyalty") ||
                    transaction.description
                      ?.toLowerCase()
                      .includes("compensation") ||
                    transaction.description
                      ?.toLowerCase()
                      .includes("promotional") ||
                    (transaction.metadata &&
                      transaction.metadata.giftCardType) ||
                    transaction.giftAmountRecord === true;

                  const isCommission =
                    transaction.category === "commission" ||
                    transaction.description
                      ?.toLowerCase()
                      .includes("commission") ||
                    transaction.description?.toLowerCase().includes("earning");

                  const isPayout =
                    transaction.category === "instructor_payout" ||
                    transaction.description?.toLowerCase().includes("payout") ||
                    transaction.description
                      ?.toLowerCase()
                      .includes("withdrawal");

                  return (
                    <div
                      key={transaction._id}
                      className={`flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200 ${
                        isGiftCard
                          ? "border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50"
                          : isCommission
                          ? "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50"
                          : isPayout
                          ? "border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-lg ${
                            isGiftCard
                              ? "bg-purple-100"
                              : isCommission
                              ? "bg-green-100"
                              : isPayout
                              ? "bg-blue-100"
                              : transaction.type === "credit"
                              ? "bg-green-100"
                              : "bg-red-100"
                          }`}
                        >
                          {isGiftCard ? (
                            <Gift className="w-4 h-4 text-purple-600" />
                          ) : isCommission ? (
                            <DollarSign className="w-4 h-4 text-green-600" />
                          ) : isPayout ? (
                            <Send className="w-4 h-4 text-blue-600" />
                          ) : transaction.type === "credit" ? (
                            <ArrowUpRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {transaction.description}
                            </p>
                            {isGiftCard && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                🎁 Gift Card
                              </span>
                            )}
                            {isCommission && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                💰 Commission
                              </span>
                            )}
                            {isPayout && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                📤 Payout
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{formatDate(transaction.createdAt)}</span>
                            <span className="capitalize">
                              {transaction.category}
                            </span>
                            {transaction.metadata?.giftCardType && (
                              <span className="text-purple-600 font-medium">
                                {transaction.metadata.giftCardType.replace(
                                  "_",
                                  " "
                                )}
                              </span>
                            )}
                            {transaction.metadata?.paymentMethod && (
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                {transaction.metadata.paymentMethod}
                              </span>
                            )}
                          </div>
                          {transaction.metadata?.customNote && (
                            <p className="text-xs text-gray-600 mt-1 italic">
                              "{transaction.metadata.customNote}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            isGiftCard
                              ? "text-purple-600"
                              : isCommission
                              ? "text-green-600"
                              : isPayout
                              ? "text-blue-600"
                              : transaction.type === "credit"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.type === "credit" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          {transaction.status}
                        </p>
                        {transaction.metadata?.issuedBy && (
                          <p className="text-xs text-gray-400">
                            by {transaction.metadata.issuedBy.name}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Transaction Count Info */}
              {transactions.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600">
                    Showing {transactions.length} recent transactions
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
  );
};

export default InstructorBillingPageView;
