import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, BookOpen, Users, Award, Star } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import LazyImage from './LazyImage';

/**
 * Hero section component with modern design and engaging content
 */
const Hero = memo(() => {
  const navigate = useNavigate();

  const stats = [
    { icon: BookOpen, label: 'Courses', value: '500+' },
    { icon: Users, label: 'Students', value: '50K+' },
    { icon: Award, label: 'Certificates', value: '25K+' },
    { icon: Star, label: 'Rating', value: '4.9' }
  ];

  const features = [
    'Expert-led courses',
    'Hands-on projects',
    'Industry certificates',
    'Lifetime access'
  ];

  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-secondary-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      <div className="container-app relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                <Star className="w-4 h-4 mr-2 fill-current" />
                Trusted by 50,000+ learners worldwide
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary leading-tight">
                Master New Skills with
                <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent"> Expert-Led</span>
                <br />Online Courses
              </h1>
              
              <p className="text-xl text-text-secondary leading-relaxed max-w-2xl">
                Join thousands of learners advancing their careers with our comprehensive, 
                project-based courses taught by industry experts. Start your learning journey today.
              </p>
            </div>

            {/* Features List */}
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <span className="text-text-secondary">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/courses')}
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="shadow-lg hover:shadow-xl"
              >
                Explore Courses
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/about')}
                leftIcon={<Play className="w-5 h-5" />}
              >
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-gray-200">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <stat.icon className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
                  <div className="text-sm text-text-secondary">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Hero Image/Cards */}
          <div className="relative">
            <div className="relative z-10 space-y-6">
              {/* Main Hero Card */}
              <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">Featured Course</h3>
                      <p className="text-sm text-text-secondary">Full Stack Web Development</p>
                    </div>
                  </div>
                  
                  <LazyImage
                    src="/images/hero-course.jpg"
                    alt="Featured Course"
                    className="w-full h-32 object-cover rounded-lg"
                    fallbackSrc="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop"
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                      <span className="text-sm text-text-secondary ml-2">4.9 (2.1k reviews)</span>
                    </div>
                    <div className="text-lg font-bold text-primary-600">$99</div>
                  </div>
                </div>
              </Card>

              {/* Floating Stats Cards */}
              <div className="absolute -top-4 -right-4 z-20">
                <Card className="p-4 bg-white shadow-lg border-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-text-primary">2.5K+</div>
                      <div className="text-xs text-text-secondary">Active Students</div>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="absolute -bottom-4 -left-4 z-20">
                <Card className="p-4 bg-white shadow-lg border-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Award className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-text-primary">98%</div>
                      <div className="text-xs text-text-secondary">Success Rate</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute inset-0 -z-10">
              <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 rounded-3xl transform rotate-3"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-text-secondary rounded-full flex justify-center">
          <div className="w-1 h-3 bg-text-secondary rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
});

Hero.displayName = 'Hero';

export default Hero;
