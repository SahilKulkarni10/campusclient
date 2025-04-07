import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";
import { useNotificationStore } from "../lib/notificationStore";

// Determine the URL for the Socket.IO server
const SOCKET_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:8800" // Local development
    : "https://campus-test-zz76.vercel.app"; // Production

export const SocketContext = createContext();

export const SocketContextProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const addNotification = useNotificationStore((state) => state.add);

  useEffect(() => {
    // Initialize the Socket.IO connection
    const newSocket = io(SOCKET_URL, {
      withCredentials: true, // Enable cookies for cross-origin requests
    });

    setSocket(newSocket);

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
    // Emit "newUser" when currentUser is available
    if (currentUser && socket) {
      socket.emit("newUser", currentUser.id);
    }
  }, [currentUser, socket]);

  // Function to emit typing status
  const emitTyping = (receiverId, isTyping) => {
    if (socket && currentUser) {
      socket.emit("typing", {
        senderId: currentUser.id,
        receiverId,
        isTyping
      });
    }
  };

  return (
    <SocketContext.Provider value={{ 
      socket, 
      onlineUsers, 
      emitTyping 
    }}>
      {children}
    </SocketContext.Provider>
  );
};
