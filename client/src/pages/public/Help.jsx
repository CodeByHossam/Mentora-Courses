import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  HelpCircle,
  BookOpen,
  Users,
  Award,
  MessageCircle,
  Calendar,
  CreditCard,
  Settings,
  BarChart3,
  GraduationCap,
  Shield,
  Zap,
  Heart,
  Star,
  ChevronDown,
  ChevronUp,
  Play,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const Help = () => {
  const { user } = useSelector((state) => state.auth);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  // Role-specific content
  const getHeroContent = () => {
    if (!user) {
      return {
        title: "Welcome to Mentora",
        subtitle: "Your Gateway to Quality Online Education",
        description: "Discover a world of learning opportunities with our comprehensive online learning platform. Connect with expert instructors, access quality courses, and track your progress.",
        gradient: "from-blue-600 via-purple-600 to-indigo-600",
        bgGradient: "from-blue-50 via-indigo-50 to-purple-50"
      };
    }

    switch (user.role) {
      case 'student':
        return {
          title: `Welcome ${user.name}!`,
          subtitle: "Your Learning Journey Starts Here",
          description: "Access your courses, track your progress, communicate with instructors, and achieve your educational goals with our comprehensive student dashboard.",
          gradient: "from-blue-600 via-sky-600 to-cyan-600",
          bgGradient: "from-blue-50 via-sky-50 to-cyan-50"
        };
      case 'instructor':
        return {
          title: `Hello ${user.name}!`,
          subtitle: "Empower Students Through Teaching",
          description: "Manage your courses, engage with students, track their progress, and create impactful learning experiences with our instructor tools.",
          gradient: "from-emerald-600 via-green-600 to-teal-600",
          bgGradient: "from-emerald-50 via-green-50 to-teal-50"
        };
      case 'admin':
        return {
          title: `Admin Dashboard - ${user.name}`,
          subtitle: "Platform Management & Control",
          description: "Oversee the entire platform, manage users, monitor system performance, and ensure the best learning experience for everyone.",
          gradient: "from-purple-600 via-violet-600 to-indigo-600",
          bgGradient: "from-purple-50 via-violet-50 to-indigo-50"
        };
      default:
        return {
          title: "Welcome to Mentora",
          subtitle: "Your Gateway to Quality Online Education",
          description: "Discover a world of learning opportunities with our comprehensive online learning platform.",
          gradient: "from-blue-600 via-purple-600 to-indigo-600",
          bgGradient: "from-blue-50 via-indigo-50 to-purple-50"
        };
    }
  };

  const getFeatures = () => {
    if (!user) {
      return [
        {
          icon: <BookOpen className="w-8 h-8" />,
          title: "Quality Courses",
          description: "Access hundreds of courses taught by expert instructors across various subjects and skill levels."
        },
        {
          icon: <Users className="w-8 h-8" />,
          title: "Expert Instructors",
          description: "Learn from industry professionals and certified educators with years of experience."
        },
        {
          icon: <Award className="w-8 h-8" />,
          title: "Certificates",
          description: "Earn recognized certificates upon course completion to boost your career prospects."
        },
        {
          icon: <MessageCircle className="w-8 h-8" />,
          title: "Interactive Learning",
          description: "Engage with instructors and fellow students through our messaging and discussion features."
        },
        {
          icon: <Calendar className="w-8 h-8" />,
          title: "Flexible Schedule",
          description: "Learn at your own pace with 24/7 access to course materials and live session recordings."
        },
        {
          icon: <BarChart3 className="w-8 h-8" />,
          title: "Progress Tracking",
          description: "Monitor your learning progress with detailed analytics and performance insights."
        }
      ];
    }

    switch (user.role) {
      case 'student':
        return [
          {
            icon: <BookOpen className="w-8 h-8" />,
            title: "Course Access",
            description: "Access all your enrolled courses, materials, and assignments in one convenient location."
          },
          {
            icon: <BarChart3 className="w-8 h-8" />,
            title: "Grade Tracking",
            description: "Monitor your academic performance with detailed grade reports and progress analytics."
          },
          {
            icon: <Calendar className="w-8 h-8" />,
            title: "Schedule Management",
            description: "View upcoming classes, assignments, and important dates in your personalized calendar."
          },
          {
            icon: <MessageCircle className="w-8 h-8" />,
            title: "Communication",
            description: "Stay connected with instructors and classmates through our messaging system."
          },
          {
            icon: <CreditCard className="w-8 h-8" />,
            title: "Payment Tracking",
            description: "Manage your course payments, view transaction history, and download receipts."
          },
          {
            icon: <Award className="w-8 h-8" />,
            title: "Achievements",
            description: "Earn certificates and track your learning milestones and accomplishments."
          }
        ];
      case 'instructor':
        return [
          {
            icon: <Users className="w-8 h-8" />,
            title: "Student Management",
            description: "Manage your students, track their progress, and provide personalized feedback."
          },
          {
            icon: <BookOpen className="w-8 h-8" />,
            title: "Course Creation",
            description: "Create and manage engaging courses with multimedia content and assessments."
          },
          {
            icon: <BarChart3 className="w-8 h-8" />,
            title: "Analytics Dashboard",
            description: "Access detailed insights about student performance and course effectiveness."
          },
          {
            icon: <Calendar className="w-8 h-8" />,
            title: "Live Sessions",
            description: "Schedule and conduct live classes with integrated video conferencing tools."
          },
          {
            icon: <MessageCircle className="w-8 h-8" />,
            title: "Communication Hub",
            description: "Communicate with students and administrators through our messaging platform."
          },
          {
            icon: <Award className="w-8 h-8" />,
            title: "Assessment Tools",
            description: "Create assignments, quizzes, and provide grades with our comprehensive tools."
          }
        ];
      case 'admin':
        return [
          {
            icon: <Shield className="w-8 h-8" />,
            title: "Platform Security",
            description: "Monitor system security, manage user permissions, and ensure data protection."
          },
          {
            icon: <Users className="w-8 h-8" />,
            title: "User Management",
            description: "Oversee all users, approve instructor applications, and manage account settings."
          },
          {
            icon: <BarChart3 className="w-8 h-8" />,
            title: "System Analytics",
            description: "Access comprehensive platform statistics and performance metrics."
          },
          {
            icon: <Settings className="w-8 h-8" />,
            title: "Platform Configuration",
            description: "Configure system settings, manage courses, and customize platform features."
          },
          {
            icon: <MessageCircle className="w-8 h-8" />,
            title: "Communication Center",
            description: "Handle support requests, send announcements, and manage platform communications."
          },
          {
            icon: <Award className="w-8 h-8" />,
            title: "Quality Assurance",
            description: "Monitor course quality, review content, and ensure educational standards."
          }
        ];
      default:
        return [];
    }
  };

  const getFaqs = () => {
    if (!user) {
      return [
        {
          question: "How do I get started with Mentora?",
          answer: "Simply create an account by clicking the 'Sign Up' button. Choose whether you want to learn as a student or teach as an instructor. Once registered, you can browse courses, enroll in programs, or start creating your own courses."
        },
        {
          question: "What types of courses are available?",
          answer: "Mentora offers a wide variety of courses including technology, business, arts, sciences, languages, and professional development. Our expert instructors provide both beginner-friendly and advanced courses."
        },
        {
          question: "Are the certificates recognized?",
          answer: "Yes! Our certificates are recognized by industry partners and can be shared on professional networks like LinkedIn. They demonstrate your commitment to continuous learning and skill development."
        },
        {
          question: "How much do courses cost?",
          answer: "Course prices vary depending on the content, duration, and instructor. We offer competitive pricing with occasional discounts and promotions. You can view pricing details on each course page."
        },
        {
          question: "Can I access courses on mobile devices?",
          answer: "Absolutely! Mentora is fully responsive and works seamlessly on all devices including smartphones, tablets, and desktop computers. Learn anywhere, anytime."
        }
      ];
    }

    switch (user.role) {
      case 'student':
        return [
          {
            question: "How do I enroll in a course?",
            answer: "Browse available courses, click on the course you're interested in, and click the 'Enroll' button. Complete the payment process if required, and you'll have immediate access to course materials."
          },
          {
            question: "How can I track my progress?",
            answer: "Visit your 'Grades' page to see detailed progress reports, assignment scores, and overall performance analytics. You can also view your learning streaks and achievements."
          },
          {
            question: "How do I communicate with my instructor?",
            answer: "Use the 'Messages' feature to send direct messages to your instructors. You can also participate in course discussions and ask questions during live sessions."
          },
          {
            question: "What if I miss a live session?",
            answer: "Don't worry! All live sessions are recorded and available in your course materials. You can watch them at your convenience and still participate in discussions."
          },
          {
            question: "How do I download my certificates?",
            answer: "Once you complete a course successfully, visit the 'Certificates' page where you can view and download your certificates in PDF format."
          }
        ];
      case 'instructor':
        return [
          {
            question: "How do I create my first course?",
            answer: "Navigate to your instructor dashboard and click 'Create Course'. Follow the step-by-step wizard to add course content, set pricing, and publish your course for students to enroll."
          },
          {
            question: "How do I schedule live sessions?",
            answer: "In your course management area, use the 'Schedule' feature to set up live sessions. Students will be automatically notified and can join through the platform."
          },
          {
            question: "How do I grade assignments?",
            answer: "Access the 'Assignments' section in your course dashboard. You can review submissions, provide feedback, and assign grades. Students will be notified automatically."
          },
          {
            question: "How do I communicate with students?",
            answer: "Use the 'Messages' feature to communicate directly with individual students or send announcements to your entire class. You can also respond to course discussions."
          },
          {
            question: "How do I track student progress?",
            answer: "Your instructor dashboard provides detailed analytics showing student engagement, completion rates, and performance metrics for all your courses."
          }
        ];
      case 'admin':
        return [
          {
            question: "How do I manage user accounts?",
            answer: "Access the 'User Management' section to view, edit, suspend, or delete user accounts. You can also approve instructor applications and manage user roles."
          },
          {
            question: "How do I monitor platform performance?",
            answer: "The admin dashboard provides real-time system metrics, user activity reports, and performance analytics to help you monitor platform health."
          },
          {
            question: "How do I handle support requests?",
            answer: "Support requests appear in your notifications. You can respond directly through the messaging system and track resolution status."
          },
          {
            question: "How do I manage course content?",
            answer: "You can review, approve, or remove courses through the course management interface. Set quality standards and ensure content meets platform guidelines."
          },
          {
            question: "How do I configure system settings?",
            answer: "Access the 'Settings' panel to configure platform-wide settings, payment options, notification preferences, and security parameters."
          }
        ];
      default:
        return [];
    }
  };

  const getQuickActions = () => {
    if (!user) {
      return [
        { title: "Browse Courses", description: "Explore our course catalog", action: "Get Started" },
        { title: "Become an Instructor", description: "Share your expertise", action: "Apply Now" },
        { title: "Contact Support", description: "Get help when you need it", action: "Contact Us" }
      ];
    }

    switch (user.role) {
      case 'student':
        return [
          { title: "View My Courses", description: "Access your enrolled courses", action: "Go to Courses" },
          { title: "Check Grades", description: "See your academic progress", action: "View Grades" },
          { title: "Message Instructor", description: "Get help from your teachers", action: "Send Message" }
        ];
      case 'instructor':
        return [
          { title: "Create New Course", description: "Start building your next course", action: "Create Course" },
          { title: "View Students", description: "Check your student roster", action: "Manage Students" },
          { title: "Schedule Session", description: "Plan your next live class", action: "Schedule Now" }
        ];
      case 'admin':
        return [
          { title: "User Management", description: "Manage platform users", action: "Manage Users" },
          { title: "System Analytics", description: "View platform statistics", action: "View Analytics" },
          { title: "Platform Settings", description: "Configure system settings", action: "Open Settings" }
        ];
      default:
        return [];
    }
  };

  const heroContent = getHeroContent();
  const features = getFeatures();
  const faqs = getFaqs();
  const quickActions = getQuickActions();

  return null;
};

export default Help;
