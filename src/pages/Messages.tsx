import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { getOrCreateConversation, sendMessage } from '../lib/db';
import { Send, MessageCircle, Search } from 'lucide-react';
import { getUserData } from '../lib/userCache';
import { format, formatDistanceToNow } from 'date-fns';

export const Messages = () => {
  const { id: targetUserId } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [targetUser, setTargetUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const convos = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data();
        const otherUserId = data.participantIds.find((id: string) => id !== user.uid);
        let otherUser = null;
        if (otherUserId) {
          otherUser = await getUserData(otherUserId);
        }
        return { id: d.id, ...data, otherUser };
      }));
      setConversations(convos);
    });
    
    return () => unsubscribe();
  }, [user]);

  // Handle direct message link (e.g., from profile)
  useEffect(() => {
    const initDirectMessage = async () => {
      if (user && targetUserId) {
        const convId = await getOrCreateConversation(user.uid, targetUserId);
        setActiveConversationId(convId);
        
        const userData = await getUserData(targetUserId);
        if (userData) {
          setTargetUser(userData);
        }
      } else {
        setActiveConversationId(null);
        setTargetUser(null);
      }
    };
    initDirectMessage();
  }, [user, targetUserId]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', activeConversationId),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
    
    return () => unsubscribe();
  }, [activeConversationId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeConversationId || !newMessage.trim()) return;
    
    const text = newMessage.trim();
    setNewMessage('');
    
    try {
      await sendMessage(activeConversationId, user.uid, text);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    const searchLower = searchQuery.toLowerCase();
    const username = conv.otherUser?.username?.toLowerCase() || '';
    const displayName = conv.otherUser?.displayName?.toLowerCase() || '';
    return username.includes(searchLower) || displayName.includes(searchLower);
  });

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm flex h-[85vh] mt-4">
      {/* Sidebar */}
      <div className={`${activeConversationId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 border-r border-gray-200 dark:border-gray-800`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 font-bold text-lg flex items-center justify-between">
          <span>{user.displayName}</span>
        </div>
        
        {/* Search Bar */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg leading-5 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filteredConversations.map(conv => (
            <div 
              key={conv.id}
              onClick={() => {
                setActiveConversationId(conv.id);
                setTargetUser(conv.otherUser);
                navigate(`/messages/${conv.otherUser?.uid}`);
              }}
              className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${activeConversationId === conv.id ? 'bg-gray-50 dark:bg-gray-900' : ''}`}
            >
              <img 
                src={conv.otherUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.otherUser?.uid}`} 
                alt={conv.otherUser?.username} 
                className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-800 mr-3"
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <div className="font-semibold truncate">{conv.otherUser?.username || 'Unknown User'}</div>
                  {conv.lastMessageAt?.toDate && (
                    <div className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                      {formatDistanceToNow(conv.lastMessageAt.toDate(), { addSuffix: false }).replace('about ', '')}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {conv.lastMessage || 'Started a conversation'}
                </div>
              </div>
            </div>
          ))}
          {filteredConversations.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              {searchQuery ? 'No conversations found.' : 'No messages found.'}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${!activeConversationId ? 'hidden md:flex' : 'flex'} flex-col flex-1`}>
        {activeConversationId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center">
              <button 
                className="md:hidden mr-4 text-gray-500"
                onClick={() => {
                  setActiveConversationId(null);
                  navigate('/messages');
                }}
              >
                ←
              </button>
              <img 
                src={targetUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser?.uid}`} 
                alt={targetUser?.username} 
                className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-800 mr-3"
              />
              <span className="font-semibold">{targetUser?.username || 'Unknown User'}</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => {
                const isMe = msg.senderId === user.uid;
                const prevMsg = messages[index - 1];
                const showTimestamp = index === 0 || 
                  (msg.createdAt?.seconds && prevMsg?.createdAt?.seconds && 
                   msg.createdAt.seconds - prevMsg.createdAt.seconds > 3600);
                   
                return (
                  <div key={msg.id} className="flex flex-col">
                    {showTimestamp && msg.createdAt?.toDate && (
                      <div className="text-center text-xs text-gray-500 my-4">
                        {format(msg.createdAt.toDate(), 'MMM d, h:mm a')}
                      </div>
                    )}
                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                      <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${isMe ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-800 rounded-bl-sm'}`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <form onSubmit={handleSendMessage} className="flex items-center relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Message..."
                  className="w-full bg-transparent border border-gray-300 dark:border-gray-700 rounded-full py-2 pl-4 pr-12 focus:outline-none focus:border-gray-400 dark:focus:border-gray-600"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="absolute right-2 p-2 text-blue-500 disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 border-2 border-black dark:border-white rounded-full flex items-center justify-center mb-4">
              <MessageCircle size={48} className="stroke-[1.5px]" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your Messages</h2>
            <p className="text-gray-500 mb-6">Send private photos and messages to a friend or group.</p>
            <button className="bg-blue-500 text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
              Send Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
