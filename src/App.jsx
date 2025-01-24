import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import GameLobby from './components/GameLobby';
import GameBoard from './components/GameBoard';
import GameOver from './components/GameOver';

const socket = io('http://localhost:3000');

export default function App() {
  const [gameState, setGameState] = useState(null);
  const [player, setPlayer] = useState(null);
  const [gameId, setGameId] = useState(null);

  useEffect(() => {
    socket.on('gameUpdate', (updatedGame) => {
      setGameState(updatedGame);
    });

    socket.on('gameStarted', (game) => {
      setGameState(game);
    });

    socket.on('gameEnded', (game) => {
      setGameState(game);
    });

    socket.on('error', (error) => {
      alert(error.message);
    });

    return () => {
      socket.off('gameUpdate');
      socket.off('gameStarted');
      socket.off('gameEnded');
      socket.off('error');
    };
  }, []);

  const joinGame = (playerName, playerPhoto) => {
    const newGameId = Math.random().toString(36).substring(7);
    setGameId(newGameId);
    setPlayer({ name: playerName, photo: playerPhoto });
    socket.emit('joinGame', { 
      gameId: newGameId, 
      playerName, 
      playerPhoto 
    });
  };

  const renderGameState = () => {
    if (!gameState) {
      return <GameLobby onJoin={joinGame} />;
    }

    if (gameState.status === 'finished') {
      return <GameOver 
        gameState={gameState} 
        playerId={socket.id}
        onPlayAgain={() => joinGame(player.name, player.photo)}
      />;
    }

    return <GameBoard 
      gameState={gameState}
      playerId={socket.id}
      onRevealCard={(cardIndex) => {
        socket.emit('revealCard', { gameId, cardIndex });
      }}
    />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900">
      {renderGameState()}
    </div>
  );
}