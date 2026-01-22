// Mock users for testing
interface MockUser {
  id: string;
  username: string;
  email: string;
  password: string;
  fullName: string;
  maskEmail: string;
  maskContactNo: string;
}

const MOCK_USERS: MockUser[] = [
  {
    id: "user123",
    username: "testuser",
    email: "test@example.com",
    password: "password123",
    fullName: "Test User",
    maskEmail: "t***@example.com",
    maskContactNo: "+91 98*** ***45"
  },
  {
    id: "admin456",
    username: "admin",
    email: "admin@example.com",
    password: "admin123",
    fullName: "Admin User",
    maskEmail: "a***@example.com",
    maskContactNo: "+91 99*** ***67"
  }
];

const generateMockToken = (userId: string): string => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const expiryTime = Math.floor(Date.now() / 1000) + 3600;
  const payload = btoa(JSON.stringify({ sub: userId, exp: expiryTime }));
  const signature = "mock_signature";
  return `${header}.${payload}.${signature}`;
};

interface LoginResponse {
  data: {
    status: "OK" | "ERROR";
    data?: {
      accessToken: string;
      refreshToken: string;
      fullName: string;
      maskEmail: string;
      maskContactNo: string;
    };
    message?: string;
  };
}

export const mockAuthService = {
  login: async (detail: string, password: string): Promise<LoginResponse> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = MOCK_USERS.find(u => u.username === detail || u.email === detail);
    
    if (!user || user.password !== password) {
      return { 
        data: { 
          status: "ERROR", 
          message: "Invalid credentials. Please try again." 
        } 
      };
    }
    
    return {
      data: {
        status: "OK",
        data: {
          accessToken: generateMockToken(user.id),
          refreshToken: generateMockToken(user.id + "_refresh"),
          fullName: user.fullName,
          maskEmail: user.maskEmail,
          maskContactNo: user.maskContactNo
        }
      }
    };
  }
};