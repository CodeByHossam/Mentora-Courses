//base api
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCredentials, sendLogout } from "../slices/authSlice";
const baseUrl =
  import.meta.env.MODE === "production"
    ? "https://mentora-api-rqbb.onrender.com/api"
    : "http://localhost:5000/api";

const refreshUrl =
  import.meta.env.MODE === "production"
    ? "https://mentora-api-rqbb.onrender.com/api/auth/refresh"
    : "http://localhost:5000/api/auth/refresh";
const baseQuery = fetchBaseQuery({
  baseUrl,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    // Attach CSRF token header if cookie is present (double-submit pattern)
    try {
      const cookies = document.cookie?.split(";") || [];
      const csrfCookie = cookies.find(
        (c) => typeof c === "string" && c.trim().startsWith("csrf-token=")
      );
      if (csrfCookie) {
        const csrfToken = csrfCookie.split("=")[1];
        if (csrfToken) {
          headers.set("X-CSRF-Token", csrfToken);
        }
      }
    } catch {}
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 500 || result.error?.status === 403) {
    try {
      const refreshResponse = await fetch(refreshUrl, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const refreshData = await refreshResponse.json();

      if (refreshData.success && refreshData.data?.accessToken) {
        api.dispatch(
          setCredentials({
            accessToken: refreshData.data.accessToken,
            user: api.getState().auth.user,
            //try to use decoded data !!!!!!!!!!!!!!!!!
          })
        );

        result = await baseQuery(args, api, extraOptions);
      } else {
        console.error("Refresh token failed:");
        api.dispatch(sendLogout());
      }
    } catch (error) {
      console.error("Error during token refresh:", error);
      api.dispatch(sendLogout());
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "apiSlice",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Course",
    "Progress",
    "Category",
    "User",
    "LiveSession",
    "BillingAccount",
    "BillingTransaction",
    "BillingSummary",
    "PendingTransfers",
    "Level",
    "LevelStats",
    "LevelDashboard",
  ],

  endpoints: (builder) => ({}),
});
