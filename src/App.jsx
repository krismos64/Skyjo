import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import GameLobby from "./components/GameLobby";
import GameBoard from "./components/GameBoard";
import GameOver from "./components/GameOver";

const socket = io("wss://skyjo-8gey.onrender.com", {
  path: "/socket.io",
  transports: ["websocket"],
  secure: true,
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 3000,
  pingInterval: 25000,
  pingTimeout: 60000,
  auth: {
    token: "skyjo-v1",
  },
});

export default function App() {
  const [roomState, setRoomState] = useState({
    players: [],
    discardPile: [],
    maxPlayers: 2,
    currentTurn: 0,
    status: "waiting",
    code: "",
  });

  const [player, setPlayer] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Forçage HTTPS
    if (window.location.protocol === "http:") {
      window.location.href = window.location.href.replace("http:", "https:");
    }

    const handleConnect = () => {
      console.log("✅ Connecté au serveur");
      setError("");
    };

    const handleDisconnect = () => {
      console.log("❌ Déconnecté");
      socket.connect();
    };

    const connectWithRetry = () => {
      if (!socket.connected) {
        socket.connect();
        setTimeout(() => {
          if (!socket.connected) {
            console.log("🔄 Nouvelle tentative...");
            connectWithRetry();
          }
        }, 5000);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", (err) => {
      setError(`Connexion échouée: ${err.message}`);
      setTimeout(connectWithRetry, 3000);
    });

    const handleRoomUpdate = (room) => {
      setRoomState((prev) => ({
        ...prev,
        ...room,
        players:
          room.players?.map((p) => ({
            ...p,
            isYou: p.id === socket.id,
          })) || prev.players,
      }));
    };

    socket.on("roomUpdate", handleRoomUpdate);
    socket.on("gameStart", (room) => {
      setRoomState((prev) => ({ ...prev, ...room }));
      console.log("🎮 Début de partie !");
    });
    socket.on("gameEnd", (room) => {
      setRoomState((prev) => ({ ...prev, ...room }));
      console.log("🏁 Fin de partie");
    });

    connectWithRetry();

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("roomUpdate");
      socket.off("gameStart");
      socket.off("gameEnd");
      socket.disconnect();
    };
  }, []);

  const handleJoinRoom = (playerName, playerPhoto, code, maxPlayers) => {
    const trimmedName = playerName?.trim();

    if (!trimmedName || trimmedName.length < 2) {
      return setError("Le nom doit contenir au moins 2 caractères");
    }

    setPlayer({
      name: trimmedName,
      photo: playerPhoto || "👤",
    });

    const action = code ? "joinRoom" : "createRoom";
    const payload = {
      playerName: trimmedName,
      playerPhoto,
      ...(code && { roomCode: code.toUpperCase() }),
      ...(!code && {
        maxPlayers: Math.min(Math.max(Number(maxPlayers), 2), 4),
      }),
    };

    if (socket.connected) {
      socket.emit(action, payload);
    } else {
      socket.connect();
      socket.once("connect", () => socket.emit(action, payload));
    }
  };

  const handleGameAction = (action, data = {}) => {
    if (socket.connected) {
      socket.emit(action, {
        roomCode: roomState.code,
        ...data,
      });
    }
  };

  const renderContent = () => {
    if (!roomState.code || roomState.status === "waiting") {
      return (
        <GameLobby
          onJoin={handleJoinRoom}
          currentCode={roomState.code}
          error={error}
          roomState={roomState}
        />
      );
    }

    return (
      <div className="relative min-h-screen">
        <div className="fixed top-4 left-0 right-0 text-center z-50">
          <div className="inline-block bg-black/30 backdrop-blur-md text-white px-6 py-2 rounded-full">
            Code :{" "}
            <span className="font-bold text-emerald-400">{roomState.code}</span>
            {roomState.status === "waiting" && (
              <span className="ml-4">
                {roomState.players.length}/{roomState.maxPlayers} joueurs
              </span>
            )}
          </div>
        </div>

        {roomState.status === "finished" ? (
          <GameOver
            roomState={roomState}
            playerId={socket.id}
            onPlayAgain={() =>
              handleJoinRoom(player.name, player.photo, roomState.code)
            }
          />
        ) : (
          <GameBoard
            gameState={roomState}
            playerId={socket.id}
            onRevealCard={(cardIndex) =>
              handleGameAction("revealCard", { cardIndex })
            }
            onDrawCard={() => handleGameAction("drawCard")}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900">
      {renderContent()}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-up">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
