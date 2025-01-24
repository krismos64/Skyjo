export function createDeck() {
  const deck = [];
  
  // Create cards from -2 to 12
  for (let i = -2; i <= 12; i++) {
    // Each number appears multiple times
    const count = i === 0 ? 15 : 10;
    for (let j = 0; j < count; j++) {
      deck.push({ value: i });
    }
  }
  
  return deck;
}

export function shuffleDeck(deck) {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}