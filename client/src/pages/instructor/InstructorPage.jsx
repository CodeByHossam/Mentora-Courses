import React from "react";
import { useParams, Link } from "react-router-dom";
import { useGetUserQuery } from "../../store/services/userApi";
import { ProgressLoader } from "../../components/common";
import { Mail, Award, BookOpen, Users, Calendar, Star, CheckCircle, ExternalLink, Printer, ArrowLeft, GraduationCap, Briefcase, CreditCard, User } from "lucide-react";

const InfoRow = ({ label, value, mono = false }) => (
  <div className="flex flex-col gap-1">
    <span className="text-sm text-text-secondary">{label}</span>
    <span
      className={
        mono ? "font-mono text-text-primary break-all" : "text-text-primary"
      }
    >
      {value || "N/A"}
    </span>
  </div>
);

const Section = ({ title, children }) => (
  <section className="card space-y-4">
    <h2 className="text-xl font-semibold text-text-primary border-b border-border-light pb-2">
      {title}
    </h2>
    {children}
  </section>
);

const InstructorPage = () => {
  const { id } = useParams();
  const { data: user, isLoading, isError, error } = useGetUserQuery(id);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ProgressLoader
          isVisible={true}
          message="Loading instructor profile..."
        />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center">
        <div className="card">
          <p className="text-red-600 font-medium mb-2">
            Failed to load instructor profile.
          </p>
          {!!error?.data?.message && (
            <p className="text-sm text-text-secondary">{error.data.message}</p>
          )}
          <div className="mt-4">
            <Link to="/instructors" className="btn btn-secondary">
              Back to Instructors
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user.role !== "instructor") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center">
        <div className="card">
          <p className="text-text-secondary">This user is not an instructor.</p>
          <div className="mt-4">
            <Link to="/instructors" className="btn btn-secondary">
              Back to Instructors
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const profile = user.instructorProfile || {};
  const created = user.createdAt ? new Date(user.createdAt) : null;

  return null;
};

export default InstructorPage;
