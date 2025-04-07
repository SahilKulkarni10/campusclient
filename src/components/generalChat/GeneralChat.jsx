import { useContext, useEffect, useRef, useState } from "react";
import "./generalChat.scss";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import { format } from "timeago.js";
import { SocketContext } from "../../context/SocketContext";

function GeneralChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { currentUser } = useContext(AuthContext);
  const { socket, connectionStatus } = useContext(SocketContext);
  const messageEndRef = useRef();
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch general chat messages
  useEffect(() => {
    if (currentUser) {
      fetchGeneralChatMessages();
    }
  }, [currentUser]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (socket) {
      // Listen for new general chat messages
      socket.on("getGeneralMessage", (data) => {
        setMessages(prev => [...prev, data]);
      });

      // Listen for typing indicators
      socket.on("userTypingGeneral", ({ senderId, username, isTyping }) => {
        if (senderId !== currentUser.id) {
          setTypingUsers(prev => ({
            ...prev,
            [senderId]: { isTyping, username }
          }));
        }
      });

      // Listen for online users
      socket.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      return () => {
        socket.off("getGeneralMessage");
        socket.off("userTypingGeneral");
        socket.off("getOnlineUsers");
      };
    }
  }, [socket, currentUser]);

  const fetchGeneralChatMessages = async () => {
    try {
      setLoading(true);
      const res = await apiRequest.get("/messages/general");
      setMessages(res.data || []);
    } catch (err) {
      console.error("Error fetching general chat messages:", err);
      setError("Failed to load messages. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!messageText.trim()) return;
    
    try {
      // Optimistically add message to UI
      const tempMessage = {
        id: `temp-${Date.now()}`,
        text: messageText,
        userId: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
        createdAt: new Date().toISOString(),
        isTemp: true
      };
      
      setMessages(prev => [...prev, tempMessage]);
      
      // Clear input field
      setMessageText("");
      
      // Send to server
      const res = await apiRequest.post("/messages/general", { text: messageText });
      
      // Replace temp message with real one
      setMessages(prev => 
        prev.map(msg => msg.id === tempMessage.id ? res.data : msg)
      );
      
      // Emit socket event
      if (socket && socket.connected) {
        socket.emit("sendGeneralMessage", res.data);
      }
      
      // Reset typing status
      handleStopTyping();
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
      
      // Remove the temp message on error
      setMessages(prev => prev.filter(msg => !msg.isTemp));
    }
  };

  const handleTyping = () => {
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // If not already set as typing
    if (!isTyping) {
      setIsTyping(true);
      // Emit typing event
      if (socket && socket.connected) {
        socket.emit("typingGeneral", {
          senderId: currentUser.id,
          username: currentUser.username,
          isTyping: true
        });
      }
    }
    
    // Set timeout to clear typing status after 3 seconds
    typingTimeoutRef.current = setTimeout(handleStopTyping, 3000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      // Emit stop typing event
      if (socket && socket.connected) {
        socket.emit("typingGeneral", {
          senderId: currentUser.id,
          username: currentUser.username,
          isTyping: false
        });
      }
    }
  };

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  const getTypingIndicators = () => {
    const typingUsersList = Object.entries(typingUsers)
      .filter(([_, data]) => data.isTyping)
      .map(([_, data]) => data.username);
    
    if (typingUsersList.length === 0) return null;
    if (typingUsersList.length === 1) return `${typingUsersList[0]} is typing...`;
    if (typingUsersList.length === 2) return `${typingUsersList[0]} and ${typingUsersList[1]} are typing...`;
    return `${typingUsersList.length} people are typing...`;
  };

  const renderConnectionStatus = () => {
    if (connectionStatus === 'error') {
      return (
        <div className="connection-error">
          Unable to connect to chat server. Messages will still be saved but real-time updates are disabled.
          <button className="reconnect-btn" onClick={() => socket.connect()}>
            Try to reconnect
          </button>
        </div>
      );
    }
    if (connectionStatus === 'disconnected') {
      return <div className="connection-warning">Disconnected from chat server. Trying to reconnect...</div>;
    }
    return null;
  };

  return (
    <div className="generalChat">
      <div className="chatBox">
        <div className="top">
          <h2>Community Chat</h2>
          <div className="info">
            <span>{onlineUsers.length} user(s) online</span>
          </div>
        </div>
        
        <div className="center">
          {loading ? (
            <div className="loading-messages">Loading messages...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : messages.length === 0 ? (
            <div className="no-messages">No messages yet. Start the conversation!</div>
          ) : (
            messages.map((message) => (
              <div
                className={`chatMessage ${message.userId === currentUser.id ? "own" : ""} ${message.isTemp ? "temp" : ""}`}
                key={message.id}
              >
                <div className="user-info">
                  <img 
                    src={message.avatar || "/noavatar.jpg"} 
                    alt={message.username} 
                    className="avatar" 
                  />
                  <span className="username">{message.username}</span>
                  {isUserOnline(message.userId) && <span className="online-dot"></span>}
                </div>
                <div className="bubble">
                  <p>{message.text}</p>
                  <span className="time">{format(message.createdAt)}</span>
                </div>
              </div>
            ))
          )}
          
          {getTypingIndicators() && (
            <div className="typing-indicator">
              <span>{getTypingIndicators()}</span>
            </div>
          )}
          <div ref={messageEndRef}></div>
        </div>
        
        <form onSubmit={handleSubmit} className="bottom">
          <textarea 
            name="text" 
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              } else {
                handleTyping();
              }
            }}
          />
          <button type="submit" disabled={loading || !messageText.trim()}>
            Send
          </button>
        </form>
      </div>
      {renderConnectionStatus()}
    </div>
  );
}

export default GeneralChat; 