import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { userUpdated } from '../../store/authSlice';
import { useGetMeQuery } from '../../api/authApi';
import type { Role } from '../../types';
import { Spinner } from '../ui/Feedback';

/** Requires a session; keeps the user fresh from /auth/me. Redirects to /login otherwise. */
export function RequireAuth() {
  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { data } = useGetMeQuery(undefined, { skip: !token });

  useEffect(() => {
    if (data) dispatch(userUpdated(data));
  }, [data, dispatch]);

  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!user) return <Spinner />;
  return <Outlet />;
}

/** Only lets the given roles through; everyone else is sent to /tickets. */
export function RequireRole({ roles }: { roles: Role[] }) {
  const user = useAppSelector((s) => s.auth.user);
  if (!user || !roles.includes(user.role)) return <Navigate to="/tickets" replace />;
  return <Outlet />;
}

/** Keeps authenticated users away from /login and /register. */
export function PublicOnly() {
  const token = useAppSelector((s) => s.auth.token);
  if (token) return <Navigate to="/tickets" replace />;
  return <Outlet />;
}
