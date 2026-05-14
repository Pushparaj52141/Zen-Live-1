import React from "react";
import AppRoutes from "@app/routes/AppRoutes";
import AuthProvider from "@app/providers/AuthProvider";
import ReduxProvider from "@app/providers/ReduxProvider";

function App() {
  return (
    <ReduxProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ReduxProvider>
  );
}

export default App;
