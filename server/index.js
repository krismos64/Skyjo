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
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const gameRooms = new Map();

// Générer un code de partie unique
const generateRoomCode = () => {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += characters[Math.floor(Math.random() * characters.length)];
  }
  return code;
};

io.on("connection", (socket) => {
  console.log("Nouvelle connexion:", socket.id);

  socket.on("createRoom", ({ playerName, playerPhoto, maxPlayers }) => {
    const roomCode = generateRoomCode();
    const newRoom = {
      code: roomCode,
      players: [],
      maxPlayers: Math.min(Math.max(parseInt(maxPlayers), 2), 4),
      status: "waiting",
      deck: [],
      discardPile: [],
      currentTurn: 0,
    };

    gameRooms.set(roomCode, newRoom);

    // Envoyer immédiatement le code au créateur
    socket.emit("roomCreated", roomCode);

    // Ajouter le joueur à la room
    joinRoom(socket, roomCode, playerName, playerPhoto);
  });

  socket.on("joinRoom", ({ roomCode, playerName, playerPhoto }) => {
    const formattedCode = roomCode.toUpperCase();
    const room = gameRooms.get(formattedCode);

    if (!room) {
      socket.emit("error", { message: "Code de partie invalide" });
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      socket.emit("error", { message: "La partie est complète" });
      return;
    }

    joinRoom(socket, formattedCode, playerName, playerPhoto);
  });

  socket.on("revealCard", ({ roomCode, cardIndex }) => {
    const room = gameRooms.get(roomCode);
    if (!room || room.status !== "playing") return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player || room.players[room.currentTurn] !== player) return;

    const card = player.grid[cardIndex];
    if (!card || card.revealed) return;

    card.revealed = true;
    player.score = calculateScore(player.grid);

    // Passer au joueur suivant
    room.currentTurn = (room.currentTurn + 1) % room.players.length;

    checkGameStatus(room);
    io.to(roomCode).emit("gameUpdate", room);
  });

  socket.on("disconnect", () => {
    gameRooms.forEach((room, code) => {
      room.players = room.players.filter((p) => p.id !== socket.id);

      if (room.players.length === 0) {
        gameRooms.delete(code);
      } else {
        if (room.status === "playing") {
          room.currentTurn %= room.players.length;
        }
        io.to(code).emit("gameUpdate", room);
      }
    });
  });
});

function joinRoom(socket, roomCode, playerName, playerPhoto) {
  const room = gameRooms.get(roomCode);
  const player = {
    id: socket.id,
    name: playerName,
    photo: playerPhoto,
    grid: [],
    score: 0,
    ready: false,
  };

  room.players.push(player);
  socket.join(roomCode);

  // Notifier tout le monde de la mise à jour
  io.to(roomCode).emit("roomUpdate", room);

  // Démarrer la partie si le nombre est atteint
  if (room.players.length === room.maxPlayers) {
    startGame(room);
  }
  io.to(roomCode).emit("roomUpdate", room);
}

function startGame(room) {
  room.deck = shuffleDeck(createDeck());
  room.status = "playing";
  room.currentTurn = Math.floor(Math.random() * room.players.length);

  // Distribuer les cartes
  room.players.forEach((player) => {
    player.grid = room.deck.splice(0, 12).map((card) => ({
      ...card,
      revealed: false,
    }));
  });

  room.discardPile = [room.deck.pop()];
  io.to(room.code).emit("gameStart", room);
}

function checkGameStatus(room) {
  const gameOver = room.players.some((player) =>
    player.grid.every((card) => card.revealed)
  );

  if (gameOver) {
    room.status = "finished";
    io.to(room.code).emit("gameEnd", room);
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
