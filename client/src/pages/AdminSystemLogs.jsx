import React, { useState, useEffect } from "react";
import { handleApiSuccess, handleApiError } from "../utils/apiErrorHandler";

const AdminSystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    level: "all",
    dateRange: "today",
    search: ""
  });
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Mock log data for demonstration
  const mockLogs = [
    {
      id: 1,
      timestamp: new Date().toISOString(),
      level: "info",
      message: "User authentication successful",
      source: "auth-service",
      userId: "user123",
      ip: "192.168.1.100"
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 300000).toISOString(),
      level: "warning",
      message: "High memory usage detected",
      source: "system-monitor",
      details: "Memory usage: 85%"
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 600000).toISOString(),
      level: "error",
      message: "Database connection timeout",
      source: "database",
      error: "Connection timeout after 30s"
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 900000).toISOString(),
      level: "info",
      message: "Course created successfully",
      source: "course-service",
      courseId: "course456",
      userId: "instructor789"
    },
    {
      id: 5,
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      level: "debug",
      message: "API request processed",
      source: "api-gateway",
      endpoint: "/api/courses",
      responseTime: "120ms"
    }
  ];

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLogs(mockLogs);
    } catch (error) {
      handleApiError(error, "Failed to fetch system logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 10000); // Refresh every 10 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleClearLogs = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setLogs([]);
      handleApiSuccess("System logs cleared successfully");
    } catch (error) {
      handleApiError(error, "Failed to clear system logs");
    }
  };

  const handleExportLogs = async () => {
    try {
      // Simulate log export
      const logData = logs.map(log => 
        `${log.timestamp} [${log.level.toUpperCase()}] ${log.source}: ${log.message}`
      ).join('\n');
      
      const blob = new Blob([logData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-logs-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      handleApiSuccess("System logs exported successfully");
    } catch (error) {
      handleApiError(error, "Failed to export system logs");
    }
  };

  const getLogLevelColor = (level) => {
    switch (level) {
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "debug":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getLogIcon = (level) => {
    switch (level) {
      case "error":
        return "🚨";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      case "debug":
        return "🔍";
      default:
        return "📝";
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filters.level !== "all" && log.level !== filters.level) return false;
    if (filters.search && !log.message.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent">
                📋 System Logs
              </h1>
              <p className="mt-2 text-gray-600">
                Monitor system activities and troubleshoot issues
              </p>
              <div className="mt-4 flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Total Logs: {logs.length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Filtered: {filteredLogs.length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${autoRefresh ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600">
                    Auto-refresh: {autoRefresh ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  autoRefresh 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {autoRefresh ? '⏸️ Pause' : '▶️ Auto-refresh'}
              </button>
              <button
                onClick={handleExportLogs}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
              >
                📥 Export Logs
              </button>
              <button
                onClick={handleClearLogs}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium"
              >
                🗑️ Clear Logs
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📊 Log Level
              </label>
              <select
                value={filters.level}
                onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="all">All Levels</option>
                <option value="error">🚨 Error</option>
                <option value="warning">⚠️ Warning</option>
                <option value="info">ℹ️ Info</option>
                <option value="debug">🔍 Debug</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Search
              </label>
              <input
                type="text"
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading system logs...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log, index) => (
                    <tr key={log.id} className={`hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getLogLevelColor(log.level)}`}>
                          <span className="mr-1">{getLogIcon(log.level)}</span>
                          {log.level.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md">
                          {log.source}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md">
                          {log.message}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-500 max-w-xs">
                          {log.details && <div>Details: {log.details}</div>}
                          {log.userId && <div>User: {log.userId}</div>}
                          {log.ip && <div>IP: {log.ip}</div>}
                          {log.error && <div className="text-red-600">Error: {log.error}</div>}
                          {log.responseTime && <div>Response: {log.responseTime}</div>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="text-6xl mb-4">📋</div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
                          <p className="text-gray-500">Try adjusting your filters or check back later</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Log Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          {['error', 'warning', 'info', 'debug'].map(level => {
            const count = logs.filter(log => log.level === level).length;
            const percentage = logs.length > 0 ? ((count / logs.length) * 100).toFixed(1) : 0;
            
            return (
              <div key={level} className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
                level === 'error' ? 'border-red-500' :
                level === 'warning' ? 'border-yellow-500' :
                level === 'info' ? 'border-blue-500' : 'border-gray-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 capitalize">
                      {getLogIcon(level)} {level}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{percentage}%</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminSystemLogs;
