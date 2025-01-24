import React, { useState } from 'react';

export default function GameLobby({ onJoin }) {
  const [playerName, setPlayerName] = useState('');
  const [playerPhoto, setPlayerPhoto] = useState('');

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPlayerPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      onJoin(playerName, playerPhoto);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">
          Skyjo Online
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white mb-2">Votre nom</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Entrez votre nom"
              required
            />
          </div>

          <div>
            <label className="block text-white mb-2">Photo de profil</label>
            <div className="flex flex-col items-center space-y-4">
              {playerPhoto && (
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20">
                  <img 
                    src={playerPhoto} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer bg-gradient-to-r from-blue-400 to-indigo-400 text-white px-6 py-2 rounded-full hover:from-blue-500 hover:to-indigo-500 transition-all duration-200"
              >
                Choisir une photo
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-white py-3 rounded-full font-bold text-lg hover:from-emerald-500 hover:to-cyan-500 transition-all duration-200"
          >
            Rejoindre une partie
          </button>
        </form>
      </div>
    </div>
  );
}