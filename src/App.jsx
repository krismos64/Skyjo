import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import GameLobby from "./components/GameLobby";
import GameBoard from "./components/GameBoard";
import GameOver from "./components/GameOver";

const socket = io(window.location.origin);

export default function App() {
  const [gameState, setGameState] = useState(null);
  const [player, setPlayer] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [gameCode, setGameCode] = useState(null);

  useEffect(() => {
    socket.on("gameUpdate", (updatedGame) => {
      setGameState(updatedGame);
    });

    socket.on("gameStarted", (game) => {
      setGameState(game);
    });

    socket.on("gameEnded", (game) => {
      setGameState(game);
    });

    socket.on("error", (error) => {
      alert(error.message);
    });

    return () => {
      socket.off("gameUpdate");
      socket.off("gameStarted");
      socket.off("gameEnded");
      socket.off("error");
    };
  }, []);

  const joinGame = (playerName, playerPhoto, code, playerCount) => {
    setGameCode(code);
    setPlayer({ name: playerName, photo: playerPhoto });
    socket.emit("joinGame", {
      gameId: code,
      playerName,
      playerPhoto,
      playerCount,
    });
  };

  const handleDrawCard = () => {
    socket.emit("drawCard", { gameId: gameCode });
  };

  const renderGameState = () => {
    if (!gameState) {
      return (
        <div>
          <GameLobby onJoin={joinGame} />
          {gameCode && (
            <div className="fixed bottom-4 left-0 right-0 text-center">
              <div className="inline-block bg-white/20 backdrop-blur-md text-white px-6 py-2 rounded-full">
                Code de la partie :{" "}
                <span className="font-bold text-yellow-400">{gameCode}</span>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        {gameCode && (
          <div className="fixed top-4 left-0 right-0 text-center z-10">
            <div className="inline-block bg-white/20 backdrop-blur-md text-white px-6 py-2 rounded-full">
              Code de la partie :{" "}
              <span className="font-bold text-yellow-400">{gameCode}</span>
              {gameState.status === "waiting" && (
                <span className="ml-4">
                  {gameState.players.length}/{gameState.maxPlayers} joueurs
                </span>
              )}
            </div>
          </div>
        )}
        {gameState.status === "finished" ? (
          <GameOver
            gameState={gameState}
            playerId={socket.id}
            onPlayAgain={() => joinGame(player.name, player.photo, gameCode)}
          />
        ) : (
          <GameBoard
            gameState={gameState}
            playerId={socket.id}
            onRevealCard={(cardIndex) => {
              socket.emit("revealCard", { gameId: gameCode, cardIndex });
            }}
            onDrawCard={handleDrawCard}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900">
      {renderGameState()}
    </div>
  );
}
