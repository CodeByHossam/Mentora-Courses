import React from 'react';
import { BookOpen } from 'lucide-react';

const CourseSummary = ({ course }) => {
  if (!course) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
      <div className="flex items-center space-x-4">
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
          {course.imageUrl ? (
            <img
              src={course.imageUrl}
              alt={course.title}
              className="w-full h-full rounded-xl object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`${course.imageUrl ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
            <BookOpen className="w-8 h-8 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-gray-600 mt-1">by {course.instructor?.name}</p>
          <div className="flex items-center space-x-4 mt-2">
            {course.isFree ? (
              <span className="text-2xl font-bold text-green-600">FREE</span>
            ) : (
              <>
                {course.discountPercentage > 0 && (
                  <span className="text-lg text-gray-500 line-through">${course.price}</span>
                )}
                <span className="text-2xl font-bold text-indigo-600">
                  ${course.finalPrice}
                </span>
                {course.discountPercentage > 0 && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                    {course.discountPercentage}% OFF
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseSummary;
