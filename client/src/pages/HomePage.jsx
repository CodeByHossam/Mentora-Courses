import { Link } from "react-router-dom";
import React from "react";
import CourseList from "./CourseList";
import { Users, Award, Clock, BookOpen, Star, TrendingUp, Shield, Zap, Play, ArrowRight, CheckCircle } from "lucide-react";
import heroImage from "../assets/images/heroImage.png";

function HomePage() {
  return (
    <main>
      {/* ===== Hero Section ===== */}
      <section className="relative w-full min-h-[calc(100vh-50px)] sm:min-h-[calc(100vh-80px)] flex flex-col justify-between overflow-hidden max-w-full">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-primary shadow-2xl opacity-60"></div>
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{background: 'var(--secondary)'}}></div>
        <div className="absolute bottom-20 left-10 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000" style={{background: 'var(--accent)'}}></div>
        
        {/* === Hero Main Content === */}
        <div className="relative flex-1 pt-8 sm:pt-12 px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-[1400px] mx-auto bg-transparent">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-12">

            {/* === Left: Text Content === */}
            <article className="w-full lg:w-1/2 space-y-6 sm:space-y-8 lg:space-y-6 mt-6 text-center lg:text-left">
              <header className="space-y-6">
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-4" style={{background: 'var(--accent)', color: 'var(--primary)'}}>
                  <Star className="w-4 h-4 mr-2" style={{color: 'var(--warning)'}} />
                  #1 Learning Platform
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold leading-tight" style={{background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 50%, var(--secondary-dark) 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>
                  Master New Skills
                </h1>
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-bold leading-tight text-secondary">
                  Transform Your <span className="relative">
                    <span style={{background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>Future</span>
                    <div className="absolute -bottom-2 left-0 w-full h-1 rounded-full" style={{background: 'var(--primary)'}}></div>
                  </span> Today
                </h2>
                <p className="text-lg sm:text-xl text-secondary max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Join thousands of learners mastering in-demand skills with our expert-led courses. 
                  <span className="font-semibold" style={{color: 'var(--primary)'}}>Start your journey</span> to success today.
                </p>
              </header>

              {/* === Buttons === */}
              <nav className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start" aria-label="Primary actions">
                <Link
                  to="/courses"
                  className="btn-primary group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-2xl hover:scale-105 transform transition-all duration-300 w-full sm:w-auto"
                >
                  <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Start Learning Now
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/about"
                  className="btn-secondary group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-2xl hover:shadow-lg transition-all duration-300 w-full sm:w-auto"
                >
                  <BookOpen className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Learn More
                </Link>
              </nav>
              
              {/* === Trust Indicators === */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" style={{color: 'var(--primary)'}} />
                  <span className="text-sm text-gray-600">Free Trial Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" style={{color: 'var(--primary)'}} />
                  <span className="text-sm text-gray-600">Certificate Included</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5" style={{color: 'var(--secondary-dark)'}} />
                  <span className="text-sm text-gray-600">Instant Access</span>
                </div>
              </div>

              {/* === Enhanced Stats === */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-6 lg:pt-4" aria-label="Statistics">
                {[
                  { value: "100+", label: "Expert Courses", icon: <BookOpen className="w-6 h-6" />, color: "var(--primary)" },
                  { value: "50k+", label: "Happy Students", icon: <Users className="w-6 h-6" />, color: "var(--secondary)" },
                  { value: "95%", label: "Success Rate", icon: <TrendingUp className="w-6 h-6" />, color: "var(--secondary-dark)" },
                ].map(({ value, label, icon, color }) => (
                  <div key={label} className="group text-center lg:text-start p-4 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-white mb-3 group-hover:scale-110 transition-transform" style={{background: color}}>
                      {icon}
                    </div>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {value}
                    </p>
                    <p className="text-sm sm:text-base text-gray-600 font-medium">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            {/* === Right: Enhanced Image === */}
            <aside className="w-full lg:w-1/2 mt-8 lg:mt-0 flex justify-center items-center" aria-label="Learning illustration">
              <div className="relative h-48 w-48 sm:h-64 sm:w-64 md:h-80 md:w-80 lg:h-80 lg:w-80 xl:h-96 xl:w-96 max-w-full">
                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-80 animate-bounce delay-300"></div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full opacity-80 animate-bounce delay-700"></div>
                <div className="absolute top-1/4 -left-8 w-12 h-12 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-60 animate-pulse"></div>
                
                {/* Main Image Container */}
                <div className="relative h-full w-full p-4 sm:p-6">
                  <div className="relative h-full w-full rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-white to-gray-50 p-6">
                    <img
                      src={heroImage}
                      alt="Illustration of a person learning"
                      className="h-full w-full object-contain transform hover:scale-105 transition-all duration-700 hover:rotate-2"
                      loading="lazy"
                    />
                    {/* Floating Elements */}
                    <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg animate-float">
                      <Star className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div className="absolute bottom-4 left-4 bg-white rounded-full p-2 shadow-lg animate-float delay-500">
                      <Award className="w-6 h-6 text-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
            </aside>

          </div>
        </div>

        {/* =====  Benefits Section ===== */}

{/* =====  Benefits Section ===== */}

{/* =====  Benefits Section ===== */}
<section 
  className="relative w-full py-8 sm:py-12 mt-4 sm:mt-8 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900" 
  aria-label="Key benefits"
>
  <div className="absolute inset-0 bg-black/30"></div>

  <div className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
      {[
        { icon: <Users />, title: "50k+ Students", description: "Active learners worldwide", color: "from-cyan-400 to-blue-500" },
        { icon: <Award />, title: "Expert Instructors", description: "Industry professionals", color: "from-yellow-400 to-orange-500" },
        { icon: <Clock />, title: "24/7 Support", description: "Always here to help", color: "from-pink-400 to-rose-500" },
        { icon: <BookOpen />, title: "100+ Courses", description: "Comprehensive curriculum", color: "from-emerald-400 to-teal-500" },
      ].map(({ icon, title, description, color }) => (
        <div 
          key={title} 
          className="group flex flex-col items-center text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 
                     hover:bg-white/10 hover:scale-105 hover:shadow-xl transition-all duration-300"
        >
          <div 
            className={`p-3 rounded-xl shadow-md mb-4 bg-gradient-to-r ${color} group-hover:scale-110 
                        transition-transform duration-300`}
          >
            {React.cloneElement(icon, {
              className: "w-7 h-7 text-white",
            })}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors">
              {title}
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed group-hover:text-white transition-colors">
              {description}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

      </section>

      {/* ===== Enhanced Recent Courses Section ===== */}
      <section className="relative w-full bg-primary shadow-2xl py-12 sm:py-16 md:py-20 lg:py-24" aria-label="Recent courses">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-6" style={{background: 'var(--accent)', color: 'var(--primary)'}}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Featured Content
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold mb-4" style={{background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary-dark) 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>
              Latest Courses
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover our newest courses designed by industry experts to help you master the skills that matter most.
            </p>
          </div>

          {/* Enhanced Course List */}
          <div className="relative">
            <CourseList limit={9} />
            
            {/* Call to Action */}
            <div className="text-center mt-12">
              <Link
                to="/courses"
                className="btn-primary group inline-flex items-center px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 transform"
              >
                View All Courses
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default HomePage;
