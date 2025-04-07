import { useContext, useEffect, useRef, useState } from "react";
import "./chat.scss";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import { format } from "timeago.js";
import { SocketContext } from "../../context/SocketContext";
import { useNotificationStore } from "../../lib/notificationStore";

function Chat({ chats: initialChats }) {
  const [chat, setChat] = useState(null);
  const [chats, setChats] = useState(initialChats || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { currentUser } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const messageEndRef = useRef();
  const typingTimeoutRef = useRef(null);
  const decrease = useNotificationStore((state) => state.decrease);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (socket) {
      // Listen for new messages
      socket.on("getMessage", (data) => {
        if (chat && chat.id === data.chatId) {
          setChat((prev) => ({
            ...prev,
            messages: [...(prev.messages || []), data],
          }));
          readChat(chat.id);
        }
      });

      // Listen for typing indicators
      socket.on("userTyping", ({ senderId, isTyping }) => {
        if (senderId !== currentUser.id) {
          setTypingUsers(prev => ({
            ...prev,
            [senderId]: isTyping
          }));
        }
      });

      // Listen for online users
      socket.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      return () => {
        socket.off("getMessage");
        socket.off("userTyping");
        socket.off("getOnlineUsers");
      };
    }
  }, [socket, chat, currentUser]);

  // Fetch updated chats list if not provided
  useEffect(() => {
    if (!initialChats && currentUser) {
      fetchChats();
    }
  }, [initialChats, currentUser]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await apiRequest.get("/chats");
      setChats(res.data);
    } catch (err) {
      console.error("Error fetching chats:", err);
      setError("Failed to load chats. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = async (id, receiver) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest.get("/chats/" + id);
      
      if (!res.data.seenBy?.includes(currentUser.id)) {
        decrease();
      }
      
      setChat({ 
        ...res.data, 
        receiver: receiver || res.data.receiver,
        messages: res.data.messages || [] 
      });
    } catch (err) {
      console.error("Error opening chat:", err);
      setError("Failed to open chat. Please try again later.");
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
        chatId: chat.id,
        createdAt: new Date().toISOString(),
        isTemp: true
      };
      
      setChat(prev => ({
        ...prev,
        messages: [...prev.messages, tempMessage]
      }));
      
      // Clear input field
      setMessageText("");
      
      // Send to server
      const res = await apiRequest.post("/messages/" + chat.id, { text: messageText });
      
      // Replace temp message with real one
      setChat(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === tempMessage.id ? res.data : msg
        )
      }));
      
      // Emit socket event
      if (socket) {
        socket.emit("sendMessage", {
          receiverId: chat.receiver.id,
          data: res.data,
        });
      }
      
      // Reset typing status
      handleStopTyping();
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
      
      // Remove the temp message on error
      setChat(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => !msg.isTemp)
      }));
    }
  };

  const readChat = async (chatId) => {
    try {
      await apiRequest.put("/chats/read/" + chatId);
    } catch (err) {
      console.error("Error marking chat as read:", err);
    }
  };

  const handleTyping = () => {
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // If not already set as typing
    if (!isTyping && chat) {
      setIsTyping(true);
      // Emit typing event
      socket?.emit("typing", {
        receiverId: chat.receiver.id,
        isTyping: true
      });
    }
    
    // Set timeout to clear typing status after 3 seconds
    typingTimeoutRef.current = setTimeout(handleStopTyping, 3000);
  };

  const handleStopTyping = () => {
    if (isTyping && chat) {
      setIsTyping(false);
      // Emit stop typing event
      socket?.emit("typing", {
        receiverId: chat.receiver.id,
        isTyping: false
      });
    }
  };

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  const isReceiverTyping = () => {
    return chat && typingUsers[chat.receiver.id];
  };

  return (
    <div className="chat">
      <div className="messages">
        <h1>Messages</h1>
        {loading && !chat ? (
          <div className="loading">Loading conversations...</div>
        ) : error && !chat ? (
          <div className="error">{error}</div>
        ) : chats?.length === 0 ? (
          <div className="empty">You have no conversations yet.</div>
        ) : (
          chats?.map((c) => (
            <div
              className={`message ${c.seenBy?.includes(currentUser.id) || chat?.id === c.id ? "" : "unread"}`}
              key={c.id}
              onClick={() => handleOpenChat(c.id, c.receiver)}
            >
              <div className="avatar">
                <img src={c.receiver.avatar || "/noavatar.jpg"} alt="" />
                {isUserOnline(c.receiver.id) && <span className="online-indicator"></span>}
              </div>
              <div className="content">
                <div className="header">
                  <span className="username">{c.receiver.username}</span>
                  <span className="time">{c.messages?.[0]?.createdAt && format(c.messages[0].createdAt)}</span>
                </div>
                <p className="preview">{c.lastMessage}</p>
              </div>
            </div>
          ))
        )}
      </div>
      
      {chat && (
        <div className="chatBox">
          <div className="top">
            <div className="user">
              <div className="avatar">
                <img src={chat.receiver.avatar || "/noavatar.jpg"} alt="" />
                {isUserOnline(chat.receiver.id) && <span className="online-indicator"></span>}
              </div>
              <span className="username">{chat.receiver.username}</span>
            </div>
            <span className="close" onClick={() => setChat(null)}>X</span>
          </div>
          
          <div className="center">
            {loading ? (
              <div className="loading-messages">Loading messages...</div>
            ) : chat.messages.length === 0 ? (
              <div className="no-messages">No messages yet. Start the conversation!</div>
            ) : (
              chat.messages.map((message) => (
                <div
                  className={`chatMessage ${message.userId === currentUser.id ? "own" : ""} ${message.isTemp ? "temp" : ""}`}
                  key={message.id}
                >
                  <div className="bubble">
                    <p>{message.text}</p>
                    <span className="time">{format(message.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
            {isReceiverTyping() && (
              <div className="typing-indicator">
                <span>{chat.receiver.username} is typing...</span>
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
      )}
    </div>
  );
}

export default Chat;
  