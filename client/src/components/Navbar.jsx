/**
 * Navigation Bar Component
 *
 * Main navigation component that provides site-wide navigation with role-based
 * menu items and responsive design. Handles user authentication state and
 * provides appropriate navigation options based on user role.
 *
 * Features:
 * - Responsive design (mobile hamburger menu, desktop horizontal menu)
 * - Role-based navigation (Admin, Instructor, Student, Public)
 * - User profile dropdown with logout functionality
 * - Authentication state management
 * - Mobile-first design with progressive enhancement
 *
 * @component
 * @returns {JSX.Element} Navigation bar with role-based menu items
 */

import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useLogoutMutation } from "../store/services/authApi";
import {
  selectIsAuthenticated,
  selectCurrentUser,
} from "../store/slices/authSlice";
import { toast } from "react-toastify";

// Import Lucide React icons for consistent UI
import {
  Home, // Home page icon
  BookOpen, // Courses and learning icon
  Info, // About page icon
  Mail, // Contact page icon
  LayoutDashboard, // Dashboard icon
  User, // User profile icon
  LogOut, // Logout icon
  LogIn, // Login icon
  UserPlus, // Registration icon
  Menu, // Mobile menu open icon
  X, // Mobile menu close icon
  HelpCircle, // Help page icon
} from "lucide-react";

// Import NotificationBell component
import NotificationBell from "./NotificationBell";

/**
 * Main Navbar Component
 * Manages navigation state, user authentication, and responsive menu behavior
 */
