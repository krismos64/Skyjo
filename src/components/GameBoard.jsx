import React from 'react';
import PlayerGrid from './PlayerGrid';
import PlayerInfo from './PlayerInfo';

export default function GameBoard({ gameState, playerId, onRevealCard }) {
  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const isCurrentTurn = gameState.players[gameState.currentTurn].id === playerId;

  return (
    <div className="min-h-screen p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gameState.players.map((player) => (
          <div key={player.id} className={`
            p-4 rounded-xl 
            ${player.id === playerId ? 'bg-white/20' : 'bg-white/10'} 
            backdrop-blur-md
            ${isCurrentTurn && player.id === playerId ? 'ring-2 ring-yellow-400' : ''}
          `}>
            <PlayerInfo player={player} isCurrentTurn={gameState.players[gameState.currentTurn].id === player.id} />
            <PlayerGrid 
              grid={player.grid}
              canPlay={isCurrentTurn && player.id === playerId}
              onCardClick={onRevealCard}
            />
          </div>
        ))}
      </div>

      {isCurrentTurn && (
        <div className="fixed bottom-4 left-0 right-0 text-center">
          <div className="inline-block bg-yellow-400 text-black px-6 py-2 rounded-full font-bold">
            C'est votre tour !
          </div>
        </div>
      )}
    </div>
  );
}