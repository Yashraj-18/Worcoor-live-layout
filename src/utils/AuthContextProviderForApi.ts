import { AuthContextType } from "./AuthContext";

let authContextRef: AuthContextType | null = null;

export const setAuthContext = (context: AuthContextType | null) => {
  authContextRef = context;
};

export const getAuthContext = () => authContextRef;