function Navbar() {
  // State management for mobile menu and profile dropdown
  const [menuOpen, setMenuOpen] = useState(false); // Controls mobile hamburger menu
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false); // Controls profile dropdown

  // Redux state selectors for authentication
  const isAuthenticated = useSelector(selectIsAuthenticated); // Check if user is logged in
  const user = useSelector(selectCurrentUser); // Get current user data

  // Navigation and API hooks
  const navigate = useNavigate(); // For programmatic navigation
  const [logout] = useLogoutMutation(); // Logout API mutation
  const profileDropdownRef = useRef(null); // Ref for dropdown click outside detection

  /**
   * Effect to handle clicking outside profile dropdown
   * Closes dropdown when user clicks elsewhere on the page
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside the profile dropdown
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    // Add event listener for clicks
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /**
   * Handle user logout
   * Calls logout API, navigates to login page, and shows success message
   */
  const handleLogout = async () => {
    try {
      // Call logout API to clear server-side session
      await logout().unwrap();

      // Navigate to login page
      navigate("/login");

      // Show success message to user
      toast.success("Logout successful!");
    } catch (err) {
      // Logout error handled silently
    }
  };

  return (
    <nav className="fixed top-0 left-0 z-50 h-16 md:h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full bg-white shadow-lg">
      {/* Logo */}
      <Link
        to="/"
        className="text-lg sm:text-xl md:text-2xl lg:text-2xl transition-colors duration-300 flex items-center gap-2 flex-shrink-0"
        style={{color: 'var(--primary)'}}
        onMouseEnter={(e) => e.target.style.color = 'var(--primary-dark)'}
        onMouseLeave={(e) => e.target.style.color = 'var(--primary)'}
      >
        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 lg:w-7 lg:h-7" />
        <span className="font-decorative font-bold truncate">Mentora</span>
      </Link>

      {/* Navigation Links */}
      <ul
        className={`fixed top-0 left-0 w-full h-screen backdrop-blur-md flex flex-col items-center justify-center gap-6 transition-all duration-500 ease-in-out z-40
          ${
            menuOpen
              ? "translate-x-0 opacity-100 bg-secondary"
              : "translate-x-full opacity-0"
          } 
          lg:static lg:w-auto lg:h-auto lg:bg-transparent lg:backdrop-blur-none lg:flex-row lg:translate-x-0 lg:opacity-100 lg:gap-3 xl:gap-4`}
      >
        <li>
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="nav-item nav-underline py-2 text-base lg:text-sm font-medium transition-all duration-300 lg:px-2 xl:px-3 flex items-center gap-2 whitespace-nowrap"
            style={{color: 'var(--text-secondary)'}}
          >
            <Home className="w-5 h-5" />
            Home
          </Link>
        </li>
        <li>
          <Link
            to="/courses"
            onClick={() => setMenuOpen(false)}
            className="nav-item nav-underline py-2 text-base lg:text-sm font-medium transition-all duration-300 lg:px-2 xl:px-3 flex items-center gap-2 whitespace-nowrap"
            style={{color: 'var(--text-secondary)'}}
          >
            <BookOpen className="w-5 h-5" />
            Courses
          </Link>
        </li>
        <li>
          <Link
            to="/contact"
            onClick={() => setMenuOpen(false)}
            className="nav-item nav-underline py-2 text-base lg:text-sm font-medium transition-all duration-300 lg:px-2 xl:px-3 flex items-center gap-2 whitespace-nowrap"
            style={{color: 'var(--text-secondary)'}}
          >
            <Mail className="w-5 h-5" />
            Contact
          </Link>
        </li>

        <li>
          <Link
            to="/about"
            onClick={() => setMenuOpen(false)}
            className="nav-item nav-underline py-2 text-base lg:text-sm font-medium transition-all duration-300 lg:px-2 xl:px-3 flex items-center gap-2 whitespace-nowrap"
            style={{color: 'var(--text-secondary)'}}
          >
            <Info className="w-5 h-5" />
            About
          </Link>
        </li>
        <li>
          <Link
            to="/help"
            onClick={() => setMenuOpen(false)}
            className="nav-item nav-underline py-2 text-base lg:text-sm font-medium transition-all duration-300 lg:px-2 xl:px-3 flex items-center gap-2 whitespace-nowrap"
            style={{color: 'var(--text-secondary)'}}
          >
            <HelpCircle className="w-5 h-5" />
            Help
          </Link>
        </li>
        {/* {appear only after logging in} */}
        {isAuthenticated ? (
          <>
            <li>
              <Link
                to={
                  user?.role === "admin"
                    ? "/admin"
                    : user?.role === "instructor"
                    ? "/instructor"
                    : "/student"
                }
                onClick={() => setMenuOpen(false)}
                className="nav-item nav-underline py-2 text-base lg:text-sm font-medium transition-all duration-300 lg:px-2 xl:px-3 flex items-center gap-2 whitespace-nowrap"
            style={{color: 'var(--text-secondary)'}}
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>
            </li>

            {/* Notification Bell */}
            <li className="lg:ml-2">
              <NotificationBell className="text-secondary hover:text-primary transition-all duration-300" />
            </li>

            <li className="lg:ml-2 xl:ml-4 nav-underline">
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() =>
                    setIsProfileDropdownOpen(!isProfileDropdownOpen)
                  }
                  className="flex items-center space-x-1 lg:space-x-2 text-secondary hover:text-primary  transition-all duration-300 p-1 rounded-md"
                >
                  <User className="w-5 h-5 " />
                  <span className="hidden md:block text-sm lg:text-base truncate max-w-24 lg:max-w-none">
                    {user?.name || "Profile"}
                  </span>
                </button>
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 md:w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                    <Link
                      to="/profile"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setMenuOpen(false);
                      }}
                      className="block px-3 md:px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="inline h-4 w-4 mr-2" />
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsProfileDropdownOpen(false);
                        setMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 md:px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="inline h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </li>
          </>
        ) : (
          <>
            <li className="lg:ml-2 xl:ml-4">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="btn-primary py-2 px-3 lg:px-3 xl:px-4 text-sm lg:text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
              >
                <LogIn className="w-4 h-4 lg:w-5 lg:h-5" />
                Login
              </Link>
            </li>
            <li>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="btn-secondary py-2 px-3 lg:px-3 xl:px-4 text-sm lg:text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4 lg:w-5 lg:h-5" />
                Sign Up
              </Link>
            </li>
          </>
        )}
      </ul>

      {/* Burger Button */}
      <span className="lg:hidden">
        
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="relative w-8 h-8 md:w-10 md:h-10 flex flex-col justify-center items-center z-50 lg:hidden p-1 rounded-md hover:bg-gray-100 transition-colors "
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <X className="w-6 h-6 md:w-7 md:h-7" />
          ) : (
            <Menu className="w-6 h-6 md:w-7 md:h-7" />
          )}
        </button>
      </span>
    </nav>
  );
}

export default Navbar;
