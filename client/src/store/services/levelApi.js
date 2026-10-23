import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { apiSlice } from "../api/apiSlice";

export const levelApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all levels with pagination and filtering
    getLevels: builder.query({
      query: ({
        page = 1,
        limit = 20,
        search = "",
        isActive = "all",
        sortBy = "order",
        sortOrder = "asc",
      } = {}) => ({
        url: "/levels",
        params: { page, limit, search, isActive, sortBy, sortOrder },
      }),
      providesTags: (result) =>
        result?.data?.levels
          ? [
              ...result.data.levels.map(({ _id }) => ({
                type: "Level",
                id: _id,
              })),
              { type: "Level", id: "LIST" },
            ]
          : [{ type: "Level", id: "LIST" }],
      transformResponse: (response) => response.data,
    }),

    // Get single level by ID
    getLevel: builder.query({
      query: (id) => `/levels/${id}`,
      providesTags: (result, error, id) => [{ type: "Level", id }],
      transformResponse: (response) => response.data,
    }),

    // Get level statistics
    getLevelStatistics: builder.query({
      query: (id) => `/levels/${id}/statistics`,
      providesTags: (result, error, id) => [{ type: "LevelStats", id }],
      transformResponse: (response) => response.data,
    }),

    // Get levels dashboard data
    getLevelsDashboard: builder.query({
      query: () => "/levels/dashboard",
      providesTags: [{ type: "LevelDashboard", id: "DASHBOARD" }],
      transformResponse: (response) => response.data,
    }),

    // Create new level
    createLevel: builder.mutation({
      query: (levelData) => ({
        url: "/levels",
        method: "POST",
        body: levelData,
      }),
      invalidatesTags: [
        { type: "Level", id: "LIST" },
        { type: "LevelDashboard", id: "DASHBOARD" },
      ],
      transformResponse: (response) => response.data,
    }),

    // Update level
    updateLevel: builder.mutation({
      query: ({ id, ...levelData }) => ({
        url: `/levels/${id}`,
        method: "PUT",
        body: levelData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Level", id },
        { type: "Level", id: "LIST" },
        { type: "LevelStats", id },
        { type: "LevelDashboard", id: "DASHBOARD" },
      ],
      transformResponse: (response) => response.data,
    }),

    // Delete level
    deleteLevel: builder.mutation({
      query: (id) => ({
        url: `/levels/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Level", id },
        { type: "Level", id: "LIST" },
        { type: "LevelStats", id },
        { type: "LevelDashboard", id: "DASHBOARD" },
      ],
    }),

    // Reorder levels
    reorderLevels: builder.mutation({
      query: (levelOrders) => ({
        url: "/levels/reorder",
        method: "PUT",
        body: { levelOrders },
      }),
      invalidatesTags: [
        { type: "Level", id: "LIST" },
        { type: "LevelDashboard", id: "DASHBOARD" },
      ],
    }),
  }),
});

export const {
  useGetLevelsQuery,
  useGetLevelQuery,
  useGetLevelStatisticsQuery,
  useGetLevelsDashboardQuery,
  useCreateLevelMutation,
  useUpdateLevelMutation,
  useDeleteLevelMutation,
  useReorderLevelsMutation,
} = levelApi;
