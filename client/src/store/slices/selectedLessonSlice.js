//slice to cash the data of the selected lesson
import { createSlice } from "@reduxjs/toolkit";
const initialState = null;

const selectedLessonSlice = createSlice({
  name: "selectedLesson",
  initialState,
  reducers: {
    setSelectedLesson: (state, action) => action.payload,
  },
});

export const { setSelectedLesson } = selectedLessonSlice.actions;
export const selectSelectedLesson = (state) => state.selectedLesson;
export default selectedLessonSlice.reducer;
