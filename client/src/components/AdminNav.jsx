import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Home,
  BookOpen,
  Users,
  FileText,
  Wallet,
  DollarSign,
  CreditCard,
  Video,
  GraduationCap,
  Tags,
  BarChart3,
  User,
  MessageSquare,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  Layers,
  Send,
  Gift,
  Trash2,
} from "lucide-react";
import { selectCurrentUser, sendLogout } from "../store/slices/authSlice";

// ---------------- NAVIGATION CONFIG ----------------
const navItems = [
  { name: "Dashboard", path: "/admin", icon: Home },
  { name: "Courses", path: "/admin/manage-courses", icon: BookOpen },
  { name: "Users", path: "/admin/manage-users", icon: Users },
  { name: "Enrollments", path: "/admin/enrollment-requests", icon: FileText },
  { name: "Financial Dashboard", path: "/admin/billing", icon: Wallet },
  { name: "Payments Reports", path: "/admin/payments", icon: CreditCard },
  { name: "Instructor Payouts", path: "/admin/instructor-payouts", icon: Send },
  { name: "Gift Cards", path: "/admin/gift-cards", icon: Gift },
  { name: "Live Sessions", path: "/admin/live-sessions", icon: Video },
  { name: "Instructors", path: "/admin/instructors", icon: GraduationCap },
  { name: "Categories", path: "/admin/manage-categories", icon: Tags },
  { name: "Levels", path: "/admin/levels", icon: Layers },
  { name: "Reports", path: "/admin/reports", icon: BarChart3 },
];

const accountItems = [
  { name: "Profile", path: "/profile", icon: User },
  { name: "Messages", path: "/admin/messages", icon: MessageSquare },
  { name: "Settings", path: "/admin/settings", icon: Settings },
  { name: "🗑️ Bulk Delete", path: "/admin/bulk-delete", icon: Trash2 },
];

// ---------------- COMPONENT ----------------
const AdminNav = ({
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
      {/* ---------------- Admin HEADER ---------------- */}
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
          Admin Panel
        </h1>
      </div>

      {/* ---------------- SIDEBAR ---------------- */}

      <div
        className={`
          fixed top-0 left-0 pt-16 md:pt-0 lg:pt-24 h-screen flex flex-col bg-white border-r z-40
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
        {/* ---------------- FLOATING TOGGLE BUTTON ---------------- */}
        {/* ✅ Always visible  */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-22 bg-white border rounded-full p-1 shadow hidden lg:flex"
          style={{ borderColor: "var(--card-border)" }}
        >
          {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Collapse Button (Chevron) → Shrinks width */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-35 bg-white border rounded-full p-1 shadow hidden md:flex"
          style={{ borderColor: "var(--card-border)" }}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {/* ---------------- USER INFO ---------------- */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            {user?.avatar && user.avatar.trim() !== "" ? (
              <img
                src={user.avatar}
                alt={user.name || "User"}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--accent-dark)" }}
              >
                <User
                  className="w-6 h-6"
                  style={{ color: "var(--text-muted)" }}
                />
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1">
                <p className="font-medium text-primary">
                  {user?.name || "Admin"}
                </p>
                <p className="text-sm text-muted">
                  {user?.email || "admin@email.com"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ---------------- NAVIGATION LINKS ---------------- */}
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

          {/* ---------------- ACCOUNT LINKS ---------------- */}
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

        {/* ---------------- LOGOUT BUTTON ---------------- */}
        <div
          className="p-4 border-t"
          style={{ borderColor: "var(--card-border)" }}
        >
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors"
            style={{ color: "var(--error)" }}
            onMouseEnter={(e) =>
              (e.target.style.backgroundColor = "var(--error-light)")
            }
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = "transparent")
            }
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminNav;
