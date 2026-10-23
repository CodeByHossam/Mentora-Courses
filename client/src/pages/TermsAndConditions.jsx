import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Shield, CreditCard, Users, Lock, Globe, MessageSquare } from 'lucide-react';

const TermsAndConditions = () => {
  const navigate = useNavigate();

  const sections = [
    {
      id: 1,
      title: "Transaction Types",
      icon: <CreditCard className="w-5 h-5" />,
      content: [
        "Direct Transactions: Payments made directly between students and instructors are outside the platform's responsibility. The platform does not facilitate, manage, or guarantee these payments. Any disputes must be resolved directly between the involved parties.",
        "Platform Transactions: Payments made through the platform's online system are subject to the platform's payment processing terms and policies."
      ]
    },
    {
      id: 2,
      title: "Financial Liability Disclaimer",
      icon: <Shield className="w-5 h-5" />,
      content: [
        "The platform is not responsible for any financial loss, fraud, or dispute arising from direct transactions between students and instructors."
      ]
    },
    {
      id: 3,
      title: "Refund Policy",
      icon: <CreditCard className="w-5 h-5" />,
      content: [
        "Refund requests for payments processed through the platform will only be approved if supported by valid evidence or documentation. Refunds related to direct transactions must be handled directly between the student and instructor."
      ]
    },
    {
      id: 4,
      title: "Content Access and Use",
      icon: <FileText className="w-5 h-5" />,
      content: [
        "Videos and educational materials are available for streaming only and must not be downloaded, copied, or redistributed. Unauthorized sharing or distribution of content will result in legal action."
      ]
    },
    {
      id: 5,
      title: "Intellectual Property Rights",
      icon: <Lock className="w-5 h-5" />,
      content: [
        "All course content remains the property of the instructor or the platform. Any unauthorized use, copying, or distribution of course materials is strictly prohibited."
      ]
    },
    {
      id: 6,
      title: "Legal Enforcement",
      icon: <Shield className="w-5 h-5" />,
      content: [
        "The platform reserves the right to take legal action against any user who violates content distribution policies or any of the terms outlined herein."
      ]
    },
    {
      id: 7,
      title: "Platform Liability Limitations",
      icon: <Shield className="w-5 h-5" />,
      content: [
        "The platform acts as a facilitator for courses and does not guarantee the quality, accuracy, or delivery of course content. It is not liable for disputes arising from course delivery or transactions outside its online payment system."
      ]
    },
    {
      id: 8,
      title: "Dispute Resolution",
      icon: <Users className="w-5 h-5" />,
      content: [
        "Users are encouraged to attempt amicable resolution before escalating issues. For transactions processed through the platform, disputes may be subject to arbitration or mediation as detailed in our dispute resolution policy."
      ]
    },
    {
      id: 9,
      title: "Privacy and Data Security",
      icon: <Lock className="w-5 h-5" />,
      content: [
        "We are committed to protecting your personal data. Information collected during registration, transactions, or communication is handled securely according to our Privacy Policy."
      ]
    },
    {
      id: 10,
      title: "User Responsibility",
      icon: <Users className="w-5 h-5" />,
      content: [
        "Users are responsible for verifying the legitimacy of instructors and courses, especially in cases of direct transactions. The platform does not endorse or guarantee any external transactions."
      ]
    },
    {
      id: 11,
      title: "Cookies Policy",
      icon: <Globe className="w-5 h-5" />,
      content: [
        "Our platform uses cookies to improve user experience, personalize content, and analyze traffic. By using our platform, you consent to the use of cookies as outlined in our Cookies Policy. You can manage your cookie preferences in your browser settings."
      ]
    },
    {
      id: 12,
      title: "Personal Communication",
      icon: <MessageSquare className="w-5 h-5" />,
      content: [
        "Within the Platform: Communication between students and instructors via our messaging system is monitored to ensure compliance with platform policies but is private.",
        "Outside the Platform: Use of personal data for communication outside the platform requires explicit consent and must comply with applicable privacy laws. The platform is not responsible for any communications or transactions that occur outside its system."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Terms & Conditions</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Please read these terms and conditions carefully before using our platform.
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800 text-sm">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  {section.icon}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {section.id}. {section.title}
                </h2>
              </div>
              <div className="space-y-3">
                {section.content.map((paragraph, index) => (
                  <p key={index} className="text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Agreement Acknowledgment
            </h3>
            <p className="text-gray-600 mb-4">
              By using our platform, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Accept & Register
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
