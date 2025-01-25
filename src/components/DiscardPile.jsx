import React from "react";

export default function DiscardPile({ topCard, onDraw, isCurrentTurn }) {
  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="text-white text-sm mb-2">Défausse</div>
      <div
        onClick={onDraw}
        className={`
          aspect-[2/3] w-24
          rounded-xl
          flex items-center justify-center
          text-2xl font-bold
          shadow-lg
          bg-gradient-to-br from-gray-400 to-gray-600
          text-white
          ${
            isCurrentTurn
              ? "cursor-pointer transform hover:scale-105"
              : "cursor-default"
          }
          transition-all duration-200
        `}
      >
        {topCard}
      </div>
      {isCurrentTurn && (
        <div className="text-white text-sm">Cliquez pour piocher</div>
      )}
    </div>
  );
}
