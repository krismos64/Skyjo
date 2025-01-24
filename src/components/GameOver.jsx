import React from 'react';

export default function GameOver({ gameState, playerId, onPlayAgain }) {
  const sortedPlayers = [...gameState.players].sort((a, b) => a.score - b.score);
  const winner = sortedPlayers[0];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6 text-white">
          Partie terminée !
        </h2>

        <div className="space-y-6">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-yellow-400">
              <img 
                src={winner.photo} 
                alt={winner.name}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="mt-4 text-xl font-bold text-yellow-400">
              {winner.name} gagne !
            </p>
          </div>

          <div className="space-y-4">
            {sortedPlayers.map((player, index) => (
              <div 
                key={player.id}
                className={`
                  flex items-center justify-between p-4 rounded-lg
                  ${player.id === playerId ? 'bg-white/20' : 'bg-white/10'}
                `}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-white font-bold">{index + 1}.</span>
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <img 
                      src={player.photo}
                      alt={player.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-white">{player.name}</span>
                </div>
                <span className="text-white font-bold">{player.score} pts</span>
              </div>
            ))}
          </div>

          <button
            onClick={onPlayAgain}
            className="w-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-white py-3 rounded-full font-bold text-lg hover:from-emerald-500 hover:to-cyan-500 transition-all duration-200"
          >
            Rejouer
          </button>
        </div>
      </div>
    </div>
  );
}