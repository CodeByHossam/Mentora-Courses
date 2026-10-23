import { createSlice } from "@reduxjs/toolkit";

// Get initial state from localStorage if available
const initialState = {
  user: null,
  accessToken: null,
  isRefreshing: false, // <-- add this flag to track refresh token loading state
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, { payload }) => {
      // Handle access token
      if (payload.accessToken) {
        state.accessToken = payload.accessToken;
      }
      // Handle user data
      if (payload.user) {
        state.user = payload.user;
      }
      // Once credentials are set, refresh is done
      state.isRefreshing = false;
    },
    sendLogout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isRefreshing = false;
    },
    setIsRefreshing: (state, action) => {
      state.isRefreshing = action.payload;
    },
  },
});

export const { setCredentials, sendLogout, setIsRefreshing } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.accessToken;
export const selectIsAuthenticated = (state) => !!state.auth.accessToken;
export const selectIsRefreshing = (state) => state.auth.isRefreshing;
