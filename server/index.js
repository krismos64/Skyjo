import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.static(join(__dirname, '../dist')));

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// État du jeu
const games = new Map();
const players = new Map();

// Routes
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'));
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('Un joueur s\'est connecté');

  socket.on('joinGame', ({ gameId, playerName, playerPhoto }) => {
    let game = games.get(gameId);
    
    if (!game) {
      game = createGame(gameId);
      games.set(gameId, game);
    }

    if (game.players.length >= game.maxPlayers) {
      socket.emit('error', { message: 'La partie est complète' });
      return;
    }

    const player = {
      id: socket.id,
      name: playerName,
      photo: playerPhoto,
      grid: [],
      score: 0
    };

    game.players.push(player);
    players.set(socket.id, gameId);
    socket.join(gameId);

    if (game.players.length === game.maxPlayers) {
      startGame(game);
    }

    io.to(gameId).emit('gameUpdate', game);
  });

  socket.on('revealCard', ({ gameId, cardIndex }) => {
    const game = games.get(gameId);
    if (!game) return;

    const playerIndex = game.players.findIndex(p => p.id === socket.id);
    if (playerIndex === -1 || playerIndex !== game.currentTurn) return;

    const player = game.players[playerIndex];
    const card = player.grid[cardIndex];
    
    if (!card || card.revealed) return;

    card.revealed = true;
    player.score = calculateScore(player.grid);

    // Passe au joueur suivant
    game.currentTurn = (game.currentTurn + 1) % game.players.length;

    // Vérifie si la partie est terminée
    if (isGameOver(player.grid)) {
      game.status = 'finished';
    }

    io.to(gameId).emit('gameUpdate', game);
  });

  socket.on('disconnect', () => {
    const gameId = players.get(socket.id);
    if (gameId) {
      const game = games.get(gameId);
      if (game) {
        game.players = game.players.filter(p => p.id !== socket.id);
        if (game.players.length === 0) {
          games.delete(gameId);
        } else {
          io.to(gameId).emit('gameUpdate', game);
        }
      }
      players.delete(socket.id);
    }
  });
});

function calculateScore(grid) {
  return grid.reduce((total, card) => total + (card.revealed ? card.value : 0), 0);
}

function isGameOver(grid) {
  return grid.every(card => card.revealed);
}

// Game logic functions
function createGame(gameId) {
  return {
    id: gameId,
    players: [],
    deck: createDeck(),
    discardPile: [],
    currentTurn: 0,
    status: 'waiting',
    maxPlayers: 4
  };
}

function createDeck() {
  const deck = [];
  const cardCounts = {
    '-2': 5, '-1': 10, '0': 15,
    '1': 10, '2': 10, '3': 10,
    '4': 10, '5': 10, '6': 10,
    '7': 10, '8': 10, '9': 10,
    '10': 10, '11': 10, '12': 10
  };

  Object.entries(cardCounts).forEach(([value, count]) => {
    for (let i = 0; i < count; i++) {
      deck.push(parseInt(value));
    }
  });

  return shuffle(deck);
}

function shuffle(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function startGame(game) {
  game.status = 'playing';
  game.players.forEach(player => {
    player.grid = game.deck.splice(0, 12).map(value => ({
      value,
      revealed: false
    }));
  });
  game.discardPile = [game.deck.pop()];
  io.to(game.id).emit('gameStarted', game);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});