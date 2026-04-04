import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp, increment, onSnapshot, startAfter } from 'firebase/firestore';
import { db, auth } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const getPosts = async (lastDoc?: any) => {
  let q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(12));
  if (lastDoc) {
    q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(12));
  }
  const snapshot = await getDocs(q);
  return {
    posts: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null
  };
};

export const getPost = async (postId: string) => {
  const docRef = doc(db, 'posts', postId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const createPost = async (postData: any) => {
  const newPostRef = doc(collection(db, 'posts'));
  await setDoc(newPostRef, {
    ...postData,
    createdAt: serverTimestamp(),
  });
  return newPostRef.id;
};

export const likePost = async (userId: string, postId: string) => {
  const likeRef = doc(db, 'likes', `${userId}_${postId}`);
  await setDoc(likeRef, {
    userId,
    postId,
    createdAt: serverTimestamp(),
  });
  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, {
    likesCount: increment(1),
  });
  
  // Create notification
  const postSnap = await getDoc(postRef);
  if (postSnap.exists()) {
    const postData = postSnap.data();
    await createNotification(postData.authorId, userId, 'like', postId);
  }
};

export const unlikePost = async (userId: string, postId: string) => {
  const likeRef = doc(db, 'likes', `${userId}_${postId}`);
  await deleteDoc(likeRef);
  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, {
    likesCount: increment(-1),
  });
};

export const getComments = async (postId: string) => {
  const q = query(collection(db, 'comments'), where('postId', '==', postId), orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addComment = async (commentData: any) => {
  const newCommentRef = doc(collection(db, 'comments'));
  await setDoc(newCommentRef, {
    ...commentData,
    createdAt: serverTimestamp(),
  });
  const postRef = doc(db, 'posts', commentData.postId);
  await updateDoc(postRef, {
    commentsCount: increment(1),
  });
  
  // Create notification
  const postSnap = await getDoc(postRef);
  if (postSnap.exists()) {
    const postData = postSnap.data();
    await createNotification(postData.authorId, commentData.authorId, 'comment', commentData.postId, newCommentRef.id);
  }
  
  return newCommentRef.id;
};

export const followUser = async (followerId: string, followingId: string) => {
  const followRef = doc(db, 'follows', `${followerId}_${followingId}`);
  await setDoc(followRef, {
    followerId,
    followingId,
    createdAt: serverTimestamp(),
  });
  const followerUserRef = doc(db, 'users', followerId);
  await updateDoc(followerUserRef, {
    followingCount: increment(1),
  });
  const followingUserRef = doc(db, 'users', followingId);
  await updateDoc(followingUserRef, {
    followersCount: increment(1),
  });
  
  // Create notification
  await createNotification(followingId, followerId, 'follow');
};

export const unfollowUser = async (followerId: string, followingId: string) => {
  const followRef = doc(db, 'follows', `${followerId}_${followingId}`);
  await deleteDoc(followRef);
  const followerUserRef = doc(db, 'users', followerId);
  await updateDoc(followerUserRef, {
    followingCount: increment(-1),
  });
  const followingUserRef = doc(db, 'users', followingId);
  await updateDoc(followingUserRef, {
    followersCount: increment(-1),
  });
};

export const checkIsFollowing = async (followerId: string, followingId: string) => {
  const followRef = doc(db, 'follows', `${followerId}_${followingId}`);
  const docSnap = await getDoc(followRef);
  return docSnap.exists();
};

export const getOrCreateConversation = async (userId: string, otherUserId: string) => {
  const q = query(
    collection(db, 'conversations'),
    where('participantIds', 'in', [
      [userId, otherUserId],
      [otherUserId, userId]
    ])
  );
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }

  const newConvRef = doc(collection(db, 'conversations'));
  await setDoc(newConvRef, {
    participantIds: [userId, otherUserId],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return newConvRef.id;
};

export const updateUserProfile = async (userId: string, data: any) => {
  const userRef = doc(db, 'users', userId);
  try {
    await updateDoc(userRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
};

export const sendMessage = async (conversationId: string, senderId: string, text: string) => {
  const newMessageRef = doc(collection(db, 'messages'));
  await setDoc(newMessageRef, {
    conversationId,
    senderId,
    text,
    createdAt: serverTimestamp(),
  });

  const convRef = doc(db, 'conversations', conversationId);
  await updateDoc(convRef, {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const createNotification = async (
  userId: string,
  actorId: string,
  type: 'like' | 'comment' | 'follow',
  postId?: string,
  commentId?: string
) => {
  if (userId === actorId) return; // Don't notify yourself

  const notificationRef = doc(collection(db, 'notifications'));
  const data: any = {
    userId,
    actorId,
    type,
    read: false,
    createdAt: serverTimestamp(),
  };
  
  if (postId) data.postId = postId;
  if (commentId) data.commentId = commentId;

  await setDoc(notificationRef, data);
};

export const markNotificationAsRead = async (notificationId: string) => {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, {
    read: true,
  });
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );
  const snapshot = await getDocs(q);
  const updatePromises = snapshot.docs.map(d => 
    updateDoc(doc(db, 'notifications', d.id), { read: true })
  );
  await Promise.all(updatePromises);
};
