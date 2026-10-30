import React, { useState } from "react";
import AdminBillingPageView from "./AdminBillingPageView";
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
import AdminFinancialSummaryCard from "../../components/AdminFinancialSummaryCard";

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

  return <AdminBillingPageView />;
};

export default AdminBillingPage;
