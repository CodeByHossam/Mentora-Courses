import { toast } from "react-toastify";

export const handleApiError = (error) => {
  // RTK Query error shape
  const message =
    error?.data?.message ||
    error?.response?.data?.message ||
    error?.message ||
    "An error occurred";
    toast.error(message);
    return message;
};

export const handleApiSuccess = (message) => {
  toast.success(message);
};

export const handleApiLoading = (isLoading, message = "Loading...") => {
  if (isLoading) {
    toast.info(message);
  }
};
