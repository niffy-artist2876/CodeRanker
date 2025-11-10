import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiMe } from "./auth";

function ProtectedRoute({ children }) {
  const [state, setState] = useState({ loading: true, allowed: false });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const me = await apiMe();
      if (!mounted) return;
      setState({ loading: false, allowed: !!me?.ok });
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (state.loading) return null;
  if (!state.allowed) return <Navigate to="/login" replace />;
  return children;
}

export default ProtectedRoute;


