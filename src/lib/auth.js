import { writable } from 'svelte/store';
import { dbGetUserByUsernameOrEmail, dbAddUser } from './firebase.js';

// Auth state store
export const authUser = writable(null);

// Initialize auth from localStorage on browser load
if (typeof window !== 'undefined') {
  const cachedUser = localStorage.getItem('sm_auth_user');
  if (cachedUser) {
    try {
      authUser.set(JSON.parse(cachedUser));
    } catch (e) {
      localStorage.removeItem('sm_auth_user');
    }
  }
}

// User-facing auth methods
export async function login(usernameOrEmail, password) {
  const user = await dbGetUserByUsernameOrEmail(usernameOrEmail);
  if (!user) {
    throw new Error("User not found.");
  }
  if (user.password !== password) {
    throw new Error("Incorrect password.");
  }
  
  // Set user session info (omit sensitive password info from runtime store)
  const sessionUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role || 'user',
    name: user.name || user.username
  };
  
  authUser.set(sessionUser);
  if (typeof window !== 'undefined') {
    localStorage.setItem('sm_auth_user', JSON.stringify(sessionUser));
  }
  return sessionUser;
}

export async function registerUser({ name, username, email, phone, password }) {
  // Check if username or email exists
  const existingUser = await dbGetUserByUsernameOrEmail(username);
  if (existingUser) {
    throw new Error("Username already taken.");
  }
  const existingEmail = await dbGetUserByUsernameOrEmail(email);
  if (existingEmail) {
    throw new Error("Email already registered.");
  }
  
  const newUser = {
    id: 'usr_' + Math.random().toString(36).substr(2, 9),
    username,
    email,
    password,
    role: 'user', // Default registered users are customers
    name,
    phone
  };
  
  await dbAddUser(newUser);
  return newUser;
}

export async function registerAdmin({ name, username, email, password, adminCode }) {
  const secretAdminCode = 'ADMIN123'; // Secret admin registration code
  
  if (adminCode !== secretAdminCode) {
    throw new Error("Invalid Admin Security Code. Access Denied.");
  }

  const existingUser = await dbGetUserByUsernameOrEmail(username);
  if (existingUser) {
    throw new Error("Username already taken.");
  }
  const existingEmail = await dbGetUserByUsernameOrEmail(email);
  if (existingEmail) {
    throw new Error("Email already registered.");
  }
  
  const newUser = {
    id: 'usr_' + Math.random().toString(36).substr(2, 9),
    username,
    email,
    password,
    role: 'admin',
    name
  };
  
  await dbAddUser(newUser);
  return newUser;
}

export function logout() {
  authUser.set(null);
  if (typeof window !== 'undefined') {
    localStorage.removeItem('sm_auth_user');
  }
}
