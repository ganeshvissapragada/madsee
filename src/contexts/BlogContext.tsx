import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Blog, BlogState } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

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
            ? { ...blog, ...action.payload.blog }
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

const mapDatabaseBlog = (dbBlog: any): Blog => ({
  id: dbBlog.id,
  title: dbBlog.title,
  content: dbBlog.content,
  excerpt: dbBlog.excerpt || '',
  heroImage: dbBlog.hero_image,
  userId: dbBlog.user_id,
  createdAt: dbBlog.created_at,
  updatedAt: dbBlog.updated_at,
  tags: dbBlog.tags || []
});

export const BlogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(blogReducer, {
    blogs: [],
    currentBlog: null,
    isLoading: false
  });

  const fetchUserBlogs = async () => {
    if (!user) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching blogs:', error);
        dispatch({ type: 'SET_BLOGS', payload: [] });
        return;
      }

      const blogs = data.map(mapDatabaseBlog);
      dispatch({ type: 'SET_BLOGS', payload: blogs });
    } catch (error) {
      console.error('Error fetching blogs:', error);
      dispatch({ type: 'SET_BLOGS', payload: [] });
    }
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

    try {
      const { data, error } = await supabase
        .from('blogs')
        .insert({
          title: blogData.title,
          content: blogData.content,
          excerpt: blogData.excerpt,
          hero_image: blogData.heroImage,
          tags: blogData.tags,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating blog:', error);
        return false;
      }

      const newBlog = mapDatabaseBlog(data);
      dispatch({ type: 'ADD_BLOG', payload: newBlog });
      return true;
    } catch (error) {
      console.error('Error creating blog:', error);
      return false;
    }
  };

  const updateBlog = async (id: string, blogData: Partial<Blog>): Promise<boolean> => {
    if (!user) return false;

    try {
      const updateData: any = {};
      if (blogData.title !== undefined) updateData.title = blogData.title;
      if (blogData.content !== undefined) updateData.content = blogData.content;
      if (blogData.excerpt !== undefined) updateData.excerpt = blogData.excerpt;
      if (blogData.heroImage !== undefined) updateData.hero_image = blogData.heroImage;
      if (blogData.tags !== undefined) updateData.tags = blogData.tags;

      const { error } = await supabase
        .from('blogs')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating blog:', error);
        return false;
      }

      dispatch({ type: 'UPDATE_BLOG', payload: { id, blog: blogData } });
      return true;
    } catch (error) {
      console.error('Error updating blog:', error);
      return false;
    }
  };

  const deleteBlog = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting blog:', error);
        return false;
      }

      dispatch({ type: 'DELETE_BLOG', payload: id });
      return true;
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