import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Blog, BlogState } from '../types';
import { useAuth } from './AuthContext';
import { getUserBlogs, saveBlog, deleteBlog as deleteStoredBlog, generateId } from '../lib/localStorage';

interface BlogContextType extends BlogState {
  createBlog: (blog: Omit<Blog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateBlog: (id: string, blog: Partial<Blog>) => Promise<boolean>;
  deleteBlog: (id: string) => Promise<boolean>;
  getBlog: (id: string) => Blog | undefined;
  refreshBlogs: () => Promise<void>;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

type BlogAction =
  | { type: 'SET_BLOGS'; payload: Blog[] }
  | { type: 'ADD_BLOG'; payload: Blog }
  | { type: 'UPDATE_BLOG'; payload: { id: string; blog: Partial<Blog> } }
  | { type: 'DELETE_BLOG'; payload: string }
  | { type: 'SET_CURRENT_BLOG'; payload: Blog | null }
  | { type: 'SET_LOADING'; payload: boolean };

const blogReducer = (state: BlogState, action: BlogAction): BlogState => {
  switch (action.type) {
    case 'SET_BLOGS':
      return { ...state, blogs: action.payload, isLoading: false };
    case 'ADD_BLOG':
      return { ...state, blogs: [action.payload, ...state.blogs] };
    case 'UPDATE_BLOG':
      return {
        ...state,
        blogs: state.blogs.map(blog =>
          blog.id === action.payload.id
            ? { ...blog, ...action.payload.blog, updatedAt: new Date().toISOString() }
            : blog
        )
      };
    case 'DELETE_BLOG':
      return {
        ...state,
        blogs: state.blogs.filter(blog => blog.id !== action.payload)
      };
    case 'SET_CURRENT_BLOG':
      return { ...state, currentBlog: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

export const BlogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(blogReducer, {
    blogs: [],
    currentBlog: null,
    isLoading: false
  });

  const fetchUserBlogs = async () => {
    if (!user) {
      dispatch({ type: 'SET_BLOGS', payload: [] });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const userBlogs = getUserBlogs(user.id);
    dispatch({ type: 'SET_BLOGS', payload: userBlogs });
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserBlogs();
    } else {
      dispatch({ type: 'SET_BLOGS', payload: [] });
    }
  }, [user, isAuthenticated]);

  const createBlog = async (blogData: Omit<Blog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!user) return false;

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 300));

    const newBlog: Blog = {
      id: generateId(),
      ...blogData,
      userId: user.id,
      author: user,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      saveBlog(newBlog);
      dispatch({ type: 'ADD_BLOG', payload: newBlog });
      return true;
    } catch (error) {
      console.error('Error creating blog:', error);
      return false;
    }
  };

  const updateBlog = async (id: string, blogData: Partial<Blog>): Promise<boolean> => {
    if (!user) return false;

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 300));

    const existingBlog = state.blogs.find(blog => blog.id === id && blog.userId === user.id);
    if (!existingBlog) return false;

    const updatedBlog: Blog = {
      ...existingBlog,
      ...blogData,
      updatedAt: new Date().toISOString()
    };

    try {
      saveBlog(updatedBlog);
      dispatch({ type: 'UPDATE_BLOG', payload: { id, blog: blogData } });
      return true;
    } catch (error) {
      console.error('Error updating blog:', error);
      return false;
    }
  };

  const deleteBlog = async (id: string): Promise<boolean> => {
    if (!user) return false;

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const success = deleteStoredBlog(id, user.id);
      if (success) {
        dispatch({ type: 'DELETE_BLOG', payload: id });
      }
      return success;
    } catch (error) {
      console.error('Error deleting blog:', error);
      return false;
    }
  };

  const getBlog = (id: string) => {
    return state.blogs.find(blog => blog.id === id);
  };

  const refreshBlogs = async () => {
    await fetchUserBlogs();
  };

  return (
    <BlogContext.Provider value={{
      ...state,
      createBlog,
      updateBlog,
      deleteBlog,
      getBlog,
      refreshBlogs
    }}>
      {children}
    </BlogContext.Provider>
  );
};

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (context === undefined) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
};