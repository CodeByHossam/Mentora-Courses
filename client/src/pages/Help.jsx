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

  return (
    <div className={`min-h-screen bg-gradient-to-br ${heroContent.bgGradient}`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className={`p-4 rounded-full bg-gradient-to-r ${heroContent.gradient} shadow-lg`}>
                <HelpCircle className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className={`text-4xl lg:text-6xl font-bold bg-gradient-to-r ${heroContent.gradient} bg-clip-text text-transparent mb-6`}>
              {heroContent.title}
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {heroContent.subtitle}
            </p>
            <p className="text-lg text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              {heroContent.description}
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">10,000+</div>
                <div className="text-gray-600">Active Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">500+</div>
                <div className="text-gray-600">Expert Instructors</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">1,000+</div>
                <div className="text-gray-600">Quality Courses</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 lg:py-24 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {user ? `${user.role === 'admin' ? 'Admin' : user.role === 'instructor' ? 'Instructor' : 'Student'} Features` : 'Platform Features'}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {user ? 'Discover all the tools and features available to you' : 'Everything you need for a successful learning experience'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${heroContent.gradient} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      {quickActions.length > 0 && (
        <div className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <p className="text-xl text-gray-600">Get started with these common tasks</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {quickActions.map((action, index) => (
                <div key={index} className="group">
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 text-center">
                    <div className="mb-6">
                      <Play className={`w-12 h-12 mx-auto text-transparent bg-gradient-to-r ${heroContent.gradient} bg-clip-text`} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{action.title}</h3>
                    <p className="text-gray-600 mb-6">{action.description}</p>
                    <button className={`inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r ${heroContent.gradient} text-white font-medium hover:shadow-lg transition-all duration-300 group-hover:scale-105`}>
                      {action.action}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="py-16 lg:py-24 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Find answers to common questions</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                >
                  <span className="text-lg font-semibold text-gray-900">{faq.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-8 pb-6">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Why Choose Mentora?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of learners and educators who trust Mentora for their educational journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${heroContent.gradient} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Fast & Efficient</h3>
              <p className="text-gray-600">Streamlined learning experience with intuitive design and powerful features.</p>
            </div>

            <div className="text-center group">
              <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${heroContent.gradient} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">User-Friendly</h3>
              <p className="text-gray-600">Designed with users in mind, making learning and teaching enjoyable and accessible.</p>
            </div>

            <div className="text-center group">
              <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${heroContent.gradient} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <Star className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">High Quality</h3>
              <p className="text-gray-600">Premium content from expert instructors with rigorous quality standards.</p>
            </div>

            <div className="text-center group">
              <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${heroContent.gradient} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Proven Results</h3>
              <p className="text-gray-600">Track record of successful learners achieving their educational and career goals.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className={`py-16 lg:py-24 bg-gradient-to-r ${heroContent.gradient}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            {user ? 'Need More Help?' : 'Ready to Get Started?'}
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            {user 
              ? 'Our support team is here to help you make the most of Mentora. Contact us anytime!'
              : 'Join thousands of learners and start your educational journey today with Mentora.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-lg">
              {user ? 'Contact Support' : 'Sign Up Now'}
            </button>
            <button className="px-8 py-4 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors duration-200 border border-white/30">
              {user ? 'Browse Documentation' : 'Learn More'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
