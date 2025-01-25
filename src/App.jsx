import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import GameLobby from "./components/GameLobby";
import GameBoard from "./components/GameBoard";
import GameOver from "./components/GameOver";

const socket = io("http://localhost:3000", {
  path: "/socket.io",
  transports: ["websocket"],
  autoConnect: false,
  withCredentials: true,
});

export default function App() {
  const [roomState, setRoomState] = useState(null);
  const [player, setPlayer] = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Gestion des événements serveur
    socket.on("roomUpdate", (room) => {
      setRoomState(room);
      setRoomCode(room?.code || "");
    });

    socket.connect();

    socket.on("gameStart", (room) => {
      setRoomState(room);
    });

    socket.on("gameEnd", (room) => {
      setRoomState(room);
    });

    socket.on("error", (err) => {
      setError(err.message);
      setTimeout(() => setError(""), 5000);
    });

    return () => {
      socket.off("roomUpdate");
      socket.off("gameStart");
      socket.off("gameEnd");
      socket.off("error");
    };
  }, []);

  const handleJoinRoom = (playerName, playerPhoto, code, maxPlayers) => {
    setPlayer({ name: playerName, photo: playerPhoto });

    if (code) {
      socket.emit("joinRoom", {
        roomCode: code.toUpperCase(),
        playerName,
        playerPhoto,
      });
    } else {
      socket.emit("createRoom", {
        playerName,
        playerPhoto,
        maxPlayers: Math.min(Math.max(maxPlayers, 2), 4),
      });
    }
  };

  const handleGameAction = (action, data = {}) => {
    socket.emit(action, {
      roomCode,
      ...data,
    });
  };

  const renderContent = () => {
    if (!roomState) {
      return (
        <GameLobby
          onJoin={handleJoinRoom}
          currentCode={roomCode}
          error={error}
        />
      );
    }

    return (
      <div className="relative min-h-screen">
        {/* En-tête avec code de partie */}
        <div className="fixed top-4 left-0 right-0 text-center z-50">
          <div className="inline-block bg-black/30 backdrop-blur-md text-white px-6 py-2 rounded-full">
            Code :{" "}
            <span className="font-bold text-emerald-400">{roomCode}</span>
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
              handleJoinRoom(player.name, player.photo, roomCode)
            }
          />
        ) : (
          <GameBoard
            roomState={roomState}
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

      {/* Affichage des erreurs */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-up">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
