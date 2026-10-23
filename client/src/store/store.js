import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { authApi } from "./services/authApi";
import { courseApi } from "./services/courseApi";
import { userApi } from "./services/userApi";
import { enrollmentRequestApi } from "./services/enrollmentRequestApi";
import { instructorRequestApi } from "./services/instructorRequestApi";
import { courseInteractionApi } from "./services/courseInteractionApi";
import {lessonApi} from "./services/lessonApi"
import authReducer from "./slices/authSlice";
import selectedLessonSlice from "./slices/selectedLessonSlice";
import {paymentApi} from "./services/paymentApi";
import {liveSessionApi} from "./services/liveSessionApi";
import messageApi from "./services/messageApi";
import notificationApi from "./services/notificationApi";
import {billingApi} from "./services/billingApi";
import {levelApi} from "./services/levelApi";
import {payoutApi} from "./services/payoutApi";
import {videoApi} from "./services/videoApi";

import {mailApi} from './services/mailApi'
// Create the store
export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [courseApi.reducerPath]: courseApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [enrollmentRequestApi.reducerPath]: enrollmentRequestApi.reducer,
    [instructorRequestApi.reducerPath]: instructorRequestApi.reducer,
    [courseInteractionApi.reducerPath]: courseInteractionApi.reducer,
    [lessonApi.reducerPath]: lessonApi.reducer,
    [paymentApi.reducerPath]: paymentApi.reducer,
    [liveSessionApi.reducerPath]: liveSessionApi.reducer,
    [messageApi.reducerPath]: messageApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    [billingApi.reducerPath]: billingApi.reducer,
    [levelApi.reducerPath]: levelApi.reducer,
    [payoutApi.reducerPath]: payoutApi.reducer,
    [videoApi.reducerPath]: videoApi.reducer,
    [mailApi.reducerPath]: mailApi.reducer,
    auth: authReducer,
    selectedLesson: selectedLessonSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      courseApi.middleware,
      userApi.middleware,
      enrollmentRequestApi.middleware,
      instructorRequestApi.middleware,
      courseInteractionApi.middleware,
      lessonApi.middleware,
      paymentApi.middleware,
      liveSessionApi.middleware,
      messageApi.middleware,
      notificationApi.middleware,
      billingApi.middleware,
      levelApi.middleware,
      payoutApi.middleware,
      videoApi.middleware,
      mailApi.middleware,
    ),
  devTools: true,
});

// Enable the refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

export default store;
