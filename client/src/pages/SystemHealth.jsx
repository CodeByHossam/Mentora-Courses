import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  Activity, 
  Server, 
  Database, 
  Wifi, 
  HardDrive,
  Cpu,
  MemoryStick,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  Globe
} from "lucide-react";
import { selectCurrentUser } from "../store/slices/authSlice";
import ProgressLoader from "../components/ProgressLoader";

const SystemHealth = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // System health state
  const [healthData, setHealthData] = useState({
    overall: {
      status: "healthy", // healthy, warning, critical
      uptime: "15 days, 4 hours, 23 minutes",
      lastRestart: "2024-01-15 10:30:00",
    },
    server: {
      status: "healthy",
      cpu: 23.5,
      memory: 67.2,
      disk: 45.8,
      load: [1.2, 1.5, 1.8],
      processes: 142,
    },
    database: {
      status: "healthy",
      connections: 15,
      maxConnections: 100,
      queryTime: 2.3,
      storage: 78.5,
      backupStatus: "completed",
      lastBackup: "2024-01-20 02:00:00",
    },
    network: {
      status: "healthy",
      latency: 12,
      bandwidth: 85.2,
      requests: 1247,
      errors: 3,
      upstreamServices: [
        { name: "Email Service", status: "healthy", responseTime: 45 },
        { name: "File Storage", status: "healthy", responseTime: 23 },
        { name: "Payment Gateway", status: "warning", responseTime: 156 },
        { name: "CDN", status: "healthy", responseTime: 8 },
      ]
    },
    application: {
      status: "healthy",
      activeUsers: 234,
      totalSessions: 1567,
      errorRate: 0.02,
      responseTime: 89,
      cacheHitRate: 94.5,
    }
  });

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/login");
    }
    loadHealthData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadHealthData, 30000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const loadHealthData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call - replace with actual health check endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate some random variations in metrics
      setHealthData(prev => ({
        ...prev,
        server: {
          ...prev.server,
          cpu: Math.max(10, Math.min(90, prev.server.cpu + (Math.random() - 0.5) * 10)),
          memory: Math.max(30, Math.min(95, prev.server.memory + (Math.random() - 0.5) * 5)),
        },
        application: {
          ...prev.application,
          activeUsers: Math.max(100, Math.min(500, prev.application.activeUsers + Math.floor((Math.random() - 0.5) * 20))),
          responseTime: Math.max(50, Math.min(200, prev.application.responseTime + Math.floor((Math.random() - 0.5) * 20))),
        }
      }));
      
      setLastUpdated(new Date());
    } catch (error) {
      toast.error("Failed to load system health data");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "critical":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      case "critical":
        return <XCircle className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const formatUptime = (uptime) => {
    return uptime || "Unknown";
  };

  if (isLoading && !healthData.overall.status) {
    return <ProgressLoader isVisible={true} message="Loading system health..." />;
  }

  return (
    <div className="max-w-7xl mx-auto py-4 md:py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-4 md:p-6 text-white mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 flex items-center">
              <Activity className="mr-3 h-8 w-8" />
              System Health Monitor
            </h1>
            <p className="text-green-100 text-sm md:text-base lg:text-lg">
              Real-time system performance and health metrics
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-green-100">Last Updated</div>
              <div className="text-white font-medium">
                {lastUpdated.toLocaleTimeString()}
              </div>
            </div>
            <button
              onClick={loadHealthData}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-white transition-colors"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Overall Status */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Overall System Status</h2>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthData.overall.status)}`}>
            {getStatusIcon(healthData.overall.status)}
            <span className="ml-2 capitalize">{healthData.overall.status}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-sm text-gray-500">Uptime</div>
              <div className="font-medium">{formatUptime(healthData.overall.uptime)}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Server className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-sm text-gray-500">Last Restart</div>
              <div className="font-medium">{healthData.overall.lastRestart || "Unknown"}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <div>
              <div className="text-sm text-gray-500">Performance</div>
              <div className="font-medium">Optimal</div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Server Metrics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Server className="mr-2 h-5 w-5 text-blue-500" />
              Server Performance
            </h3>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(healthData.server.status)}`}>
              {getStatusIcon(healthData.server.status)}
              <span className="ml-1 capitalize">{healthData.server.status}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center">
                  <Cpu className="mr-1 h-4 w-4" />
                  CPU Usage
                </span>
                <span className="font-medium">{healthData.server.cpu.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${healthData.server.cpu > 80 ? 'bg-red-500' : healthData.server.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${healthData.server.cpu}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center">
                  <MemoryStick className="mr-1 h-4 w-4" />
                  Memory Usage
                </span>
                <span className="font-medium">{healthData.server.memory.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${healthData.server.memory > 85 ? 'bg-red-500' : healthData.server.memory > 70 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                  style={{ width: `${healthData.server.memory}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center">
                  <HardDrive className="mr-1 h-4 w-4" />
                  Disk Usage
                </span>
                <span className="font-medium">{healthData.server.disk.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${healthData.server.disk > 90 ? 'bg-red-500' : healthData.server.disk > 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${healthData.server.disk}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="text-sm text-gray-500 mb-2">System Load (1m, 5m, 15m)</div>
              <div className="flex space-x-4">
                {healthData.server.load.map((load, index) => (
                  <div key={index} className="text-center">
                    <div className="text-lg font-bold text-gray-900">{load}</div>
                    <div className="text-xs text-gray-500">{index === 0 ? '1m' : index === 1 ? '5m' : '15m'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Database Metrics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Database className="mr-2 h-5 w-5 text-green-500" />
              Database Health
            </h3>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(healthData.database.status)}`}>
              {getStatusIcon(healthData.database.status)}
              <span className="ml-1 capitalize">{healthData.database.status}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Active Connections</div>
                <div className="text-2xl font-bold text-gray-900">
                  {healthData.database.connections}
                  <span className="text-sm text-gray-500 font-normal">/{healthData.database.maxConnections}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Avg Query Time</div>
                <div className="text-2xl font-bold text-gray-900">
                  {healthData.database.queryTime}
                  <span className="text-sm text-gray-500 font-normal">ms</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Storage Usage</span>
                <span className="font-medium">{healthData.database.storage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${healthData.database.storage > 90 ? 'bg-red-500' : healthData.database.storage > 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${healthData.database.storage}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-500">Backup Status</div>
                  <div className="font-medium capitalize text-green-600">{healthData.database.backupStatus}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Last Backup</div>
                  <div className="font-medium">{healthData.database.lastBackup}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Network & Application Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Status */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Wifi className="mr-2 h-5 w-5 text-purple-500" />
              Network & Services
            </h3>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(healthData.network.status)}`}>
              {getStatusIcon(healthData.network.status)}
              <span className="ml-1 capitalize">{healthData.network.status}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Latency</div>
                <div className="text-xl font-bold text-gray-900">{healthData.network.latency}ms</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Bandwidth Usage</div>
                <div className="text-xl font-bold text-gray-900">{healthData.network.bandwidth}%</div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="text-sm font-medium text-gray-900 mb-2">Upstream Services</div>
              <div className="space-y-2">
                {healthData.network.upstreamServices.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        service.status === 'healthy' ? 'bg-green-500' : 
                        service.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm font-medium">{service.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{service.responseTime}ms</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Application Metrics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Globe className="mr-2 h-5 w-5 text-indigo-500" />
              Application Performance
            </h3>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(healthData.application.status)}`}>
              {getStatusIcon(healthData.application.status)}
              <span className="ml-1 capitalize">{healthData.application.status}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  Active Users
                </div>
                <div className="text-2xl font-bold text-gray-900">{healthData.application.activeUsers}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Response Time</div>
                <div className="text-2xl font-bold text-gray-900">
                  {healthData.application.responseTime}
                  <span className="text-sm text-gray-500 font-normal">ms</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Error Rate</div>
                <div className="text-xl font-bold text-gray-900">{(healthData.application.errorRate * 100).toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Cache Hit Rate</div>
                <div className="text-xl font-bold text-gray-900">{healthData.application.cacheHitRate}%</div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="text-sm text-gray-500">Total Sessions Today</div>
              <div className="text-2xl font-bold text-gray-900">{healthData.application.totalSessions.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <div className="flex items-center justify-center">
          <RefreshCw className="mr-1 h-4 w-4" />
          Auto-refreshing every 30 seconds
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
