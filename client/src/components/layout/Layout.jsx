import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-primary font-body">
      {/* Header */}
      <header className="fixed h-16 md:h-20 top-0 left-0 w-full bg-white backdrop-blur-md shadow-md z-50 border-b border-gray-100">
          <Navbar />
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full overflow-x-hidden mt-20">
          <Outlet />
      </main>

      {/* Footer */}
      <footer className="w-full mt-auto border-t border-gray-100">
          <Footer />
      </footer>
    </div>
  );
}
