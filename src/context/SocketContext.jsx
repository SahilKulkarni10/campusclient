// import { createContext, useContext, useEffect, useState } from "react";
// import { io } from "socket.io-client";
// import { AuthContext } from "./AuthContext";

// export const SocketContext = createContext();

// export const SocketContextProvider = ({ children }) => {
//   const { currentUser } = useContext(AuthContext);
//   const [socket, setSocket] = useState(null);

//   useEffect(() => {
//     setSocket(io("http://localhost:4000"));
//   }, []);

//   useEffect(() => {
//   currentUser && socket?.emit("newUser", currentUser.id);
//   }, [currentUser, socket]);

//   return (
//     <SocketContext.Provider value={{ socket }}>
//       {children}
//     </SocketContext.Provider>
//   );
// };


import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

// Determine the URL for the Socket.IO server
const SOCKET_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:8800" // Local development
    : "https://campus-test-zz76.vercel.app"; // Production

export const SocketContext = createContext();

export const SocketContextProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

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
    // Emit "newUser" when currentUser is available
    if (currentUser && socket) {
      socket.emit("newUser", currentUser.id);
    }
  }, [currentUser, socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
