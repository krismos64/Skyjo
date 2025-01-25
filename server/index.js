import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import cors from "cors";
import { createDeck, shuffleDeck, calculateScore } from "./gameLogic.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.static(join(__dirname, "../dist")));

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// État du jeu
const games = new Map();
const players = new Map();

// Routes
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "../dist/index.html"));
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Socket.IO logic
io.on("connection", (socket) => {
  console.log("Un joueur s'est connecté");

  socket.on("joinGame", ({ gameId, playerName, playerPhoto, playerCount }) => {
    let game = games.get(gameId);

    if (!game) {
      // Validation du nombre de joueurs
      const maxPlayers = Math.min(Math.max(Number(playerCount), 2), 4); // Forcer entre 2 et 4
      game = createGame(gameId, maxPlayers);
      games.set(gameId, game);
    }

    if (game.players.length >= game.maxPlayers) {
      socket.emit("error", { message: "La partie est complète" });
      return;
    }

    const player = {
      id: socket.id,
      name: playerName,
      photo: playerPhoto,
      grid: [],
      score: 0,
    };

    game.players.push(player);
    players.set(socket.id, gameId);
    socket.join(gameId);

    // Démarrage quand le nombre exact est atteint
    if (game.players.length === game.maxPlayers) {
      startGame(game);
    }
  });

  io.to(gameId).emit("gameUpdate", game);
});

socket.on("revealCard", ({ gameId, cardIndex }) => {
  const game = games.get(gameId);
  if (!game || game.status !== "playing") return;

  const playerIndex = game.players.findIndex((p) => p.id === socket.id);
  if (playerIndex === -1 || playerIndex !== game.currentTurn) return;

  const player = game.players[playerIndex];
  const card = player.grid[cardIndex];

  if (!card || card.revealed) return;

  // Révéler la carte
  card.revealed = true;
  player.score = calculateScore(player.grid);

  // Passer au joueur suivant
  game.currentTurn = (game.currentTurn + 1) % game.players.length;

  // Vérifier si la partie est terminée
  if (isGameOver(game)) {
    game.status = "finished";
    io.to(gameId).emit("gameEnded", game);
  } else {
    io.to(gameId).emit("gameUpdate", game);
  }
});
socket.on("replaceCard", ({ gameId, cardIndex }) => {
  const game = games.get(gameId);
  const player = game.players.find((p) => p.id === socket.id);

  // Remplacer la carte dans la grille
  player.grid[cardIndex] = {
    value: player.drawnCard,
    revealed: true,
  };

  // Passer au joueur suivant
  game.currentTurn = (game.currentTurn + 1) % game.players.length;
  io.to(gameId).emit("gameUpdate", game);
});

socket.on("drawCard", ({ gameId }) => {
  const game = games.get(gameId);
  if (!game || game.status !== "playing") return;

  const playerIndex = game.players.findIndex((p) => p.id === socket.id);
  if (playerIndex === -1 || playerIndex !== game.currentTurn) return;

  // Piocher une carte de la défausse
  const drawnCard = game.discardPile.pop();

  // Ajouter une nouvelle carte à la défausse
  if (game.deck.length > 0) {
    game.discardPile.push(game.deck.pop());
  }

  // Mettre à jour le jeu du joueur
  const player = game.players[playerIndex];
  player.drawnCard = drawnCard;

  // Passer au joueur suivant
  game.currentTurn = (game.currentTurn + 1) % game.players.length;

  io.to(gameId).emit("gameUpdate", game);
});

socket.on("disconnect", () => {
  const gameId = players.get(socket.id);
  if (gameId) {
    const game = games.get(gameId);
    if (game) {
      game.players = game.players.filter((p) => p.id !== socket.id);
      if (game.players.length === 0) {
        games.delete(gameId);
      } else {
        // Si le joueur qui se déconnecte était en train de jouer
        if (
          game.status === "playing" &&
          game.players[game.currentTurn].id === socket.id
        ) {
          game.currentTurn = game.currentTurn % game.players.length;
        }
        io.to(gameId).emit("gameUpdate", game);
      }
    }
    players.delete(socket.id);
  }
});

function calculateScore(grid) {
  return grid.reduce(
    (total, card) => total + (card.revealed ? card.value : 0),
    0
  );
}

function isGameOver(game) {
  return game.players.some((player) =>
    player.grid.every((card) => card.revealed)
  );
}

function createGame(gameId, playerCount = 2) {
  return {
    id: gameId,
    players: [],
    deck: createDeck(),
    discardPile: [],
    currentTurn: 0,
    status: "waiting",
    maxPlayers: Math.min(Math.max(playerCount, 2), 4), // Double validation
  };
}

function createDeck() {
  const deck = [];
  const cardCounts = {
    "-2": 5,
    "-1": 10,
    0: 15,
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
  game.deck = shuffleDeck(createDeck());
  game.status = "playing";
  game.currentTurn = Math.floor(Math.random() * game.players.length);

  game.players.forEach((player) => {
    player.grid = game.deck.splice(0, 12).map((card) => ({
      ...card,
      revealed: false,
    }));
  });
  game.discardPile = [game.deck.pop()];
  io.to(game.id).emit("gameStarted", game);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
