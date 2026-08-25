import React from "react";
import { useAuthStore } from "../store/useAuthStore";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <>{children}</>;
};

export const useAuth = () => {
  return useAuthStore();
};
