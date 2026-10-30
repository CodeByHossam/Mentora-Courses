import React from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Trash2, Loader2, BookOpen } from "lucide-react";
import { toast } from "react-toastify";
import {
  useGetWishlistQuery,
  useRemoveFromWishlistMutation,
} from "../store/services/wishlistApi";

const Wishlist = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useGetWishlistQuery();
  const [removeFromWishlist, { isLoading: removing }] =
    useRemoveFromWishlistMutation();

  const items = Array.isArray(data) ? data : data?.data || [];

  const handleRemove = async (courseId) => {
    try {
      await removeFromWishlist(courseId).unwrap();
      toast.success("Removed from wishlist");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to remove from wishlist");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-red-600">
        {error?.data?.message || "Failed to load wishlist"}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Heart className="w-7 h-7 text-pink-600" />
        <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Your wishlist is empty
          </h2>
          <p className="text-gray-500 mb-6">
            Save courses you want to purchase later.
          </p>
          <button
            onClick={() => navigate("/courses")}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Browse Courses
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const course = item.course || item;
            const courseId = course?._id || item.courseId;
            return (
              <div
                key={item._id || courseId}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col"
              >
                <div
                  className="h-40 bg-gray-100 flex items-center justify-center cursor-pointer"
                  onClick={() => courseId && navigate(`/courses/${courseId}`)}
                >
                  {course?.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-10 h-10 text-gray-300" />
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3
                    className="font-semibold text-gray-900 mb-2 cursor-pointer hover:text-blue-600"
                    onClick={() => courseId && navigate(`/courses/${courseId}`)}
                  >
                    {course?.title || "Untitled Course"}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                    {course?.description || ""}
                  </p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="font-bold text-blue-600">
                      {course?.price ? `$${course.price}` : "Free"}
                    </span>
                    <button
                      onClick={() => courseId && handleRemove(courseId)}
                      disabled={removing}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
