import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";
import { useNotificationStore } from "../lib/notificationStore";

// Determine the URL for the Socket.IO server
const SOCKET_URL = 
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_API_URL_DEV
    : import.meta.env.VITE_API_URL;

// Fallback socket URLs in case the main one doesn't work
// Try multiple variations to bypass connectivity issues
const FALLBACK_URLS = [
  "wss://campusbackend-v4vp.onrender.com", 
  "https://campusbackend-v4vp.onrender.com",
  // Remove any API path that might be causing issues
  SOCKET_URL.replace(/\/api\/?.*$/, "")
];

// For debugging server connection issues
const testServerConnection = async (url) => {
  try {
    const testUrl = url.startsWith('wss:') 
      ? url.replace('wss:', 'https:')
      : url;
      
    console.log(`Testing server connection to: ${testUrl}`);
    const response = await fetch(testUrl, { 
      method: 'HEAD',
      mode: 'cors',
      credentials: 'include'
    });
    console.log(`Server response: ${response.status}`);
    return response.ok || response.status === 404; // 404 is fine, it means server is running
  } catch (error) {
    console.error('Server connection test failed:', error);
    return false;
  }
};

export const SocketContext = createContext();

export const SocketContextProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [currentServerUrl, setCurrentServerUrl] = useState(SOCKET_URL);
  const addNotification = useNotificationStore((state) => state.add);

  // Create socket connection with specified URL
  const createSocketConnection = useCallback((url) => {
    console.log(`Creating socket connection to: ${url}`);
    
    if (socket) {
      console.log('Disconnecting existing socket');
      socket.disconnect();
    }
    
    // Try different transport strategies for maximum compatibility
    const socketOptions = {
      withCredentials: true, // Enable cookies for cross-origin requests
      reconnectionAttempts: 5, // Try to reconnect 5 times
      reconnectionDelay: 1000, // Start with a 1 second delay
      reconnectionDelayMax: 5000, // Maximum delay between reconnections
      timeout: 10000, // Connection timeout
      transports: ['websocket', 'polling'], // Try websocket first, then polling
      forceNew: true, // Force a new connection
      autoConnect: true // Auto connect
    };
    
    const newSocket = io(url, socketOptions);
    setSocket(newSocket);
    setCurrentServerUrl(url);
    
    return newSocket;
  }, [socket]);

  // Initialize the socket connection
  useEffect(() => {
    console.log('Initializing socket connection');
    
    const tryNextServer = async (index = 0) => {
      if (index >= FALLBACK_URLS.length + 1) {
        console.log('All server URLs failed');
        setConnectionStatus('error');
        return null;
      }
      
      // Try main URL first, then fallbacks
      const urlToTry = index === 0 ? SOCKET_URL : FALLBACK_URLS[index - 1];
      console.log(`Attempting to connect to socket server at: ${urlToTry} (attempt ${index + 1}/${FALLBACK_URLS.length + 1})`);
      
      // First test if the server is reachable
      const isServerReachable = await testServerConnection(urlToTry);
      if (!isServerReachable) {
        console.log(`Server at ${urlToTry} is not reachable`);
        // Try next server
        return tryNextServer(index + 1);
      }
      
      const newSocket = createSocketConnection(urlToTry);

      // Connection event listeners
      newSocket.on('connect', () => {
        console.log(`Socket connected successfully to ${urlToTry}`);
        setConnectionStatus('connected');
        setConnectionAttempts(0);
        
        // If user is logged in, immediately emit newUser event
        if (currentUser) {
          console.log(`Emitting newUser event for user: ${currentUser.id}`);
          newSocket.emit("newUser", currentUser.id);
        }
      });

      newSocket.on('connect_error', (err) => {
        console.error(`Socket connection error to ${urlToTry}:`, err.message);
        setConnectionStatus('error');
        setConnectionAttempts(prev => prev + 1);
        
        // After 3 failed attempts, try next server
        if (connectionAttempts >= 2) {
          console.log(`${connectionAttempts + 1} failed attempts, trying next server`);
          newSocket.disconnect();
          tryNextServer(index + 1);
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log(`Socket disconnected from ${urlToTry}:`, reason);
        setConnectionStatus('disconnected');
      });
      
      return newSocket;
    };
    
    // Start trying to connect to servers
    let activeSocket;
    tryNextServer().then(socket => {
      if (socket) activeSocket = socket;
    });

    // Clean up the socket connection when the component unmounts
    return () => {
      console.log('Cleaning up socket connection');
      if (activeSocket) activeSocket.disconnect();
    };
  }, [currentUser, createSocketConnection, connectionAttempts]);

  // Set up event listeners
  useEffect(() => {
    if (!socket) return;

    console.log('Setting up socket event listeners');
    
    // Ping server to test connectivity
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        console.log('Sending ping to server');
        socket.emit('ping');
      }
    }, 30000); // Every 30 seconds
    
    socket.on('pong', () => {
      console.log('Received pong from server');
    });
    
    // Handle online users updates
    socket.on("getOnlineUsers", (users) => {
      console.log('Received online users:', users);
      setOnlineUsers(users);
    });

    // Handle notifications for new messages
    socket.on("getMessage", (data) => {
      console.log('Received message:', data);
      // Only create notification if not from current user
      if (currentUser && data.userId !== currentUser.id) {
        addNotification({
          type: "message",
          senderId: data.userId,
          chatId: data.chatId,
          text: `New message from ${data.senderName || 'someone'}`
        });
      }
    });

    // Handle notifications for new forum posts
    socket.on("getForumPost", (data) => {
      console.log('Received forum post:', data);
      // Only create notification if not from current user
      if (currentUser && data.userId !== currentUser.id) {
        addNotification({
          type: "forum",
          postId: data.postId,
          text: `New forum post: ${data.title}`
        });
      }
    });

    // Handle notifications for new comments
    socket.on("getComment", (data) => {
      console.log('Received comment:', data);
      // Only create notification if not from current user and not on user's own post
      if (currentUser && data.userId !== currentUser.id && data.postUserId !== currentUser.id) {
        addNotification({
          type: "comment",
          postId: data.postId,
          text: `New comment on post: ${data.postTitle || 'a post'}`
        });
      }
    });

    return () => {
      console.log('Removing socket event listeners');
      clearInterval(pingInterval);
      socket.off('pong');
      socket.off("getOnlineUsers");
      socket.off("getMessage");
      socket.off("getForumPost");
      socket.off("getComment");
    };
  }, [socket, currentUser, addNotification]);

  // Function to emit newUser when currentUser changes or socket reconnects
  useEffect(() => {
    if (!socket || !currentUser || !socket.connected) return;
    
    console.log(`Emitting newUser for user: ${currentUser.id}`);
    socket.emit("newUser", currentUser.id);
  }, [currentUser, socket, connectionStatus]);

  // Function to emit typing status
  const emitTyping = (receiverId, isTyping) => {
    if (socket && socket.connected && currentUser) {
      socket.emit("typing", {
        senderId: currentUser.id,
        receiverId,
        isTyping
      });
    }
  };

  // Function to manually reconnect socket
  const reconnectSocket = useCallback(async () => {
    console.log('Manual reconnection requested');
    
    // Try all servers in sequence until one works
    const allUrls = [SOCKET_URL, ...FALLBACK_URLS];
    let connected = false;
    
    for (let i = 0; i < allUrls.length; i++) {
      const urlToTry = allUrls[i];
      console.log(`Trying to connect to ${urlToTry}`);
      
      // Test if the server is reachable
      const isServerReachable = await testServerConnection(urlToTry);
      
      if (isServerReachable) {
        console.log(`Server at ${urlToTry} is reachable, attempting connection`);
        createSocketConnection(urlToTry);
        connected = true;
        break;
      } else {
        console.log(`Server at ${urlToTry} is not reachable`);
      }
    }
    
    if (!connected) {
      console.log('All servers are unreachable');
      setConnectionStatus('error');
    }
  }, [createSocketConnection]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      onlineUsers, 
      emitTyping,
      connectionStatus,
      reconnectSocket
    }}>
      {children}
    </SocketContext.Provider>
  );
};
