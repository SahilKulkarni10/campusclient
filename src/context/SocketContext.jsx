import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";
import { useNotificationStore } from "../lib/notificationStore";

// Determine the URL for the Socket.IO server
const SOCKET_URL = 
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_API_URL_DEV
    : import.meta.env.VITE_API_URL;

// Fallback socket URL in case the main one doesn't work
const FALLBACK_SOCKET_URL = "https://campusbackend-v4vp.onrender.com";

export const SocketContext = createContext();

export const SocketContextProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const addNotification = useNotificationStore((state) => state.add);

  useEffect(() => {
    // Initialize the Socket.IO connection
    const connectToSocket = (url) => {
      console.log(`Attempting to connect to socket server at: ${url}`);
      
      const newSocket = io(url, {
        withCredentials: true, // Enable cookies for cross-origin requests
        reconnectionAttempts: 5, // Try to reconnect 5 times
        reconnectionDelay: 1000, // Start with a 1 second delay
        reconnectionDelayMax: 5000, // Maximum delay between reconnections
        timeout: 10000, // Connection timeout
      });

      // Connection event listeners
      newSocket.on('connect', () => {
        console.log('Socket connected successfully');
        setConnectionStatus('connected');
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        setConnectionStatus('error');
        
        // If main URL fails, try fallback URL
        if (url === SOCKET_URL && SOCKET_URL !== FALLBACK_SOCKET_URL) {
          console.log('Trying fallback socket URL');
          newSocket.disconnect();
          connectToSocket(FALLBACK_SOCKET_URL);
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setConnectionStatus('disconnected');
      });

      setSocket(newSocket);
      
      return newSocket;
    };
    
    // Start with the primary URL
    const newSocket = connectToSocket(SOCKET_URL);

    // Clean up the socket connection when the component unmounts
    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Handle online users updates
    socket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    // Handle notifications for new messages
    socket.on("getMessage", (data) => {
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
      socket.off("getOnlineUsers");
      socket.off("getMessage");
      socket.off("getForumPost");
      socket.off("getComment");
    };
  }, [socket, currentUser, addNotification]);

  useEffect(() => {
    // Emit "newUser" when currentUser is available and socket is connected
    if (currentUser && socket && socket.connected) {
      socket.emit("newUser", currentUser.id);
    }
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
  const reconnectSocket = () => {
    if (socket) {
      socket.disconnect();
    }
    const newSocket = io(FALLBACK_SOCKET_URL, {
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
    setSocket(newSocket);
  };

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
