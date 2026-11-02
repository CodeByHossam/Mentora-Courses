import React from "react";
import PropTypes from "prop-types";
import DOMPurify from "dompurify";
import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

const InstructorCard = ({ instructor }) => {
  if (!instructor) return null;

  const sanitizedBio = DOMPurify.sanitize(instructor.bio || "No bio available.");
  const trimmedBio = sanitizedBio.length > 120 ? sanitizedBio.substring(0, 120) + '...' : sanitizedBio;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 h-80 flex flex-col">
      <Link to={`/instructor/${encodeURIComponent(instructor._id)}`} className="block flex-1 flex flex-col">
        <div className="h-48 w-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          {instructor.avatar ? (
            <img
              src={instructor.avatar}
              alt={instructor.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`${instructor.avatar ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
            <GraduationCap className="w-16 h-16 text-white" />
          </div>
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {instructor.name}
          </h3>
          <p
            className="text-sm text-gray-600 flex-1"
            dangerouslySetInnerHTML={{ __html: trimmedBio }}
          />
        </div>
      </Link>
    </div>
  );
};

InstructorCard.propTypes = {
  instructor: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    bio: PropTypes.string,
    avatar: PropTypes.string,
  }).isRequired,
};

export default React.memo(InstructorCard);
// React.memo is used to prevent unnecessary re-renders