import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { io } from "socket.io-client";

const socket = io({
  path: "/socket.io",
  transports: ["websocket"],
  autoConnect: true,
});

export default function GameLobby({ onJoin, currentCode, error, roomState }) {
  const [playerName, setPlayerName] = useState("");
  const [playerPhoto, setPlayerPhoto] = useState("");
  const [roomCode, setRoomCode] = useState(currentCode || "");
  const [isCreating, setIsCreating] = useState(true);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [isNameValid, setIsNameValid] = useState(false); // Nouvel état pour la validation

  useEffect(() => {
    const handleCreatedRoom = (newCode) => {
      setRoomCode(newCode);
      onJoin(""); // Réinitialise les erreurs
    };

    socket.on("roomCreated", handleCreatedRoom);
    socket.on("error", (err) => {
      onJoin(err.message);
      setTimeout(() => onJoin(""), 5000);
    });

    // Reconnexion automatique
    if (!socket.connected) socket.connect();

    return () => {
      socket.off("roomCreated");
      socket.off("error");
    };
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPlayerPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  // Fonction pour valider le nom
  const validateName = () => {
    const trimmedName = playerName?.trim();
    if (!trimmedName || trimmedName.length < 2) {
      onJoin("Le nom doit contenir au moins 2 caractères");
      setIsNameValid(false);
    } else {
      onJoin(""); // Réinitialise les erreurs
      setIsNameValid(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Vérifie si le nom est valide avant de soumettre
    if (!isNameValid) {
      return onJoin("Veuillez valider votre nom avant de continuer");
    }

    if (!socket.connected) {
      socket.connect();
      setTimeout(() => handleSubmit(e), 300);
      return;
    }

    const trimmedName = playerName.trim();
    if (isCreating) {
      socket.emit("createRoom", {
        playerName: trimmedName,
        playerPhoto,
        maxPlayers,
      });
    } else {
      if (!roomCode || roomCode.length !== 6) {
        return onJoin("Code de partie invalide (6 caractères requis)");
      }
      socket.emit("joinRoom", {
        roomCode: roomCode.toUpperCase(),
        playerName: trimmedName,
        playerPhoto,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-xl"
      >
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
          Skyjo Online
        </h1>

        {error && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-6 border border-red-500/30"
          >
            ⚠️ {error}
          </motion.div>
        )}

        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className={`flex-1 py-3 rounded-xl transition-all ${
              isCreating
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            Nouvelle Partie
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className={`flex-1 py-3 rounded-xl transition-all ${
              !isCreating
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            Rejoindre
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white/80 mb-2">Votre pseudo</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value.trimStart());
                  setIsNameValid(false); // Réinitialise la validation si le nom change
                }}
                className="w-full px-4 py-3 bg-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Ex: SkyjoMaster"
                maxLength={20}
                required
              />
              <button
                type="button"
                onClick={validateName}
                className="px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all"
              >
                Valider
              </button>
            </div>
          </div>

          {isCreating && (
            <div className="bg-white/5 p-4 rounded-xl">
              <label className="block text-white/80 mb-3">
                Nombre de joueurs
              </label>
              <div className="flex gap-3">
                {[2, 3, 4].map((count) => (
                  <motion.button
                    key={count}
                    type="button"
                    onClick={() => setMaxPlayers(count)}
                    whileHover={{ scale: 1.05 }}
                    className={`flex-1 py-2 rounded-lg ${
                      maxPlayers === count
                        ? "bg-blue-500 text-white"
                        : "bg-white/10 text-white/60 hover:bg-white/20"
                    }`}
                  >
                    {count}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {!isCreating && (
            <div>
              <label className="block text-white/80 mb-2">
                Code de la partie
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase tracking-widest"
                placeholder="ABCDEF"
                maxLength={6}
              />
            </div>
          )}

          <div>
            <label className="block text-white/80 mb-3">Photo de profil</label>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/20">
                {playerPhoto ? (
                  <img
                    src={playerPhoto}
                    alt="Profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center">
                    <span className="text-white/50">👤</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <span className="text-white/60 text-sm">
                {playerPhoto ? "Photo sélectionnée" : "Cliquez pour ajouter"}
              </span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl font-bold text-lg transition-all"
          >
            {isCreating ? "🚀 Créer la partie" : "🎮 Rejoindre maintenant"}
          </motion.button>
        </form>

        {roomCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center"
          >
            <div className="text-white/80 mb-2">Code de votre table :</div>
            <div className="text-3xl font-mono text-emerald-400 bg-black/30 p-4 rounded-lg">
              {roomCode}
            </div>
            <p className="text-sm mt-4 text-white/60">
              En attente de {(roomState?.maxPlayers || 2) - 1} joueur(s)...
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
