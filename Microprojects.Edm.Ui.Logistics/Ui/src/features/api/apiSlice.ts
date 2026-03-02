import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Use the `Post` type we've already defined in `postsSlice`,
// and then re-export it for ease of use
import type {User, Process} from "../../data/types";
import Api from "@features/api/api";
export type { User, Process }

// Define our single API slice object
export const apiSlice = createApi({
    // The cache reducer expects to be added at `state.api` (already default - this is optional)
    reducerPath: 'api',
    // All of our requests will have URLs starting with '/fakeApi'
    baseQuery: fetchBaseQuery({ baseUrl: `${Api.baseUrl}/api` }),
    // The "endpoints" represent operations and requests for this server
    endpoints: builder => ({
        // The `getProcesses` endpoint is a "query" operation that returns data.
        getProcesses: builder.query<Process[], void>({
            // The URL for the request is '/api/processes'
            query: () => '/processes'
        })
    })
})

// Export the auto-generated hook for the `getProcesses` query endpoint
export const { useGetProcessesQuery } = apiSlice