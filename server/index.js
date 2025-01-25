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

const generateRoomCode = () => {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => characters[Math.floor(Math.random() * characters.length)]
  ).join("");
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
    joinRoom(socket, roomCode, playerName, playerPhoto); // Créateur ajouté ici
  });

  socket.on("joinRoom", ({ roomCode, playerName, playerPhoto }) => {
    const formattedCode = roomCode.toUpperCase().trim();
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
    room.currentTurn = (room.currentTurn + 1) % room.players.length;

    checkGameStatus(room);
    io.to(roomCode).emit("gameUpdate", room);
  });

  socket.on("disconnect", () => {
    gameRooms.forEach((room, code) => {
      room.players = room.players.filter((p) => p.id !== socket.id);
      if (room.players.length === 0) gameRooms.delete(code);
      else io.to(code).emit("gameUpdate", room);
    });
  });
});

function joinRoom(socket, roomCode, playerName, playerPhoto) {
  const room = gameRooms.get(roomCode);
  if (!room) return;

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
  io.to(roomCode).emit("roomUpdate", room);

  if (room.players.length === room.maxPlayers) {
    setTimeout(() => startGame(room), 500);
  }
}

function startGame(room) {
  room.deck = shuffleDeck(createDeck());
  room.status = "playing";
  room.currentTurn = Math.floor(Math.random() * room.players.length);

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
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});
