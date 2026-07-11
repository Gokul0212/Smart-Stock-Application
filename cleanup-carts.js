
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.VITE_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_PUBLIC_FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

async function run() {
  const cartSnap = await getDocs(collection(firestore, 'cart'));
  let deleted = 0;
  for (const itemDoc of cartSnap.docs) {
    const data = itemDoc.data();
    const productSnap = await getDoc(doc(firestore, 'products', data.productId));
    if (!productSnap.exists()) {
      console.log(`Deleting orphaned cart item ${itemDoc.id} (Product ID: ${data.productId})`);
      await deleteDoc(doc(firestore, 'cart', itemDoc.id));
      deleted++;
    }
  }
  console.log(`Deleted ${deleted} orphaned cart items.`);
  process.exit(0);
}

run();
