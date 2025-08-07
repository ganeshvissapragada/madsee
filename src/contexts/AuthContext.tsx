import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, AuthState } from '../types';
import { 
  StoredUser, 
  findUserByEmail, 
  saveUser, 
  getCurrentUser, 
  setCurrentUser, 
  generateId 
} from '../lib/localStorage';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, username?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return { 
        user: action.payload, 
        isAuthenticated: true, 
        isLoading: false 
      };
    case 'LOGIN_FAILURE':
      return { 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      };
    case 'LOGOUT':
      return { 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      };
    case 'SET_USER':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: true,
        isLoading: false 
      };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    // Check for existing user session
    const user = getCurrentUser();
    if (user) {
      dispatch({ type: 'SET_USER', payload: user });
    } else {
      dispatch({ type: 'LOGIN_FAILURE' });
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const storedUser = findUserByEmail(email);
    
    if (storedUser && storedUser.password === password) {
      const user: User = {
        id: storedUser.id,
        email: storedUser.email,
        username: storedUser.username,
        avatar: storedUser.avatar
      };
      
      setCurrentUser(user);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return true;
    }
    
    dispatch({ type: 'LOGIN_FAILURE' });
    return false;
  };

  const signup = async (email: string, password: string, username?: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if user already exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      dispatch({ type: 'LOGIN_FAILURE' });
      return false;
    }
    
    // Create new user
    const newStoredUser: StoredUser = {
      id: generateId(),
      email,
      password,
      username: username || email.split('@')[0],
      avatar: `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150`
    };
    
    saveUser(newStoredUser);
    
    const user: User = {
      id: newStoredUser.id,
      email: newStoredUser.email,
      username: newStoredUser.username,
      avatar: newStoredUser.avatar
    };
    
    setCurrentUser(user);
    dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      signup,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};