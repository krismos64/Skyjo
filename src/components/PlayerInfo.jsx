import React from 'react';

export default function PlayerInfo({ player, isCurrentTurn }) {
  return (
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
        {player.photo ? (
          <img 
            src={player.photo} 
            alt={player.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600" />
        )}
      </div>
      <div>
        <h3 className="text-white font-bold">{player.name}</h3>
        {isCurrentTurn && (
          <span className="text-yellow-400 text-sm">En train de jouer</span>
        )}
      </div>
    </div>
  );
}