import { doc, setDoc, getDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const mockUsers = [
  {
    uid: 'mock_aarav',
    displayName: 'Aarav Patel',
    username: 'aarav_p',
    bio: 'Photography enthusiast 📸 | Mumbai',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav',
  },
  {
    uid: 'mock_diya',
    displayName: 'Diya Sharma',
    username: 'diya.sharma',
    bio: 'Foodie & Traveler ✈️ | Delhi',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diya',
  },
  {
    uid: 'mock_rohan',
    displayName: 'Rohan Kumar',
    username: 'rohan_k',
    bio: 'Tech geek 💻 | Bangalore',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan',
  },
  {
    uid: 'mock_ananya',
    displayName: 'Ananya Singh',
    username: 'ananya_singh',
    bio: 'Just living life ✨ | Pune',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya',
  },
  {
    uid: 'mock_vikram',
    displayName: 'Vikram Gupta',
    username: 'vikram.gupta',
    bio: 'Coffee lover ☕ | Hyderabad',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram',
  }
];

const mockPosts = [
  {
    authorId: 'mock_aarav',
    imageUrl: 'https://images.unsplash.com/photo-1506461883276-594c40b14df8?q=80&w=1000&auto=format&fit=crop',
    caption: 'Gateway of India looking majestic today! 🇮🇳 #Mumbai #Travel',
    dominantColor: '#8b9dc3',
  },
  {
    authorId: 'mock_diya',
    imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=1000&auto=format&fit=crop',
    caption: 'Delicious street food in Chandni Chowk 🥘 #DelhiFood #Foodie',
    dominantColor: '#d35400',
  },
  {
    authorId: 'mock_rohan',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1000&auto=format&fit=crop',
    caption: 'Late night coding sessions 💻☕ #Bangalore #TechLife',
    dominantColor: '#2c3e50',
  },
  {
    authorId: 'mock_ananya',
    imageUrl: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=1000&auto=format&fit=crop',
    caption: 'Beautiful sunset at the Taj Mahal ✨ #Agra #IncredibleIndia',
    dominantColor: '#e67e22',
  },
  {
    authorId: 'mock_vikram',
    imageUrl: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=1000&auto=format&fit=crop',
    caption: 'Exploring the vibrant streets of Jaipur 🏰 #PinkCity #Rajasthan',
    dominantColor: '#c0392b',
  }
];

export const generateMockIndianAccounts = async () => {
  try {
    // Check if first mock user exists to avoid duplicates
    const firstUserRef = doc(db, 'users', mockUsers[0].uid);
    const firstUserSnap = await getDoc(firstUserRef);
    
    if (firstUserSnap.exists()) {
      console.log('Mock users already exist.');
      return;
    }

    console.log('Generating mock Indian users and posts...');
    
    // Create users
    for (const user of mockUsers) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            ...user,
            followersCount: Math.floor(Math.random() * 500),
            followingCount: Math.floor(Math.random() * 300),
            createdAt: serverTimestamp(),
          });
        }
      } catch (error) {
        console.error(`Error creating mock user ${user.uid}:`, error);
      }
    }

    // Create posts
    for (const post of mockPosts) {
      try {
        // We don't have a deterministic ID for posts, so we just create them
        // if the first user didn't exist (which we checked above)
        const newPostRef = doc(collection(db, 'posts'));
        await setDoc(newPostRef, {
          ...post,
          likesCount: Math.floor(Math.random() * 100),
          commentsCount: Math.floor(Math.random() * 20),
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        console.error(`Error creating mock post for ${post.authorId}:`, error);
      }
    }

    console.log('Mock data generated successfully!');
  } catch (error) {
    console.error('Error generating mock data:', error);
  }
};
