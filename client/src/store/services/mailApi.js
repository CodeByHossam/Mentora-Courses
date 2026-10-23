// mail api slice
import { apiSlice } from "../api/apiSlice";

export const mailApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        sendMail: builder.mutation({
            query: (data) => ({
                url: "/email/contact",
                method: "POST",
                body: data,
            }),
        }),
    }),
});

export const { useSendMailMutation } = mailApi;