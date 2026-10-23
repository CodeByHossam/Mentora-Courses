import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Home,
  BookOpen,
  Video,
  Award,
  Search,
  FileText,
  Calendar,
  Star,
  User,
  CreditCard,
  MessageSquare,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Settings,
  Gift,
} from "lucide-react";
import { selectCurrentUser, sendLogout } from "../store/slices/authSlice";

const navItems = [
  { name: "Dashboard", path: "/student/dashboard", icon: Home },
  { name: "My Courses", path: "/student/courses", icon: BookOpen },
  { name: "Live Sessions", path: "/student/live-sessions", icon: Video },
  { name: "Certificates", path: "/student/certificates", icon: Award },
  { name: "Course List", path: "/courses", icon: Search },
  { name: "Assignments", path: "/student/assignments", icon: FileText },
  { name: "Grades", path: "/student/grades", icon: Star },
];

const accountItems = [
  { name: "Profile", path: "/profile", icon: User },
  { name: "Billing", path: "/billing", icon: Wallet },
  { name: "Gift Cards", path: "/student/gift-cards", icon: Gift },
  { name: "Payments", path: "/student/payments", icon: CreditCard },
  { name: "Messages", path: "/student/messages", icon: MessageSquare },
];

const StudentNav = ({
  isCollapsed,
  setIsCollapsed,
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  const handleLogout = async () => {
    await dispatch(sendLogout());
    navigate("/login");
  };

  const handleNavClick = (path) => {
    navigate(path);
  };

  return (
    <>
      {/* Header */}
      <div
        className={`transition-all duration-300 flex ${
          isSidebarOpen ? "justify-center" : "justify-start"
        } items-center bg-soDark px-4 py-4 lg:px-10 w-full border-b shadow-sm`}
        style={{ borderColor: "var(--card-border)" }}
      >
        <button
          className="mr-2 md:mr-3 border rounded-full p-1 shadow cursor-pointer"
          style={{ borderColor: "var(--card-border)" }}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <span className="text-white">
            {isSidebarOpen ? <X size={0} /> : <Menu size={20} />}
          </span>
        </button>
        <h1 className="text-xl font-bold font-heading text-white flex justify-center">
          Student Dashboard
        </h1>
      </div>

      {/* Sidebar */}
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
        {/* Close Button */}
        <div
          className={`absolute -right-3 top-20 lg:top-24 z-50 transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="bg-white border rounded-full p-1 shadow"
            style={{ borderColor: "var(--card-border)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Collapse Button */}
        <div className="absolute -right-3 top-32 lg:top-36 z-50">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="bg-white border rounded-full p-1 shadow"
            style={{ borderColor: "var(--card-border)" }}
          >
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            {user?.avatar ? (
              <img
                src={user?.avatar}
                alt="Avatar"
                onError={(e) => (e.currentTarget.hidden = true)}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-[var(--accent)] text-[var(--primary)] rounded-full flex items-center justify-center">
                <User size={20} />
              </div>
            )}
            <div
              className={`transition-all duration-300 overflow-hidden ${
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              }`}
            >
              <p className="font-medium">{user?.name || "Student"}</p>
              <p className="text-sm text-gray-500">
                {user?.email || "user@email.com"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-2 py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="space-y-1">
            {navItems.map(({ name, path, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <button
                  key={name}
                  onClick={() => handleNavClick(path)}
                  className={`w-full flex items-center rounded-lg px-3 py-2 text-sm transition
                    ${
                      active
                        ? "bg-darkColor text-white"
                        : "text-secondary hover:bg-accent"
                    }
                  `}
                >
                  <Icon size={20} />
                  <span
                    className={`ml-3 transition-all duration-300 ${
                      isCollapsed
                        ? "opacity-0 w-0 overflow-hidden"
                        : "opacity-100 w-auto"
                    }`}
                  >
                    {name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-1 border-t pt-4">
            {accountItems.map(({ name, path, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <button
                  key={name}
                  onClick={() => handleNavClick(path)}
                  className={`w-full flex items-center rounded-lg px-3 py-2 text-sm transition
                    ${
                      active
                        ? "bg-soDark text-white"
                        : "text-secondary hover:bg-accent"
                    }
                  `}
                >
                  <Icon size={20} />
                  <span
                    className={`ml-3 transition-all duration-300 ${
                      isCollapsed
                        ? "opacity-0 w-0 overflow-hidden"
                        : "opacity-100 w-auto"
                    }`}
                  >
                    {name}
                  </span>
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
            <span
              className={`ml-3 transition-all duration-300 ${
                isCollapsed
                  ? "opacity-0 w-0 overflow-hidden"
                  : "opacity-100 w-auto"
              }`}
            >
              Logout
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default StudentNav;
