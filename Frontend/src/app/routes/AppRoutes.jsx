// src/routes/AppRoutes.jsx
import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@app/routes/ProtectedRoute";
import routeConfig from "@app/routes/config";

export default function AppRoutes({ setNavbarProps }) {
  return (
    <Suspense fallback={null}>
      <Routes>
        {routeConfig.map(({ path, component: Component, isPublic, allowedRoles }) => {
          const element = isPublic ? (
            <Component setNavbarProps={setNavbarProps} />
          ) : (
            <ProtectedRoute allowedRoles={allowedRoles}>
              <Component setNavbarProps={setNavbarProps} />
            </ProtectedRoute>
          );

          return <Route key={path} path={path} element={element} />;
        })}
      </Routes>
    </Suspense>
  );
}
