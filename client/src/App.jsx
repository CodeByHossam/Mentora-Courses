/**
 * Mentora Main Application Component
 */
import React, { Suspense, useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/responsive-fixes.css";

import { Layout } from "./components/layout";
import { ProtectedRoute } from "./components/layout";
import { PersistLogin } from "./components/layout";
import { ProgressLoader } from "./components/common";
import { ErrorBoundary } from "./components/common";
import { ScrollToTop } from "./components/common";

import AppRoutes from "./AppRoutes";

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <ProgressLoader isVisible={true} message="Loading..." />
  </div>
);

function App() {
  useEffect(() => {
    console.log("Vite MODE:", import.meta.env.MODE);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <ErrorBoundary>
          <main>
            <Suspense fallback={<PageLoader />}>
              <AppRoutes />
            </Suspense>
          </main>
        </ErrorBoundary>
      </Router>
      <ToastContainer />
    </div>
  );
}

export default App;
