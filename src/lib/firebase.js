import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const hasFirebaseConfig = typeof process !== 'undefined' 
  ? (process.env?.PUBLIC_FIREBASE_API_KEY || false)
  : (import.meta.env?.VITE_PUBLIC_FIREBASE_API_KEY || false);

let firebaseApp = null;
export let firestore = null;
export let firebaseAuth = null;

if (hasFirebaseConfig && typeof window !== 'undefined') {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_PUBLIC_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_PUBLIC_FIREBASE_APP_ID
    };
    
    firebaseApp = initializeApp(firebaseConfig);
    firestore = getFirestore(firebaseApp);
    firebaseAuth = getAuth(firebaseApp);
    console.log("Firebase initialized successfully.");
  } catch (err) {
    console.error("Firebase init failed:", err);
  }
}

// Ensure firestore is initialized before usage
const checkDb = () => {
  if (!firestore) throw new Error("Firestore is not initialized. Please check your Firebase configuration in the .env file.");
};

// --- DATABASE SERVICE INTERFACE ---

// Users Collection Methods
export async function dbGetUsers() {
  checkDb();
  const snapshot = await getDocs(collection(firestore, 'users'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function dbAddUser(user) {
  checkDb();
  // Using setDoc to allow custom ID (like 'u_admin') or fallback to addDoc
  if (user.id) {
    await setDoc(doc(firestore, 'users', user.id), user);
    return user;
  } else {
    const docRef = await addDoc(collection(firestore, 'users'), user);
    return { id: docRef.id, ...user };
  }
}

export async function dbGetUserByUsernameOrEmail(identifier) {
  checkDb();
  const usersRef = collection(firestore, 'users');
  
  const qUsername = query(usersRef, where('username', '==', identifier));
  const snapshotUsername = await getDocs(qUsername);
  if (!snapshotUsername.empty) {
    return { id: snapshotUsername.docs[0].id, ...snapshotUsername.docs[0].data() };
  }

  const qEmail = query(usersRef, where('email', '==', identifier));
  const snapshotEmail = await getDocs(qEmail);
  if (!snapshotEmail.empty) {
    return { id: snapshotEmail.docs[0].id, ...snapshotEmail.docs[0].data() };
  }
  
  return null;
}

// Products Collection Methods (CRUD)
export async function dbGetProducts() {
  checkDb();
  const snapshot = await getDocs(collection(firestore, 'products'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function dbAddProduct(product) {
  checkDb();
  const newProduct = {
    name: product.name,
    category: product.category,
    price: Number(product.price),
    stock: Number(product.stock),
    imageUrl: product.imageUrl || "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500&auto=format&fit=crop&q=60"
  };
  const docRef = await addDoc(collection(firestore, 'products'), newProduct);
  return { id: docRef.id, ...newProduct };
}

export async function dbUpdateProduct(id, updatedFields) {
  checkDb();
  const productRef = doc(firestore, 'products', id);
  
  const cleanFields = { ...updatedFields };
  if (cleanFields.price !== undefined) cleanFields.price = Number(cleanFields.price);
  if (cleanFields.stock !== undefined) cleanFields.stock = Number(cleanFields.stock);
  
  await updateDoc(productRef, cleanFields);
  
  const updatedDoc = await getDoc(productRef);
  return { id: updatedDoc.id, ...updatedDoc.data() };
}

export async function dbDeleteProduct(id) {
  checkDb();
  await deleteDoc(doc(firestore, 'products', id));
  return { success: true };
}

// Orders Collection Methods
export async function dbGetOrders() {
  checkDb();
  const snapshot = await getDocs(collection(firestore, 'orders'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function dbGetUserOrders(userId) {
  checkDb();
  const q = query(collection(firestore, 'orders'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function dbAddOrder(order) {
  checkDb();
  const newOrder = {
    purchaseDate: new Date().toISOString(),
    orderStatus: "Confirmed",
    ...order
  };
  const docRef = await addDoc(collection(firestore, 'orders'), newOrder);
  return { orderId: docRef.id, id: docRef.id, ...newOrder }; // Maintaining orderId key for backwards compatibility
}

// Cart Collection Methods
export async function dbGetCart(userId) {
  checkDb();
  const q = query(collection(firestore, 'cart'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ cartId: doc.id, id: doc.id, ...doc.data() }));
}

export async function dbAddToCart(userId, productId, quantity = 1) {
  checkDb();
  const q = query(collection(firestore, 'cart'), where('userId', '==', userId), where('productId', '==', productId));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    // Update existing cart item
    const existingDoc = snapshot.docs[0];
    const newQuantity = existingDoc.data().quantity + quantity;
    await updateDoc(doc(firestore, 'cart', existingDoc.id), { quantity: newQuantity });
  } else {
    // Add new cart item
    await addDoc(collection(firestore, 'cart'), {
      userId,
      productId,
      quantity
    });
  }
  
  return await dbGetCart(userId);
}

export async function dbUpdateCartQuantity(userId, productId, quantity) {
  checkDb();
  const q = query(collection(firestore, 'cart'), where('userId', '==', userId), where('productId', '==', productId));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const existingDoc = snapshot.docs[0];
    await updateDoc(doc(firestore, 'cart', existingDoc.id), { quantity: Math.max(1, quantity) });
  }
  
  return await dbGetCart(userId);
}

export async function dbRemoveFromCart(userId, productId) {
  checkDb();
  const q = query(collection(firestore, 'cart'), where('userId', '==', userId), where('productId', '==', productId));
  const snapshot = await getDocs(q);
  
  for (const itemDoc of snapshot.docs) {
    await deleteDoc(doc(firestore, 'cart', itemDoc.id));
  }
  
  return await dbGetCart(userId);
}

export async function dbClearCart(userId) {
  checkDb();
  const q = query(collection(firestore, 'cart'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  
  for (const itemDoc of snapshot.docs) {
    await deleteDoc(doc(firestore, 'cart', itemDoc.id));
  }
  
  return [];
}
