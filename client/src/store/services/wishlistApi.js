import { apiSlice } from "../api/apiSlice";

export const wishlistApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getWishlist: builder.query({
      query: () => "/wishlist",
      transformResponse: (response) => response?.data || [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((item) => ({ type: "Wishlist", id: item?._id || item?.course?._id })),
              { type: "Wishlist", id: "LIST" },
            ]
          : [{ type: "Wishlist", id: "LIST" }],
    }),

    addToWishlist: builder.mutation({
      query: (courseId) => ({
        url: "/wishlist",
        method: "POST",
        body: { courseId },
      }),
      invalidatesTags: [{ type: "Wishlist", id: "LIST" }],
    }),

    removeFromWishlist: builder.mutation({
      query: (courseId) => ({
        url: `/wishlist/${courseId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, courseId) => [
        { type: "Wishlist", id: courseId },
        { type: "Wishlist", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
} = wishlistApi;
