import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User } from '@/types';
import { authAPI } from '@/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (loginId: string, password?: string, verificationCode?: string) => Promise<void>;
  register: (email: string, password: string, verificationCode: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && typeof parsedUser === 'object') {
            setUser(parsedUser);
          } else {
            // 用户数据格式无效，清除存储
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch {
          // JSON 解析失败，清除损坏的数据
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setToken(null);
        }
      }
    } catch {
      // localStorage 访问异常，清除所有认证数据
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (loginId: string, password?: string, verificationCode?: string) => {
    try {
      const result = await authAPI.login({ login: loginId, password, verificationCode });
      setUser(result.user);
      setToken(result.token);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
    } catch (error) {
      throw error;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, verificationCode: string) => {
    try {
      const result = await authAPI.register({ email, password, verificationCode });
      setUser(result.user);
      setToken(result.token);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;