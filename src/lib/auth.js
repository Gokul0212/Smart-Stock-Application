import { writable } from 'svelte/store';
import { dbGetUserByUsernameOrEmail, dbAddUser, firebaseAuth } from './firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

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
  if (!firebaseAuth) throw new Error("Firebase Auth is not initialized.");

  // Because Firebase Auth needs an email, check if the input is a username
  let emailToUse = usernameOrEmail;
  if (!usernameOrEmail.includes('@')) {
    const user = await dbGetUserByUsernameOrEmail(usernameOrEmail);
    if (!user) {
      throw new Error("User not found.");
    }
    emailToUse = user.email;
  }

  // 1. Authenticate with Firebase Auth
  await signInWithEmailAndPassword(firebaseAuth, emailToUse, password);
  
  // 2. Fetch the extra user data from Firestore
  const dbUser = await dbGetUserByUsernameOrEmail(emailToUse);
  if (!dbUser) {
    throw new Error("User metadata not found in database.");
  }
  
  // Set user session info (without password)
  const sessionUser = {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    role: dbUser.role || 'user',
    name: dbUser.name || dbUser.username
  };
  
  authUser.set(sessionUser);
  if (typeof window !== 'undefined') {
    localStorage.setItem('sm_auth_user', JSON.stringify(sessionUser));
  }
  return sessionUser;
}

export async function registerUser({ name, username, email, phone, password }) {
  if (!firebaseAuth) throw new Error("Firebase Auth is not initialized.");

  // Check if username or email exists in Firestore
  const existingUser = await dbGetUserByUsernameOrEmail(username);
  if (existingUser) {
    throw new Error("Username already taken.");
  }
  const existingEmail = await dbGetUserByUsernameOrEmail(email);
  if (existingEmail) {
    throw new Error("Email already registered.");
  }
  
  // 1. Create User in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  const uid = userCredential.user.uid;

  // 2. Save User metadata to Firestore
  const newUser = {
    id: uid, // Use Firebase Auth UID as the document ID
    username,
    email,
    role: 'user', // Default registered users are customers
    name,
    phone
  };
  
  await dbAddUser(newUser);
  return newUser;
}

export async function registerAdmin({ name, username, email, password, adminCode }) {
  if (!firebaseAuth) throw new Error("Firebase Auth is not initialized.");

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
  
  // 1. Create User in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  const uid = userCredential.user.uid;

  // 2. Save User metadata to Firestore
  const newUser = {
    id: uid,
    username,
    email,
    role: 'admin',
    name
  };
  
  await dbAddUser(newUser);
  return newUser;
}

export async function logout() {
  if (firebaseAuth) {
    await signOut(firebaseAuth);
  }
  authUser.set(null);
  if (typeof window !== 'undefined') {
    localStorage.removeItem('sm_auth_user');
  }
}
