import React from "react";
import { Link } from "react-router-dom";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
    // You can also log the error to an error reporting service here
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-gray-100/50 p-8 text-center">
            <h1 className="text-3xl font-bold text-[rgb(33,40,50)] mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We apologize for the inconvenience. Please try refreshing the page
              or return to the home page.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-[rgb(48,146,85)] text-white rounded-lg hover:bg-[rgb(33,98,58)] transition-colors duration-300"
              >
                Refresh Page
              </button>
              <Link
                to="/home"
                className="px-6 py-3 border-2 border-[rgb(48,146,85)] text-[rgb(48,146,85)] rounded-lg hover:bg-[rgb(48,146,85)] hover:text-white transition-colors duration-300"
              >
                Go Home
              </Link>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mt-8 p-4 bg-gray-50 rounded-lg text-left overflow-auto">
                <h2 className="text-lg font-semibold text-[rgb(33,40,50)] mb-2">
                  Error Details (Development Only):
                </h2>
                <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {"\n"}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
