import React from 'react';
import Card from './Card';

export default function PlayerGrid({ grid, canPlay, onCardClick }) {
  return (
    <div className="grid grid-cols-3 gap-2 mt-4">
      {grid.map((card, index) => (
        <Card
          key={index}
          value={card.value}
          isRevealed={card.revealed}
          onClick={() => canPlay && !card.revealed && onCardClick(index)}
          disabled={!canPlay || card.revealed}
        />
      ))}
    </div>
  );
}