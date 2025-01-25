import React from "react";
import { motion } from "framer-motion";

export default function Card({ value, isRevealed, onClick, disabled }) {
  const getCardColor = () => {
    if (!isRevealed)
      return "bg-gradient-to-br from-skyjo-secondary to-skyjo-primary";
    if (value < 0) return "bg-green-500/90";
    if (value === 0) return "bg-yellow-500/90";
    return "bg-red-500/90";
  };

  return (
    <motion.div
      initial={{ rotate: 0 }}
      whileHover={!disabled ? { y: -5, rotate: -2 } : {}}
      transition={{ type: "spring", stiffness: 300 }}
      className={`relative aspect-[2/3] rounded-xl overflow-hidden ${
        !disabled ? "cursor-pointer" : "cursor-default"
      }`}
      onClick={disabled ? undefined : onClick}
    >
      <div
        className={`absolute inset-0 ${getCardColor()} transition-colors duration-300`}
      >
        <div className="flex items-center justify-center h-full text-3xl font-bold text-white">
          {isRevealed ? value : "?"}
        </div>
      </div>

      {/* Effet de brillance */}
      <div className="absolute inset-0 opacity-20 hover:opacity-30 transition-opacity pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent w-1/2 h-1/2" />
      </div>
    </motion.div>
  );
}
