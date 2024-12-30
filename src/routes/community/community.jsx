


// import { motion } from "framer-motion";
// import React from "react";
// import "./community.scss";





// const textVariants = {
//   initial: {
//     x: -500,
//     opacity: 0,
//   },
//   animate: {
//     x: 0,
//     opacity: 1,
//     transition: {
//       duration: 1,
//       staggerChildren: 0.1,
//     },
//   },
//   scrollButton: {
//     opacity: 0,
//     y: 10,
//     transition: {
//       duration: 2,
//       repeat: Infinity,
//     },
//   },
// };
// const sliderVariants = {
//   initial: {
//     x: 0,
//   },
//   animate: {
//     x: "-220%",
//     transition: {
//       repeat: Infinity,
//       repeatType:"mirror",
//       duration: 20,
//     },
//   },
// };



// const Community = () => {
//   return (
//     <div className="hero">
//       <div className="wrapper">
//         <motion.div
//           className="textContainer"
//           variants={textVariants}
//           initial="initial"
//           animate="animate"
//         >
//           <motion.h1 variants={textVariants}>Coming Soon!!</motion.h1>
//           {/* <motion.h1 variants={textVariants}>
//             A Web developer and Software Engineer
//           </motion.h1> */}
//           <motion.div variants={textVariants} className="buttons">
//             {/* <motion.button variants={textVariants}>
//               See the Latest Works
//             </motion.button> */}
//             <motion.button variants={textVariants}>Contact Me</motion.button>
//           </motion.div>
//           {/* <motion.img
//             variants={textVariants}
//             animate="scrollButton"
//             src="/scroll.png"
//             alt=""
//           /> */}
//         </motion.div>
//       </div>
//       <motion.div
//         className="slidingTextContainer"
//         variants={sliderVariants}
//         initial="initial"
//         animate="animate"
//       >
//         Web developer
//       </motion.div>
//       {/* <div className="imageContainer">
//         <img src="/" alt="" />
//       </div> */}
//     </div>
//   );
// };

// export default Community;





import React, { useEffect, useRef, useState, useContext } from "react";
import { motion } from "framer-motion";
import { format } from "timeago.js";
import apiRequest from "../../lib/apiRequest";
import { SocketContext } from "../../context/SocketContext";
import { AuthContext } from "../../context/AuthContext";
import "./community.scss";
import Chat from "../../components/chat/Chat";

const textVariants = {
  initial: {
    x: -500,
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 1,
      staggerChildren: 0.1,
    },
  },
};

const sliderVariants = {
  initial: {
    x: 0,
  },
  animate: {
    x: "-220%",
    transition: {
      repeat: Infinity,
      repeatType: "mirror",
      duration: 20,
    },
  },
};

const Community = ({ chats }) => {
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const { currentUser } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const messageEndRef = useRef();

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleOpenChat = async (id) => {
    try {
      const res = await apiRequest("/chats/" + id);
      setChat(res.data);
      setMessages(res.data.messages);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const text = formData.get("text");
    if (!text) return;

    try {
      const res = await apiRequest.post("/messages/" + chat.id, { text });
      setMessages((prev) => [...prev, res.data]);
      e.target.reset();
      socket.emit("sendMessage", {
        receiverId: chat.receiver.id,
        data: res.data,
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (chat && socket) {
      const handleMessage = (data) => {
        if (chat.id === data.chatId) {
          setMessages((prev) => [...prev, data]);
        }
      };

      socket.on("getMessage", handleMessage);

      // Cleanup function
      return () => {
        if (socket) {
          socket.off("getMessage", handleMessage);
        }
      };
    }
  }, [socket, chat]);

  return (
    <div className="hero">
      <div className="wrapper">
        <motion.div
          className="textContainer"
          variants={textVariants}
          initial="initial"
          animate="animate"
        >
          <motion.h1 variants={textVariants}>Coming Soon!!</motion.h1>
          <motion.div variants={textVariants} className="buttons">
            {chats?.map((c) => (
              <motion.button
                variants={textVariants}
                key={c.id}
                onClick={() => handleOpenChat(c.id)}
              >
                Open Chat {c.id}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      </div>
      <motion.div
        className="slidingTextContainer"
        variants={sliderVariants}
        initial="initial"
        animate="animate"
      >
        Web developer
      </motion.div>
      <div className="imageContainer">
        <img src="/Hero.jpg" alt="Hero" />
      </div>
      {chat && (
        <div className="chatBox">
          <div className="center">
            {messages.map((message) => (
              <div
                className="chatMessage"
                style={{
                  alignSelf:
                    message.userId === currentUser.id
                      ? "flex-end"
                      : "flex-start",
                  textAlign:
                    message.userId === currentUser.id ? "right" : "left",
                }}
                key={message.id}
              >
                <p>{message.text}</p>
                <span>{format(message.createdAt)}</span>
              </div>
            ))}
            <div ref={messageEndRef}></div>
          </div>
          <form onSubmit={handleSubmit} className="bottom">
            <textarea name="text" placeholder="Type your message..." />
            <button>Send</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Community;
