// components/PersistLogin.jsx
import { useEffect, useRef, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import usePersist from "../hooks/usePersist";
import ProgressLoader from "./ProgressLoader";
import { useRefreshMutation } from "../store/services/authApi";
import { selectCurrentToken } from "../store/slices/authSlice";

const PersistLogin = () => {
  const currentLocation = useLocation().pathname;
  const [persist] = usePersist();
  const token = useSelector(selectCurrentToken);
  const effectRan = useRef(false);
  const [isTryingRefresh, setIsTryingRefresh] = useState(true);

  const [refresh, { isLoading, isError, error }] = useRefreshMutation();

  useEffect(() => {
    const verifyRefreshToken = async () => {
      try {
        await refresh().unwrap();
      } catch (err) {
        console.error(
          "Refresh token failed:",
          err?.data || err?.message || err
        );
      } finally {
        setIsTryingRefresh(false);
      }
    };

    if (effectRan.current === true || process.env.NODE_ENV !== "development") {
      if (!token && persist) {
        verifyRefreshToken();
      } else {
        setIsTryingRefresh(false);
      }
    }

    return () => {
      effectRan.current = true;
    };
  }, [token, persist, refresh]);

  if (!persist) return <Outlet />;

  if (isTryingRefresh || isLoading)
    return <ProgressLoader isVisible={true} message="Loading..." />;

  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/courses",
    "/",
    "/about",
    "/contact",
  ];

  // Treat all /courses* routes as public
  const isCoursesRoute = currentLocation.startsWith("/courses");

  if (
    isError &&
    !token &&
    !isCoursesRoute &&
    !publicRoutes.includes(currentLocation)
  ) {
    return (
      <p className="errmsg">
        {`${error?.data?.message || "Session expired"} - `}
        <Link to="/login">Please login again</Link>.
      </p>
    );
  }

  return <Outlet />;
};

export default PersistLogin;
