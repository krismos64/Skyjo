export const CARD_DISTRIBUTION = {
  [-2]: 12,
  [-1]: 12,
  0: 16,
  1: 10,
  2: 10,
  3: 10,
  4: 10,
  5: 10,
  6: 10,
  7: 10,
  8: 10,
  9: 10,
  10: 10,
  11: 10,
  12: 10,
};

export function createDeck() {
  return Object.entries(CARD_DISTRIBUTION).flatMap(([value, count]) =>
    Array(count).fill({ value: parseInt(value) })
  );
}

export function shuffleDeck(deck) {
  return deck
    .map((card) => ({ card, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ card }) => card);
}

export function calculateScore(grid) {
  return grid.reduce(
    (total, { value, revealed }) => total + (revealed ? value : 0),
    0
  );
}
