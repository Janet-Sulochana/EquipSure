import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  quickDemoLogin: (role: UserRole) => Promise<boolean>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('equipsure_token');
    const savedUser = localStorage.getItem('equipsure_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (err) {
        localStorage.removeItem('equipsure_token');
        localStorage.removeItem('equipsure_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success && response.data.token) {
        const authToken = response.data.token;
        const authUser = response.data.user;

        localStorage.setItem('equipsure_token', authToken);
        localStorage.setItem('equipsure_user', JSON.stringify(authUser));

        setToken(authToken);
        setUser(authUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const quickDemoLogin = async (role: UserRole): Promise<boolean> => {
    const roleMap: Record<UserRole, string> = {
      admin: 'admin@equipsure.com',
      biomedical_engineer: 'bme@equipsure.com',
      hospital_staff: 'staff@equipsure.com',
    };

    const email = roleMap[role];
    return await login(email, 'Password123!');
  };

  const logout = () => {
    localStorage.removeItem('equipsure_token');
    localStorage.removeItem('equipsure_user');
    setToken(null);
    setUser(null);
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        quickDemoLogin,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
