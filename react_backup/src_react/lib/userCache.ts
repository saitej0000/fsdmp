import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const userCache = new Map<string, any>();
const pendingRequests = new Map<string, Promise<any>>();

export const getUserData = async (userId: string) => {
  if (!userId) return null;
  
  // Return cached data if available
  if (userCache.has(userId)) {
    return userCache.get(userId);
  }

  // If a request is already in flight, wait for it
  if (pendingRequests.has(userId)) {
    return pendingRequests.get(userId);
  }

  // Otherwise, fetch from Firestore
  const fetchPromise = (async () => {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        userCache.set(userId, data);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    } finally {
      pendingRequests.delete(userId);
    }
  })();

  pendingRequests.set(userId, fetchPromise);
  return fetchPromise;
};

export const clearUserCache = () => {
  userCache.clear();
};
