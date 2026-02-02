import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { getAuthContext } from "@/src/utils/AuthContextProviderForApi";

interface RequestOptions {
  path: string;
  isAuth?: boolean;
  refreshToken?: boolean;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  // if Media
  isImage?: boolean;
  dp?: string;
  df?: Record<string, any>;
}

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, "");

const buildRequestUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!normalizedBaseUrl) {
    return normalizedPath;
  }

  try {
    // Ensure base always has a trailing slash so URL can resolve correctly
    const baseWithSlash = `${normalizedBaseUrl}/`;
    return new URL(normalizedPath, baseWithSlash).toString();
  } catch {
    // Fallback to simple concatenation if URL constructor fails for some reason
    return `${normalizedBaseUrl}${normalizedPath}`;
  }
};

const getAuthHeaders = (options: RequestOptions) => {
  const headers: Record<string, string> = {};

  if (options.isImage) {
    if (options.dp) {
      headers["dp"] = options.dp;
    }
    if (options.df) {
      headers["df"] = JSON.stringify(options.df);
    }
  }

  return {
    ...headers,
    ...(options.headers || {}),
  };
};

const request = async <T = any>(
  options: RequestOptions
): Promise<AxiosResponse<T>> => {
  const config: AxiosRequestConfig = {
    url: buildRequestUrl(options.path),
    method: options.method || "GET",
    headers: getAuthHeaders(options),
    params: options.params,
    data: options.data,
    withCredentials: true,
  };

  try {
    const response = await axios(config);
    return response;
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.warn("401 Unauthorized – logging out user");

      // Call AuthContext logout if available
      const authContext = getAuthContext();
      if (authContext) {
        authContext.authLogout();
      } else {
        // fallback if context not mounted
        window.location.href = "/login";
      }
    }
    throw error;
  }
};

export const apiService = {
  get: (options: RequestOptions) => request({ ...options, method: "GET" }),
  post: (options: RequestOptions) => request({ ...options, method: "POST" }),
  put: (options: RequestOptions) => request({ ...options, method: "PUT" }),
  delete: (options: RequestOptions) => request({ ...options, method: "DELETE" }),
  patch: (options: RequestOptions) => request({ ...options, method: "PATCH" }),
};
