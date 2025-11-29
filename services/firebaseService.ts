
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  Auth, 
  User,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  Firestore,
  Query,
  query,
  onSnapshot
} from 'firebase/firestore';
import { FIREBASE_CONFIG, IS_FIREBASE_CONFIGURED, APP_ID } from '../constants';
import { Expense } from '../types';

// --- Configuration ---

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (IS_FIREBASE_CONFIGURED) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(FIREBASE_CONFIG);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase Init Error:", e);
  }
}

// --- LOCAL STORAGE HELPERS (Fallback) ---
const LOCAL_STORAGE_KEY = `astra_ledger_${APP_ID}_data`;

const getLocalData = (): Expense[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalData = (data: Expense[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  // Dispatch event for reactivity across tabs/components
  window.dispatchEvent(new Event('local-storage-update'));
};

// --- Auth Service ---

export const initAuth = (onUserChanged: (user: User | null) => void) => {
  if (IS_FIREBASE_CONFIGURED && auth) {
    signInAnonymously(auth).catch((err) => console.error("Auth failed:", err));
    return onAuthStateChanged(auth, onUserChanged);
  } else {
    // Mock User for Local Mode
    const mockUser = { uid: 'local_user', isAnonymous: true } as User;
    setTimeout(() => onUserChanged(mockUser), 500);
    return () => {};
  }
};

// --- Data Service ---

export const subscribeToExpenses = (uid: string, callback: (expenses: Expense[]) => void) => {
  // 1. FIREBASE MODE
  if (IS_FIREBASE_CONFIGURED && db) {
    const q: Query = query(collection(db, 'artifacts', APP_ID, 'users', uid, 'expenses'));
    return onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Expense));
      loaded.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
      });
      callback(loaded);
    });
  } 
  
  // 2. LOCAL STORAGE MODE
  else {
    const load = () => {
      const data = getLocalData();
      // Sort desc
      data.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
        return timeB - timeA;
      });
      callback(data);
    };

    load(); // Initial load
    window.addEventListener('local-storage-update', load);
    return () => window.removeEventListener('local-storage-update', load);
  }
};

export const addExpense = async (uid: string, expense: Omit<Expense, 'id' | 'createdAt'>, originalText: string) => {
  // 1. FIREBASE MODE
  if (IS_FIREBASE_CONFIGURED && db) {
    await addDoc(collection(db, 'artifacts', APP_ID, 'users', uid, 'expenses'), {
      ...expense,
      originalText,
      createdAt: serverTimestamp()
    });
  } 
  
  // 2. LOCAL STORAGE MODE
  else {
    const current = getLocalData();
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      originalText,
      // Mock Firestore Timestamp
      createdAt: { 
        seconds: Math.floor(Date.now() / 1000), 
        nanoseconds: 0, 
        toMillis: () => Date.now() 
      }
    };
    saveLocalData([...current, newExpense]);
  }
};

export const removeExpense = async (uid: string, expenseId: string) => {
  // 1. FIREBASE MODE
  if (IS_FIREBASE_CONFIGURED && db) {
    await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', uid, 'expenses', expenseId));
  } 
  
  // 2. LOCAL STORAGE MODE
  else {
    const current = getLocalData();
    const filtered = current.filter(e => e.id !== expenseId);
    saveLocalData(filtered);
  }
};
