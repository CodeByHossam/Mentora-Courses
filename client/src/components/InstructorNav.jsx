import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Home,
  BookOpen,
  Video,
  Users,
  MessageSquare,
  BarChart3,
  Plus,
  User,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Layers,
  Settings,
  Send,
  CreditCard,
  Gift,
} from "lucide-react";
import { selectCurrentUser, sendLogout } from "../store/slices/authSlice";

// ---------------- NAVIGATION CONFIG ----------------

const navItems = [
  { name: "Dashboard", path: "/instructor", icon: Home },
  { name: "My Courses", path: "/instructor/courses", icon: BookOpen },
  { name: "Create Course", path: "/instructor/courses/new", icon: Plus },
  { name: "Live Sessions", path: "/instructor/live-sessions", icon: Video },
  { name: "My Students", path: "/instructor/students", icon: Users },
  {
    name: "Payments & Enrollment",
    path: "/instructor/payments",
    icon: CreditCard,
  },
  { name: "Earnings Dashboard", path: "/instructor/billing", icon: Wallet },
  { name: "Gift Cards", path: "/instructor/gift-cards", icon: Gift },
  // Payout Requests removed - admin pays directly now, view history in billing page
  { name: "Levels", path: "/instructor/levels", icon: Layers },
  { name: "Reports", path: "/instructor/reports", icon: BarChart3 },
];

const accountItems = [
  { name: "Profile", path: "/profile", icon: User },
  { name: "Messages", path: "/instructor/messages", icon: MessageSquare },
];

// ---------------- COMPONENT ----------------

const InstructorNav = ({
  isCollapsed,
  setIsCollapsed,
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  // Logout handler
  const handleLogout = async () => {
    await dispatch(sendLogout());
    navigate("/login");
  };

  // Navigation click handler
  const handleNavClick = (path) => {
    navigate(path);
  };

  return (
    <>
      {/* ---------------- INSTRUCTOR HEADER ---------------- */}
      <div
        className={`flex ${
          isSidebarOpen ? "justify-center" : "justify-start"
        } items-center justify-between bg-darkColor px-4 py-4 lg:py-4 lg:px-10 w-full border-b shadow-sm"`}
        style={{ borderColor: "var(--card-border)" }}
      >
        <button
          className="mr-2 md:mr-3 border rounded-full p-1 shadow cursor-pointer"
          style={{ borderColor: "var(--card-border)" }}
          onClick={() => {
            setIsSidebarOpen(!isSidebarOpen);
          }}
        >
          <span className="text-white">
            {isSidebarOpen ? <X size={0} /> : <Menu size={20} />}
          </span>
        </button>

        <h1 className="text-xl font-bold font-heading text-white">
          Instructor Panel
        </h1>
      </div>

      {/* ---------------- SIDEBAR ---------------- */}
      {isSidebarOpen && (
        <div
          className={`
          fixed top-0 left-0 pt-16 md:pt-0 lg:pt-24 flex flex-col h-screen bg-white  border-r z-40
           ease-in-out
          transition-[width,transform,opacity]
          ${
            isSidebarOpen
              ? "translate-x-0 opacity-100"
              : "-translate-x-full opacity-0"
          }
          ${isCollapsed ? "w-20" : "w-64"}
        `}
          style={{ borderColor: "var(--card-border)" }}
        >
          {/* Floating Close Button (visible on large screens) */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute -right-3 top-20 lg:top-24 z-50 bg-white border border-gray-300 rounded-full p-1 shadow flex"
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-32 lg:top-36 z-50 bg-white border border-gray-300 rounded-full p-1 shadow flex"
          >
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>

          {/* Logo / User Info */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              {user?.avatar ? (
                <img
                  src={user?.avatar || "https://via.placeholder.com/40"}
                  alt="Avatar"
                  onError={(e) => (e.currentTarget.hidden = true)}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-[var(--accent)] text-[var(--primary)] rounded-full flex items-center justify-center">
                  <User size={20} />
                </div>
              )}
              {!isCollapsed && (
                <div className="flex-1">
                  <p className="font-medium">{user?.name || "Instructor"}</p>
                  <p className="text-sm text-gray-500">
                    {user?.email || "instructor@email.com"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-2 py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="space-y-1">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full flex items-center rounded-lg px-3 py-2 text-sm transition
                    ${
                      active
                        ? "bg-darkColor text-white"
                        : "text-secondary hover:bg-accent"
                    }
                  `}
                  >
                    <Icon size={20} />
                    {!isCollapsed && <span className="ml-3">{item.name}</span>}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-1 border-t pt-4">
              {accountItems.map((item) => {
                const active = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full flex items-center rounded-lg px-3 py-2 text-sm transition
                    ${
                      active
                        ? "bg-soDark text-white"
                        : "text-secondary hover:bg-accent"
                    }
                  `}
                  >
                    <Icon size={20} />
                    {!isCollapsed && <span className="ml-3">{item.name}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logout */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50"
            >
              <LogOut size={20} />
              {!isCollapsed && <span className="ml-3">Logout</span>}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstructorNav;
