import React from "react";

const HelpView = (props) => {
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

export default HelpView;
