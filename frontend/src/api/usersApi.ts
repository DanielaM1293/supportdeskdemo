import { baseApi } from './baseApi';
import type { AgentRef, Role, User } from '../types';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<{ items: User[] }, void>({
      query: () => '/users',
      providesTags: ['Users'],
    }),
    getAgents: build.query<{ items: AgentRef[] }, void>({
      query: () => '/users/agents',
      providesTags: ['Agents'],
    }),
    updateUser: build.mutation<User, { id: number; changes: { role?: Role; is_active?: boolean } }>(
      {
        query: ({ id, changes }) => ({ url: `/users/${id}`, method: 'PATCH', body: changes }),
        invalidatesTags: ['Users', 'Agents', 'Me'],
      },
    ),
  }),
});

export const { useGetUsersQuery, useGetAgentsQuery, useUpdateUserMutation } = usersApi;
