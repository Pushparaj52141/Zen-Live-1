import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user: reduxUser } = useSelector((state) => state.auth);

  const user = reduxUser;
  const roleIds = Array.isArray(user?.role_ids) && user.role_ids.length
    ? user.role_ids.map((r) => Number(r)).filter((r) => Number.isInteger(r))
    : user?.role_id != null
      ? [Number(user.role_id)]
      : [];
  
  if (!user && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Fail closed: if route declares roles, user must have at least one matching role.
  if (allowedRoles) {
    if (!roleIds.length) {
      return <Navigate to="/dashboard" replace />
    }
    if (!roleIds.some((id) => allowedRoles.includes(id))) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}

export default ProtectedRoute
