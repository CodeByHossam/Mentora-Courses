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

  return null;
};

export default SystemHealth;
