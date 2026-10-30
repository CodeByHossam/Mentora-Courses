import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  BarChart3,
  PieChart,
  Calendar,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  BookOpen,
  Users,
  Award,
  Target,
  Send,
  FileText,
  RotateCcw,
  Settings,
  Minus,
  Star,
  PlayCircle,
  Building,
  GraduationCap,
  TrendingUp as Growth,
  Gift,
  Upload,
  AlertCircle,
} from "lucide-react";
import {
  useGetBillingAccountQuery,
  useGetBillingTransactionsQuery,
} from "../../store/services/billingApi";
import { useGetCoursesQuery } from "../../store/services/courseApi";
import LoadingSpinner from "../../components/LoadingSpinner";

const InstructorBillingPage = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [transactionPage, setTransactionPage] = useState(1);
  const [selectedTimeframe, setSelectedTimeframe] = useState("month");
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // API hooks
  const {
    data: billingData,
    isLoading: billingLoading,
    error: billingError,
    refetch: refetchBilling,
  } = useGetBillingAccountQuery();

  // Remove debug logging


  // Get instructor courses
  const { data: coursesData, isLoading: coursesLoading } = useGetCoursesQuery();

  const {
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useGetBillingTransactionsQuery({ page: transactionPage, limit: 20 });

  // Extract billing data with safe fallbacks
  const instructorAccount = billingData?.data?.account || {
      availableBalance: 0,
      totalCommissionEarned: 0,
      pendingCommissions: 0,
      totalGiftAmount: 0,
      totalPayoutsReceived: 0,
      annualFees: 0,
      courseSales: 0,
    };

  // 📦 SIMPLIFIED: Calculate balance using pendingCommissions (not total)
  // availableBalance = pendingCommissions + totalGiftAmount - annualFees
  const correctAvailableBalance =
    (instructorAccount?.pendingCommissions || 0) +
    (instructorAccount?.totalGiftAmount || 0) -
    (instructorAccount?.annualFees || 0);

  // Calculate Total Your Earnings (all income sources)
  const totalYourEarnings =
    (instructorAccount?.pendingCommissions || 0) +
    (instructorAccount?.totalGiftAmount || 0);

  // Calculate Total Deductions (only fees, payouts already deducted from pending)
  const totalDeductions = (instructorAccount?.annualFees || 0);

  const transactions =
    billingData?.data?.recentTransactions ||
    billingData?.recentTransactions ||
    [];

  const transactionCount =
    billingData?.data?.transactionCount ||
    billingData?.transactionCount ||
    transactions?.length ||
    0;

  // Extract instructor courses
  const courses = coursesData?.data || [];
  const myCourses = !coursesLoading
    ? courses.filter(
        (course) =>
          String(course.instructor?._id || course.instructor) ===
          String(user?.id)
      )
    : [];

  // Calculate instructor metrics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Calculate earnings from transactions
  const earningTransactions = transactions.filter(
    (t) =>
      t.type === "credit" &&
      (t.category === "commission" ||
        t.description?.toLowerCase().includes("commission"))
  );

  const monthlyEarnings = earningTransactions
    .filter((t) => {
      const transactionDate = new Date(t.createdAt);
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const totalEarnings = earningTransactions.reduce((sum, t) => {
    const amount = parseFloat(t.amount) || 0;
    return sum + amount;
  }, 0);
  // Get monthly earning transactions for debugging
  const monthlyEarningTransactions = earningTransactions.filter((t) => {
    const transactionDate = new Date(t.createdAt);
    return (
      transactionDate.getMonth() === currentMonth &&
      transactionDate.getFullYear() === currentYear
    );
  });

  // Calculate previous month earnings for growth comparison
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const previousMonthTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.createdAt);
    return (
      transactionDate.getMonth() === lastMonth &&
      transactionDate.getFullYear() === lastMonthYear &&
      t.type === "credit"
    );
  });

  const previousMonthEarnings = previousMonthTransactions.reduce((sum, t) => {
    const amount = parseFloat(t.amount) || 0;
    return sum + amount;
  }, 0);
  const earningsGrowth =
    previousMonthEarnings > 0
      ? ((monthlyEarnings - previousMonthEarnings) / previousMonthEarnings) *
        100
      : monthlyEarnings > 0
      ? 100
      : 0;

  // 📦 SIMPLIFIED: Calculate instructor metrics using pendingCommissions
  const instructorMetrics = {
    totalEarnings: totalYourEarnings, // pendingCommissions + totalGiftAmount
    monthlyEarnings:
      monthlyEarnings ||
      instructorAccount?.monthlyEarnings ||
      0,
    availableBalance: correctAvailableBalance, // Simple formula from boxes
    totalCommissionsHistory: instructorAccount?.totalCommissionEarned || 0, // History (all time)
    totalCommissions: instructorAccount?.totalCommissionEarned || 0, // Same as history
    pendingCommissions: instructorAccount?.pendingCommissions || 0, // Current unpaid
    totalPayoutsReceived: instructorAccount?.totalPayoutsReceived || 0,
    totalGiftAmount: instructorAccount?.totalGiftAmount || 0,
    annualFees: instructorAccount?.annualFees || 0,
    totalDeductions: totalDeductions, // Only annual fees
    totalCourses: myCourses.length || 0,
    totalStudents: new Set(earningTransactions.map((t) => t.from)).size || 0,
    averageRating:
      myCourses.length > 0
        ? myCourses.reduce(
            (sum, course) => sum + (course.averageRating || 0),
            0
          ) / myCourses.length
        : 0,
    totalReviews:
      myCourses.reduce((sum, course) => sum + (course.ratingsCount || 0), 0) ||
      0,
    conversionRate: instructorAccount?.conversionRate || 0,
    monthlyGrowth: earningsGrowth || instructorAccount?.monthlyGrowth || 0,
  };

  // Calculate real earnings by month from transaction data
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const earningsByMonth = monthNames.slice(0, 12).map((monthName, index) => {
    const monthEarnings = earningTransactions
      .filter((t) => {
        const transactionDate = new Date(t.createdAt);
        return (
          transactionDate.getMonth() === index &&
          transactionDate.getFullYear() === currentYear &&
          t.amount > 0
        );
      })
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    // Count unique students and courses for this month
    const monthTransactions = earningTransactions.filter((t) => {
      const transactionDate = new Date(t.createdAt);
      return (
        transactionDate.getMonth() === index + 1 &&
        transactionDate.getFullYear() === currentYear &&
        t.amount > 0
      );
    });

    const uniqueStudents = new Set(monthTransactions.map((t) => t.from)).size;
    const uniqueCourses = new Set(
      monthTransactions.map((t) => t.relatedCourse?._id).filter(Boolean)
    ).size;

    return {
      month: monthName,
      earnings: monthEarnings,
      students: uniqueStudents,
      courses: uniqueCourses,
    };
  });
  const filteredEarningsByMonth = earningsByMonth.filter(
    (month) => month.earnings > 0
  ); // Filter out months with no earningByAmount

  // Calculate real top courses from transaction data and instructor's courses
  const topCourses =
    myCourses.length > 0
      ? myCourses
          .slice(0, 5)
          .map((course) => {
            // Calculate earnings for this course from commission transactions
            const courseEarnings = earningTransactions
              .filter((t) => t.relatedCourse?._id === course._id)
              .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

            // Count unique students for this course
            const courseStudents = new Set(
              earningTransactions
                .filter((t) => t.relatedCourse?._id === course._id)
                .map((t) => t.from)
            ).size;

            return {
              title: course.title || "Untitled Course",
              earnings: courseEarnings,
              students: courseStudents,
              rating: course.averageRating || 0,
            };
          })
          .sort((a, b) => b.earnings - a.earnings)
      : [
          {
            title: "No course data available",
            earnings: 0,
            students: 0,
            rating: 0,
          },
          {
            title: "No course data available",
            earnings: 0,
            students: 0,
            rating: 0,
          },
          {
            title: "No course data available",
            earnings: 0,
            students: 0,
            rating: 0,
          },
          {
            title: "No course data available",
            earnings: 0,
            students: 0,
            rating: 0,
          },
          {
            title: "No course data available",
            earnings: 0,
            students: 0,
            rating: 0,
          },
        ];

  // Calculate real recent sales from transaction data
  const recentSales =
    earningTransactions.length > 0
      ? earningTransactions
          .slice(0, 5) // Get most recent 5 transactions
          .map((transaction) => {
            // Find the related course
            const relatedCourse = myCourses.find(
              (course) => course._id === transaction.relatedCourse?._id
            );

            // Calculate original sale amount from commission (assuming 88% commission rate)
            const commission = parseFloat(transaction.amount) || 0;
            const originalAmount = commission > 0 ? commission / 0.88 : 0; // Reverse calculate from commission

            return {
              course:
                relatedCourse?.title ||
                transaction.relatedCourse?.title ||
                "Unknown Course",
              student: "Student", // We don't have student name in transaction, just ID
              amount: originalAmount,
              commission: commission,
              date: transaction.createdAt,
              method: transaction.metadata?.paymentMethod || "direct_transfer",
            };
          })
      : [
          {
            course: "No sales data",
            student: "No data",
            amount: 0,
            commission: 0,
            date: new Date().toISOString(),
            method: "none",
          },
          {
            course: "No sales data",
            student: "No data",
            amount: 0,
            commission: 0,
            date: new Date().toISOString(),
            method: "none",
          },
          {
            course: "No sales data",
            student: "No data",
            amount: 0,
            commission: 0,
            date: new Date().toISOString(),
            method: "none",
          },
          {
            course: "No sales data",
            student: "No data",
            amount: 0,
            commission: 0,
            date: new Date().toISOString(),
            method: "none",
          },
          {
            course: "No sales data",
            student: "No data",
            amount: 0,
            commission: 0,
            date: new Date().toISOString(),
            method: "none",
          },
        ];

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

  // Filter transactions with enhanced gift card support
  const filteredTransactions = transactions.filter((transaction) => {
    let matchesFilter = false;
    if (transactionFilter === "all") {
      matchesFilter = true;
    } else if (
      transactionFilter === "credit" ||
      transactionFilter === "debit"
    ) {
      matchesFilter = transaction.type === transactionFilter;
    } else if (transactionFilter === "gift_card") {
      // Check for gift card transactions by category, description, or if it's from giftAmount field
      matchesFilter =
        transaction.category === "credit_addition" ||
        transaction.description?.toLowerCase().includes("gift card") ||
        transaction.description?.toLowerCase().includes("gift") ||
        transaction.description?.toLowerCase().includes("bonus") ||
        transaction.description?.toLowerCase().includes("refund") ||
        transaction.description?.toLowerCase().includes("welcome") ||
        transaction.description?.toLowerCase().includes("loyalty") ||
        transaction.description?.toLowerCase().includes("compensation") ||
        transaction.description?.toLowerCase().includes("promotional") ||
        (transaction.metadata && transaction.metadata.giftCardType) ||
        transaction.giftAmountRecord === true;
    } else if (transactionFilter === "commission") {
      matchesFilter =
        transaction.category === "commission" ||
        transaction.description?.toLowerCase().includes("commission") ||
        transaction.description?.toLowerCase().includes("earning");
    } else if (transactionFilter === "payout") {
      matchesFilter =
        transaction.category === "instructor_payout" ||
        transaction.description?.toLowerCase().includes("payout") ||
        transaction.description?.toLowerCase().includes("withdrawal");
    } else {
      matchesFilter = transaction.category === transactionFilter;
    }

    const matchesSearch =
      transaction.description
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) || false;
    return matchesFilter && matchesSearch;
  });


  // If still loading
  if (coursesLoading || billingLoading || transactionsLoading) {
    return <LoadingSpinner />;
  }

  return null;
  return null;

};

export default InstructorBillingPage;
