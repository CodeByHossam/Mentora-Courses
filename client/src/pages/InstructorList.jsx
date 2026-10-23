import React from "react";
import { useGetUsersQuery } from "../store/services/userApi";
import InstructorCard from "../components/InstructorCard";
import ProgressLoader from "../components/ProgressLoader";
import { handleApiError } from "../utils/apiErrorHandler";


const InstructorList = () => {
  const { data: users, isLoading, error } = useGetUsersQuery();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ProgressLoader isVisible={true} message="Loading instructors..." />
      </div>
    );
  }

  if (error) {
    handleApiError(error);
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-red-600">
          {error.data?.message || "Failed to load instructors"}
        </p>
      </div>
    );
  }

  const instructors = users?.filter((user) => user.role === "instructor") || [];

  return (
    <div className="min-h-screen bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold  bg-clip-text text-primary">
              👨‍🏫 Meet Our Instructors
            </h1>
            <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
              Discover our talented instructors who are passionate about sharing their knowledge and helping you succeed
            </p>
            <div className="mt-4 flex justify-center items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Total Instructors: {instructors?.length || 0}</span>
            </div>
          </div>
        </div>

        {instructors.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {instructors.map((instructor) => (
              <InstructorCard key={instructor._id} instructor={instructor} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="flex flex-col items-center">
              <div className="text-8xl mb-6">👨‍🏫</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No instructors found
              </h3>
              <p className="text-gray-600 mb-8 max-w-md">
                We're currently building our team of amazing instructors. Check back soon for exciting courses!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorList;
