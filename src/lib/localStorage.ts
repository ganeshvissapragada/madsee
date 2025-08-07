import { User, Blog } from '../types';

const USERS_KEY = 'blogsphere_users';
const CURRENT_USER_KEY = 'blogsphere_current_user';
const BLOGS_KEY = 'blogsphere_blogs';

export interface StoredUser extends User {
  password: string;
}

// User Management
export const getUsers = (): StoredUser[] => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

export const saveUser = (user: StoredUser): void => {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const findUserByEmail = (email: string): StoredUser | null => {
  const users = getUsers();
  return users.find(u => u.email === email) || null;
};

export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem(CURRENT_USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

// Blog Management
export const getUserBlogs = (userId: string): Blog[] => {
  const blogs = localStorage.getItem(BLOGS_KEY);
  const allBlogs: Blog[] = blogs ? JSON.parse(blogs) : [];
  return allBlogs.filter(blog => blog.userId === userId);
};

export const saveBlog = (blog: Blog): void => {
  const blogs = localStorage.getItem(BLOGS_KEY);
  const allBlogs: Blog[] = blogs ? JSON.parse(blogs) : [];
  
  const existingIndex = allBlogs.findIndex(b => b.id === blog.id);
  
  if (existingIndex >= 0) {
    allBlogs[existingIndex] = blog;
  } else {
    allBlogs.push(blog);
  }
  
  localStorage.setItem(BLOGS_KEY, JSON.stringify(allBlogs));
};

export const deleteBlog = (blogId: string, userId: string): boolean => {
  const blogs = localStorage.getItem(BLOGS_KEY);
  const allBlogs: Blog[] = blogs ? JSON.parse(blogs) : [];
  
  const blogIndex = allBlogs.findIndex(b => b.id === blogId && b.userId === userId);
  
  if (blogIndex >= 0) {
    allBlogs.splice(blogIndex, 1);
    localStorage.setItem(BLOGS_KEY, JSON.stringify(allBlogs));
    return true;
  }
  
  return false;
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};