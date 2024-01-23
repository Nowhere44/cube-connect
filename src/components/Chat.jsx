// Client React (Chat.js)
import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext"; // Assurez-vous d'importer votre gestion de l'authentification ici

const Chat = ({ groupId }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const { user } = useAuth(); // Assurez-vous d'obtenir l'utilisateur authentifié de votre contexte

  useEffect(() => {
    const token = localStorage.getItem("token"); // Récupérez le token JWT du local storage
    const socket = io("http://localhost:5000", {
      auth: {
        token: token,
      },
    });

    socket.emit("joinGroup", { groupId, token: token });

    socket.on("message", (message) => {
      setMessages((msgs) => [...msgs, message]);
    });

    return () => {
      socket.off("message");
      socket.disconnect();
    };
  }, [groupId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message) {
      const token = localStorage.getItem("token"); // Récupérez à nouveau le token JWT
      const socket = io("http://localhost:5000", {
        auth: {
          token: token,
        },
      });
      socket.emit("sendMessage", { groupId, userId: user.id, message });
      setMessage("");
      socket.disconnect(); // Déconnectez le socket après l'envoi du message
    }
  };

  return (
    <div>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>{msg.text}</div>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              sendMessage(e);
            }
          }}
        />
        <button type="submit">Envoyer</button>
      </form>
    </div>
  );
};

export default Chat;
