import React from "react";

const ProfileStatus = ({ user }) => {
  if (!user) return null;

  return (
    <div className="flex items-center space-x-2 text-sm">
      {/* Profile Complete Status */}
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        ✅ Complete
      </span>
      
      {/* Account Status */}
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        🟢 Active
      </span>
      
      {/* Role Badge */}
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
        👤 {user.role}
      </span>
    </div>
  );
};

export default ProfileStatus;
