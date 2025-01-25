import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import GameLobby from "./components/GameLobby";
import GameBoard from "./components/GameBoard";
import GameOver from "./components/GameOver";

const socket = io("wss://skyjo-8gey.onrender.com", {
  path: "/socket.io",
  transports: ["websocket"],
  autoConnect: false,
  secure: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 3000,
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
    const handleConnect = () => console.log("Connecté au serveur");
    const handleDisconnect = () => socket.connect();

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", (err) => {
      setError(`Erreur de connexion: ${err.message}`);
      setTimeout(() => setError(""), 5000);
    });

    const handleRoomUpdate = (room) => {
      setRoomState((prev) => ({
        ...prev,
        ...room,
        players: room.players || prev.players,
        code: room.code || prev.code,
      }));
    };

    socket.on("roomUpdate", handleRoomUpdate);
    socket.on("gameStart", (room) =>
      setRoomState((prev) => ({ ...prev, ...room }))
    );
    socket.on("gameEnd", (room) =>
      setRoomState((prev) => ({ ...prev, ...room }))
    );

    if (!socket.connected) {
      socket.connect();
    }

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
    if (!playerName.trim()) {
      return setError("Veuillez entrer un nom valide");
    }

    setPlayer({ name: playerName, photo: playerPhoto });

    if (socket.disconnected) {
      socket.connect();
      setTimeout(
        () => handleJoinRoom(playerName, playerPhoto, code, maxPlayers),
        500
      );
      return;
    }

    const action = code ? "joinRoom" : "createRoom";
    socket.emit(action, {
      ...(code && { roomCode: code.toUpperCase() }),
      playerName: playerName.trim(),
      playerPhoto,
      ...(!code && {
        maxPlayers: Math.min(Math.max(Number(maxPlayers), 2), 4),
      }),
    });
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
