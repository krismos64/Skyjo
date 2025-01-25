import React from "react";
import PlayerGrid from "./PlayerGrid";
import PlayerInfo from "./PlayerInfo";
import DiscardPile from "./DiscardPile";

export default function GameBoard({
  gameState,
  playerId,
  onRevealCard,
  onDrawCard,
}) {
  // Vérification initiale de gameState
  if (!gameState) {
    return (
      <div className="min-h-screen p-4 pt-16 flex items-center justify-center text-white/80">
        Chargement de la partie...
      </div>
    );
  }

  // Utilisation de l'opérateur de chaînage optionnel partout
  const currentPlayer = gameState?.players?.find((p) => p.id === playerId);
  const isCurrentTurn =
    gameState?.players?.[gameState?.currentTurn]?.id === playerId;

  // Détermine le nombre de colonnes en fonction du nombre de joueurs
  const getGridColumns = () => {
    switch (gameState?.maxPlayers) {
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-3";
      case 4:
        return "grid-cols-2 md:grid-cols-2";
      default:
        return "grid-cols-2";
    }
  };

  const getCardSize = () => {
    const baseSize =
      gameState?.maxPlayers === 4
        ? "h-[calc(40vh-2rem)]"
        : "h-[calc(50vh-4rem)]";
    return `${baseSize} max-h-96`;
  };

  return (
    <div className="min-h-screen p-4 pt-16">
      {/* Plateau central avec la défausse */}
      <div className="flex justify-center items-center mb-4">
        <DiscardPile
          topCard={gameState?.discardPile?.[gameState.discardPile.length - 1]}
          onDraw={() => isCurrentTurn && onDrawCard()}
          isCurrentTurn={isCurrentTurn}
        />
      </div>

      {/* Grille des joueurs */}
      <div className={`grid ${getGridColumns()} gap-4 ${getCardSize()}`}>
        {gameState?.players?.map((player) => (
          <div
            key={player.id}
            className={`
              p-4 rounded-xl 
              ${player.id === playerId ? "bg-white/20" : "bg-white/10"} 
              backdrop-blur-md
              ${
                isCurrentTurn && player.id === playerId
                  ? "ring-2 ring-yellow-400"
                  : ""
              }
            `}
          >
            <PlayerInfo
              player={player}
              isCurrentTurn={
                gameState?.players?.[gameState?.currentTurn]?.id === player.id
              }
            />
            <PlayerGrid
              grid={player.grid}
              canPlay={isCurrentTurn && player.id === playerId}
              onCardClick={(index) => onRevealCard(index)}
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
