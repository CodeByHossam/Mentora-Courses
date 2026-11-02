import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import InstructorNav from "./InstructorNav";

const InstructorLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-primary font-body">
      <InstructorNav
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      {/* Main content area with responsive padding based on sidebar state */}
      <div className={`transition-all duration-300 ${
        isSidebarOpen ? (isCollapsed ? 'lg:ml-20' : 'lg:ml-64') : 'lg:ml-0'
      }`}>
        <div className="min-h-screen p-4 lg:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default InstructorLayout;
