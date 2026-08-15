import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

const ProtectedRoute = ({ allowed = [], children }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setIsAuthorized(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await axios.get("/api/auth/verify", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const userRole = res.data.role;

        if (allowed.includes(userRole)) {
          setIsAuthorized(true);
        } else {
          localStorage.removeItem("token");
          setIsAuthorized(false);
        }
      } catch (err) {
        localStorage.removeItem("token");
        setIsAuthorized(false);
      }
    };

    verifyToken();
  }, [token, allowed]);

  if (isAuthorized === null) return null;

  if (!isAuthorized) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;
