import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  BarChart3,
  PieChart,
  Calendar,
  CreditCard,
  Building,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  RotateCcw,
  Gift,
} from "lucide-react";
import {
  useGetAdminBillingAccountQuery,
  useGetAllPlatformTransactionsQuery,
} from "../../store/services/billingApi";
import { useGetUsersQuery, useGetAdminReportsQuery } from "../../store/services/userApi";
import { useGetCoursesQuery } from "../../store/services/courseApi";

const AdminBillingPage = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [transactionPage, setTransactionPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isDateFilterActive, setIsDateFilterActive] = useState(false);

  // 🆕 API hooks - USE ADMIN-SPECIFIC ENDPOINTS
  const {
    data: billingData,
    isLoading: billingLoading,
    error: billingError,
    refetch: refetchBilling,
  } = useGetAdminBillingAccountQuery();

  // Get real instructor data
  const {
    data: usersData,
    isLoading: usersLoading,
  } = useGetUsersQuery();

  const {
    data: adminReportsData,
    isLoading: reportsLoading,
  } = useGetAdminReportsQuery();

  // Get all courses to calculate instructor statistics
  const {
    data: coursesData,
    isLoading: coursesLoading,
  } = useGetCoursesQuery();

  // 🏆 Get billing transactions to calculate top earning instructors
  const {
    data: allTransactionsData,
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useGetAllPlatformTransactionsQuery({ page: 1, limit: 1000 }); // Get more transactions for analysis

  // 🆕 Extract admin billing data from specialized endpoint
  const adminAccount = billingData?.data?.adminAccount || {};
  const recentTransactions = billingData?.data?.recentTransactions || [];
  const earnings = billingData?.data?.earnings || {};
  const summary = billingData?.data?.summary || {};
  
  // Get all platform transactions
  const allTransactions = allTransactionsData?.data?.transactions || allTransactionsData?.transactions || [];


  // 🆕 Calculate platform metrics from admin billing account
  const platformRevenue = adminAccount?.totalRevenue || 0;
  const platformBalance = adminAccount?.platformBalance || 0;
  const totalInstructorPayouts = adminAccount?.totalInstructorPayouts || 0;
  const monthlyRevenueData = adminAccount?.monthlyRevenue || [];
  
  // Get current month revenue
  const currentMonthRevenue = monthlyRevenueData.length > 0 
    ? monthlyRevenueData[monthlyRevenueData.length - 1]?.amount || 0
    : 0;
  
  // Calculate from transactions if monthly revenue not available
  const calculatedMonthlyRevenue = allTransactions
    .filter(t => {
      if (!t || !t.createdAt) return false;
      const transactionDate = new Date(t.createdAt);
      return transactionDate.getMonth() === new Date().getMonth() && 
             transactionDate.getFullYear() === new Date().getFullYear() &&
             t.type === 'credit';
    })
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  
  const finalMonthlyRevenue = currentMonthRevenue || calculatedMonthlyRevenue;

  // Calculate total users from usersData - usersData IS the array directly
  const allUsers = Array.isArray(usersData) ? usersData : (usersData?.users || usersData?.data?.users || usersData?.data || []);
  const totalUsers = allUsers.length;
  const activeUsers = allUsers.filter(u => u?.isActive).length;
  const totalInstructors = allUsers.filter(u => u?.role === 'instructor').length;
  const totalStudents = allUsers.filter(u => u?.role === 'student').length;
  
  // Calculate pending payouts (sum of all instructors' pending commissions)
  // This would need a separate API call to get all instructor accounts
  // For now, we'll calculate from transactions that haven't been paid out yet
  const totalCommissionsEarned = allTransactions
    .filter(t => t.type === 'credit' && t.category === 'commission')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  
  const pendingPayouts = totalCommissionsEarned - totalInstructorPayouts;

  // Calculate conversion rate: (students who purchased / total students) × 100
  const studentsWhoPurchased = allTransactions.filter(t => 
    t.type === 'credit' && t.category === 'commission'
  ).length; // Each commission transaction = 1 student purchase
  
  const conversionRate = totalStudents > 0 
    ? (studentsWhoPurchased / totalStudents * 100) 
    : 0;

  const platformMetrics = {
    totalRevenue: platformRevenue,
    monthlyRevenue: finalMonthlyRevenue,
    platformBalance,
    totalInstructorPayouts,
    // Use calculated values or fallback to admin statistics
    totalUsers: totalUsers || adminAccount?.statistics?.totalUsers || 0,
    activeUsers: activeUsers || adminAccount?.statistics?.activeUsers || 0,
    totalInstructors: totalInstructors || adminAccount?.statistics?.totalInstructors || 0,
    totalStudents: totalStudents || adminAccount?.statistics?.totalStudents || 0,
    pendingPayouts: Math.max(0, pendingPayouts), // Ensure non-negative
    totalPayouts: totalInstructorPayouts,
    averageTransactionValue: allTransactions.length > 0 ? allTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) / allTransactions.length : 0,
    transactionCount: allTransactions.length,
    conversionRate: conversionRate, // Calculated from actual data
    churnRate: adminAccount?.statistics?.churnRate || 3.2,
    profitMargin: platformRevenue > 0 ? ((platformRevenue - totalInstructorPayouts) / platformRevenue * 100) : 0,
    monthlyGrowth: adminAccount?.statistics?.monthlyGrowth || 0,
  };

  // Use real monthly revenue data or show zeros
  const revenueByMonth = adminAccount?.monthlyRevenue || [
    { month: "Jan", revenue: 0, payouts: 0, profit: 0 },
    { month: "Feb", revenue: 0, payouts: 0, profit: 0 },
    { month: "Mar", revenue: 0, payouts: 0, profit: 0 },
    { month: "Apr", revenue: 0, payouts: 0, profit: 0 },
    { month: "May", revenue: 0, payouts: 0, profit: 0 },
    { month: "Jun", revenue: 0, payouts: 0, profit: 0 },
  ];

  // Process real instructor data from database
  
  // Extract instructors from users data
  const instructors = usersData?.filter(user => user.role === 'instructor') || [];
  
  // Calculate instructor statistics from courses
  const instructorStats = {};
  
  // Extract courses from the API response
  const courses = coursesData?.data || coursesData || [];
  
  if (courses && courses.length > 0) {
    courses.forEach(course => {
      const instructorId = course.instructor?._id || course.instructor;
      if (instructorId) {
        if (!instructorStats[instructorId]) {
          instructorStats[instructorId] = {
            courseCount: 0,
            totalStudents: 0,
            totalEnrollments: 0
          };
        }
        
        // Debug: Log course enrollment data
        const enrolledCount = course.enrolledStudents?.length || 
                             course.studentsEnrolled?.length || 
                             course.enrollmentCount || 
                             course.enrollments?.length ||
                             course.students?.length ||
                             course.totalEnrollments ||
                             0;
        
        console.log(`📖 Course "${course.title}" (Instructor: ${instructorId}):`, {
          enrolledStudents: course.enrolledStudents?.length,
          studentsEnrolled: course.studentsEnrolled?.length,
          enrollmentCount: course.enrollmentCount,
          enrollments: course.enrollments?.length,
          students: course.students?.length,
          totalEnrollments: course.totalEnrollments,
          finalCount: enrolledCount,
          availableFields: Object.keys(course)
        });
        
        instructorStats[instructorId].courseCount++;
        instructorStats[instructorId].totalStudents += enrolledCount;
        instructorStats[instructorId].totalEnrollments += course.enrollments?.length || 0;
      }
    });
  }
  
  // 🏆 Calculate top earning instructors from billing transactions
  
  const calculateTopInstructorsFromTransactions = () => {
    if (transactionsLoading) {
      return [
        { name: "Loading...", earnings: 0, courses: 0, students: 0, isLoading: true },
        { name: "Loading...", earnings: 0, courses: 0, students: 0, isLoading: true },
        { name: "Loading...", earnings: 0, courses: 0, students: 0, isLoading: true },
        { name: "Loading...", earnings: 0, courses: 0, students: 0, isLoading: true },
        { name: "Loading...", earnings: 0, courses: 0, students: 0, isLoading: true },
      ];
    }

    if (transactionsError) {
      return [
        { name: "Error loading data", earnings: 0, courses: 0, students: 0, isError: true },
        { name: "Error loading data", earnings: 0, courses: 0, students: 0, isError: true },
        { name: "Error loading data", earnings: 0, courses: 0, students: 0, isError: true },
        { name: "Error loading data", earnings: 0, courses: 0, students: 0, isError: true },
        { name: "Error loading data", earnings: 0, courses: 0, students: 0, isError: true },
      ];
    }

    // Fix: transactions are in data.transactions
    const transactions = allTransactionsData?.data?.transactions || allTransactionsData?.transactions || allTransactions;
    
    if (!transactions || transactions.length === 0) {
      return [
        { name: "No data available", earnings: 0, courses: 0, students: 0, isEmpty: true },
        { name: "No data available", earnings: 0, courses: 0, students: 0, isEmpty: true },
        { name: "No data available", earnings: 0, courses: 0, students: 0, isEmpty: true },
        { name: "No data available", earnings: 0, courses: 0, students: 0, isEmpty: true },
        { name: "No data available", earnings: 0, courses: 0, students: 0, isEmpty: true },
      ];
    }

    // Group transactions by userId and calculate total earnings for instructors
    const instructorEarnings = {};
    
    transactions.forEach(transaction => {
      // Look for credit transactions (instructor earnings) with commission category
      if (transaction.type === 'credit' && 
          (transaction.category === 'commission' || transaction.description?.toLowerCase().includes('commission'))) {
        
        const userId = transaction.userId?._id || transaction.userId;
        const amount = transaction.amount || 0;
        
        if (userId) {
          if (!instructorEarnings[userId]) {
            instructorEarnings[userId] = {
              totalEarnings: 0,
              transactionCount: 0,
              user: transaction.userId
            };
          }
          instructorEarnings[userId].totalEarnings += amount;
          instructorEarnings[userId].transactionCount += 1;
        }
      }
    });


    // Convert to array and sort by earnings
    const sortedInstructors = Object.entries(instructorEarnings)
      .map(([userId, data]) => {
        // Find instructor details from users data
        const instructor = instructors.find(inst => inst._id === userId);
        const instructorId = userId;
        const realStats = instructorStats[instructorId] || { courseCount: 0, totalStudents: 0 };
        
        console.log(`🔍 Matching instructor ${userId}:`, {
          found: !!instructor,
          name: instructor?.name || data.user?.name,
          realStats,
          instructorFields: instructor ? Object.keys(instructor) : 'not found'
        });
        
        // Try multiple ways to get course and student counts
        const courseCount = realStats.courseCount || 
                           instructor?.totalCourses || 
                           instructor?.coursesCreated || 
                           instructor?.courses?.length || 
                           instructor?.createdCourses?.length ||
                           instructor?.courseCount ||
                           instructor?.numberOfCourses || 0;
                           
        const studentCount = realStats.totalStudents || 
                            instructor?.totalStudents || 
                            instructor?.studentsEnrolled || 
                            instructor?.students?.length ||
                            instructor?.enrolledStudents?.length ||
                            instructor?.studentCount ||
                            instructor?.numberOfStudents || 0;
        
        console.log(`📊 Final counts for ${instructor?.name || 'Unknown'}:`, {
          courses: courseCount,
          students: studentCount,
          sources: {
            realStats: realStats,
            instructorCourses: instructor?.totalCourses,
            instructorStudents: instructor?.totalStudents
          }
        });
        
        return {
          id: userId,
          name: instructor?.name || data.user?.name || 'Unknown Instructor',
          email: instructor?.email || data.user?.email || 'No email',
          totalEarnings: data.totalEarnings,
          earnings: data.totalEarnings, // For backward compatibility
          courses: courseCount,
          students: studentCount,
          avatar: instructor?.avatar || instructor?.profilePicture,
          isActive: instructor?.isActive !== false,
          transactionCount: data.transactionCount,
          rank: 0 // Will be set below
        };
      })
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, 5)
      .map((instructor, index) => ({
        ...instructor,
        rank: index + 1
      }));


    // If no instructors with earnings, show helpful message
    if (sortedInstructors.length === 0) {
      const totalTransactions = transactions.length;
      const commissionTransactions = transactions.filter(t => 
        t.type === 'credit' && 
        (t.category === 'commission' || t.description?.toLowerCase().includes('commission'))
      ).length;
      
      return [
        { 
          name: totalTransactions === 0 ? "No transactions yet" : "No commission earnings yet", 
          earnings: 0, 
          courses: 0, 
          students: 0,
          isEmpty: true,
          debugInfo: `${totalTransactions} transactions, ${commissionTransactions} commissions`
        },
        { name: "Make a course purchase to see earnings", earnings: 0, courses: 0, students: 0, isEmpty: true },
        { name: "Instructor commissions will appear here", earnings: 0, courses: 0, students: 0, isEmpty: true },
        { name: "After payment processing", earnings: 0, courses: 0, students: 0, isEmpty: true },
        { name: "Real-time earnings tracking", earnings: 0, courses: 0, students: 0, isEmpty: true },
      ];
    }

    // Pad with empty entries if less than 5
    while (sortedInstructors.length < 5) {
      sortedInstructors.push({
        name: "No more data",
        earnings: 0,
        courses: 0,
        students: 0,
        isEmpty: true
      });
    }

    return sortedInstructors;
  };

  const displayTopInstructors = calculateTopInstructorsFromTransactions();

  // Add sample transactions if none exist but we have platform revenue
  let displayTransactions = recentTransactions;
  if (recentTransactions.length === 0 && platformRevenue > 0) {
    displayTransactions = [
      {
        _id: 'sample-1',
        description: 'Course Purchase Revenue',
        amount: platformRevenue,
        type: 'credit',
        status: 'completed',
        createdAt: new Date().toISOString(),
        metadata: { paymentMethod: 'stripe' }
      }
    ];
  }

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

  // Format percentage
  const formatPercentage = (value) => {
    const num = Number(value);
    return isNaN(num) ? '0.0%' : `${num.toFixed(1)}%`;
  };

  // Filter transactions
  const filteredTransactions = displayTransactions.filter(transaction => {
    const matchesSearch = !searchTerm || 
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.metadata?.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date filter
    let matchesDate = true;
    if (isDateFilterActive && transaction.createdAt) {
      const transactionDate = new Date(transaction.createdAt);
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && transactionDate >= fromDate;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && transactionDate <= toDate;
      }
    }
    
    return matchesSearch && matchesDate;
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            Admin privileges required to access this page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                🏛️ Admin Financial Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Comprehensive platform revenue, user billing, and financial analytics
              </p>
            </div>
            <button
              onClick={async () => {
                setIsRefreshing(true);
                await Promise.all([
                  refetchBilling(),
                  // Add other refetch calls if needed
                ]);
                setTimeout(() => setIsRefreshing(false), 500);
              }}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
          
          {/* Financial Management Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Wallet className="w-6 h-6 mr-2 text-purple-600" />
              Financial Management
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/admin/refunds')}
                className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Manage Refunds
              </button>
              <button
                onClick={() => navigate('/admin/gift-cards')}
                className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Gift className="w-5 h-5 mr-2" />
                Gift Cards
              </button>
              <button
                onClick={() => navigate('/admin/payouts')}
                className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <DollarSign className="w-5 h-5 mr-2" />
                Manage Payouts
              </button>
              <button
                onClick={() => navigate('/admin/payments')}
                className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Payment Settings
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
                    Unable to load financial data. Showing demo data for interface preview.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Platform Revenue */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Building className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Platform Revenue</p>
                  <div className="flex items-center gap-2">
                    {showBalance ? (
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(platformMetrics.totalRevenue)}
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
              <span className="text-sm text-green-600">+{formatPercentage(platformMetrics.monthlyGrowth)} from last month</span>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(platformMetrics.monthlyRevenue)}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Current month earnings
            </p>
          </div>

          {/* Pending Payouts */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Wallet className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Payouts</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(platformMetrics.pendingPayouts)}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Awaiting instructor payouts
            </p>
          </div>

          {/* Profit Margin */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Profit Margin</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatPercentage(platformMetrics.profitMargin)}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Platform profitability
            </p>
          </div>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trends Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                📈 Revenue & Payout Trends
              </h3>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {revenueByMonth.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.month}</span>
                    <span className="text-gray-600">{formatCurrency(item.revenue)}</span>
                  </div>
                  <div className="flex gap-1 h-3">
                    <div
                      className="bg-purple-500 rounded-sm"
                      style={{
                        width: `${(item.revenue / Math.max(...revenueByMonth.map(r => r.revenue))) * 70}%`
                      }}
                    ></div>
                    <div
                      className="bg-orange-400 rounded-sm"
                      style={{
                        width: `${(item.payouts / Math.max(...revenueByMonth.map(r => r.revenue))) * 70}%`
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-600">Revenue</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <span className="text-gray-600">Payouts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Instructors */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                🏆 Top Earning Instructors
              </h3>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {displayTopInstructors.map((instructor, index) => (
                <div key={instructor.id || index} className={`flex items-center justify-between p-3 rounded-lg ${
                  instructor.isLoading ? 'bg-gray-100 animate-pulse' : 
                  instructor.isError ? 'bg-red-50 border border-red-200' : 
                  instructor.isEmpty ? 'bg-gray-50 opacity-50' :
                  'bg-gray-50 hover:bg-gray-100 transition-colors'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      instructor.isLoading ? 'bg-gray-300' :
                      instructor.isError ? 'bg-red-400' :
                      instructor.isEmpty ? 'bg-gray-300' :
                      instructor.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      instructor.rank === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                      instructor.rank === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                      'bg-gradient-to-r from-purple-500 to-blue-500'
                    }`}>
                      {instructor.isLoading ? '...' : instructor.rank || (index + 1)}
                      {instructor.rank === 1 && !instructor.isLoading && !instructor.isError && !instructor.isEmpty && (
                        <span className="absolute -top-1 -right-1 text-xs">🏆</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {instructor.avatar && !instructor.isLoading && !instructor.isError && !instructor.isEmpty && (
                        <img 
                          src={instructor.avatar} 
                          alt={instructor.name}
                          className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                          onError={(e) => {
                            e.target.src = '/images/default-avatar.png';
                          }}
                        />
                      )}
                      {(instructor.isLoading || instructor.isError || instructor.isEmpty) && (
                        <div className={`w-8 h-8 rounded-full ${
                          instructor.isLoading ? 'bg-gray-300 animate-pulse' : 
                          instructor.isError ? 'bg-red-200' :
                          'bg-gray-200'
                        }`}></div>
                      )}
                      <div>
                        <p className={`font-medium ${
                          instructor.isError ? 'text-red-600' : 
                          instructor.isLoading ? 'text-gray-400' : 
                          instructor.isEmpty ? 'text-gray-400' :
                          'text-gray-900'
                        }`}>
                          {instructor.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {instructor.courses || 0} courses • {instructor.students || 0} students
                        </p>
                        {instructor.email && !instructor.isLoading && !instructor.isError && !instructor.isEmpty && (
                          <p className="text-xs text-gray-400">{instructor.email}</p>
                        )}
                        {instructor.transactionCount && !instructor.isEmpty && (
                          <p className="text-xs text-blue-500">{instructor.transactionCount} transactions</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      instructor.isError ? 'text-red-500' :
                      instructor.isLoading ? 'text-gray-400' :
                      instructor.isEmpty ? 'text-gray-400' :
                      'text-green-600'
                    }`}>
                      {instructor.isLoading ? '...' : 
                       instructor.isError ? 'Error' :
                       formatCurrency(instructor.totalEarnings || instructor.earnings || 0)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {instructor.isLoading ? 'Loading...' :
                       instructor.isError ? 'Failed to load' :
                       instructor.isEmpty ? 'No data' :
                       'Total earned'}
                    </p>
                    {instructor.isActive !== undefined && !instructor.isLoading && !instructor.isError && !instructor.isEmpty && (
                      <p className={`text-xs ${instructor.isActive ? 'text-green-500' : 'text-red-500'}`}>
                        {instructor.isActive ? 'Active' : 'Inactive'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 📚 Top 5 Sold Courses */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                📚 Top 5 Sold Courses
              </h3>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            
            {(() => {
              // Calculate top courses from transactions
              const transactions = allTransactionsData?.transactions || [];
              const courseSales = {};
              
              // Group transactions by course and count sales
              allTransactions.forEach(transaction => {
                if (transaction.type === 'credit' && transaction.category === 'commission' && transaction.relatedCourse) {
                  const courseId = transaction.relatedCourse._id || transaction.relatedCourse;
                  const courseTitle = transaction.relatedCourse.title || 'Unknown Course';
                  
                  if (!courseSales[courseId]) {
                    courseSales[courseId] = {
                      id: courseId,
                      title: courseTitle,
                      sales: 0,
                      revenue: 0,
                      instructor: transaction.userId?.name || 'Unknown Instructor'
                    };
                  }
                  courseSales[courseId].sales += 1;
                  courseSales[courseId].revenue += transaction.amount || 0;
                }
              });
              
              // Convert to array and sort by sales
              const topCourses = Object.values(courseSales)
                .sort((a, b) => b.sales - a.sales)
                .slice(0, 5);
              
              // If no courses with sales, show placeholder
              const displayCourses = topCourses.length > 0 ? topCourses : [
                { title: "No course sales yet", sales: 0, revenue: 0, instructor: "Make your first sale!" },
                { title: "Course sales will appear here", sales: 0, revenue: 0, instructor: "After students purchase" },
                { title: "Real-time sales tracking", sales: 0, revenue: 0, instructor: "Automatic updates" },
                { title: "Revenue analytics", sales: 0, revenue: 0, instructor: "Detailed insights" },
                { title: "Performance metrics", sales: 0, revenue: 0, instructor: "Growth tracking" },
              ];
              
              return (
                <div className="space-y-4">
                  {displayCourses.map((course, index) => (
                    <div key={course.id || index} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                            index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                            index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                            index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500' :
                            'bg-gradient-to-br from-blue-400 to-purple-500'
                          }`}>
                            {index + 1}
                          </div>
                          {index === 0 && course.sales > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg">{course.title}</h3>
                          <p className="text-sm text-gray-600">by {course.instructor}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-blue-600 font-medium">
                              {course.sales} {course.sales === 1 ? 'sale' : 'sales'}
                            </span>
                            {course.revenue > 0 && (
                              <span className="text-sm text-green-600 font-medium">
                                ${course.revenue.toFixed(2)} revenue
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {course.sales}
                        </div>
                        <div className="text-sm text-gray-500">Sales</div>
                        {course.revenue > 0 && (
                          <div className="text-xs text-green-600 mt-1">
                            ${course.revenue.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Summary Statistics */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {allTransactions.filter(t => t.type === 'credit' && t.category === 'commission').length}
                        </div>
                        <div className="text-sm text-gray-500">Total Course Sales</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          ${allTransactions
                            .filter(t => t.type === 'credit' && t.category === 'commission')
                            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
                            .toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">Total Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          ${(() => {
                            const commissionTransactions = allTransactions.filter(t => t.type === 'credit' && t.category === 'commission');
                            return commissionTransactions.length > 0 
                              ? (commissionTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) / commissionTransactions.length).toFixed(2)
                              : '0.00';
                          })()}
                        </div>
                        <div className="text-sm text-gray-500">Avg Sale Value</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Platform Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="p-3 bg-blue-100 rounded-xl w-fit mx-auto mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{platformMetrics.totalUsers.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-xs text-green-600 mt-1">
              {platformMetrics.activeUsers} active
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="p-3 bg-green-100 rounded-xl w-fit mx-auto mb-4">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(platformMetrics.averageTransactionValue)}</p>
            <p className="text-sm text-gray-600">Avg Transaction</p>
            <p className="text-xs text-gray-500 mt-1">
              {platformMetrics.transactionCount.toLocaleString()} total
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="p-3 bg-purple-100 rounded-xl w-fit mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatPercentage(platformMetrics.conversionRate)}</p>
            <p className="text-sm text-gray-600">Conversion Rate</p>
            <p className="text-xs text-green-600 mt-1">
              +2.3% this month
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="p-3 bg-red-100 rounded-xl w-fit mx-auto mb-4">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatPercentage(platformMetrics.churnRate)}</p>
            <p className="text-sm text-gray-600">Churn Rate</p>
            <p className="text-xs text-red-600 mt-1">
              -0.5% this month
            </p>
          </div>
        </div>

        {/* Detailed Transactions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              💳 All Platform Transactions
            </h3>
            
            {/* Search Bar */}
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by description, category, or payment method..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            {/* Date Range Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Filter by Date:</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">From:</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">To:</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => {
                  if (dateFrom || dateTo) {
                    setIsDateFilterActive(true);
                  }
                }}
                disabled={!dateFrom && !dateTo}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Filter
              </button>
              {isDateFilterActive && (
                <button
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setIsDateFilterActive(false);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                >
                  Clear Dates
                </button>
              )}
            </div>
          </div>

          {billingLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No transactions found</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-lg ${
                          transaction.type === "credit"
                            ? "bg-green-100"
                            : "bg-red-100"
                        }`}
                      >
                        {transaction.type === "credit" ? (
                          <ArrowUpRight className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{formatDate(transaction.createdAt)}</span>
                          <span className="capitalize">{transaction.category}</span>
                          {transaction.metadata?.paymentMethod && (
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {transaction.metadata.paymentMethod}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          transaction.type === "credit"
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
                    </div>
                  </div>
                ))}
              </div>

              {/* Transaction Count Info */}
              {displayTransactions.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600">
                    Showing {displayTransactions.length} recent transactions
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBillingPage;
