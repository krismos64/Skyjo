import React from 'react';

export default function Card({ value, isRevealed, onClick, disabled }) {
  const getCardColor = () => {
    if (!isRevealed) return 'from-blue-500 to-blue-600';
    if (value < 0) return 'from-green-400 to-green-500';
    if (value === 0) return 'from-yellow-400 to-yellow-500';
    return 'from-red-400 to-red-500';
  };

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`
        aspect-[2/3] rounded-xl
        ${!disabled ? 'cursor-pointer transform hover:scale-105' : 'cursor-default'}
        transition-all duration-200
        flex items-center justify-center text-2xl font-bold
        shadow-lg hover:shadow-xl
        bg-gradient-to-br ${getCardColor()}
        text-white
        ${isRevealed ? 'card-flip' : ''}
      `}
    >
      <div className="transform">
        {isRevealed ? value : '?'}
      </div>
    </div>
  );
}