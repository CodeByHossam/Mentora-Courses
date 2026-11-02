import React from "react";

const CourseStatusBadge = ({ status, size = "sm", showIcon = true }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case "published":
        return {
          label: "Published",
          icon: "✅",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          borderColor: "border-green-200"
        };
      case "draft":
        return {
          label: "Draft",
          icon: "📝",
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-800",
          borderColor: "border-yellow-200"
        };
      case "archived":
        return {
          label: "Archived",
          icon: "📦",
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
          borderColor: "border-gray-200"
        };
      default:
        return {
          label: "Draft",
          icon: "📝",
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-800",
          borderColor: "border-yellow-200"
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-2 text-base"
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]}`}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </span>
  );
};

export default CourseStatusBadge;
