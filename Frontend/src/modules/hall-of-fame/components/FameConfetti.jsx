import React, { useEffect, useState } from "react";

export default function FameConfetti({ active }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!active) return;
    const colors = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];
    const nextPieces = Array.from({ length: 70 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      left: Math.random() * 100,
      size: Math.random() * 10 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      duration: Math.random() * 2 + 2,
    }));
    setPieces(nextPieces);
    const timer = setTimeout(() => setPieces([]), 5000);
    return () => clearTimeout(timer);
  }, [active]);

  if (!active) return null;

  return (
    <div className="confetti-container">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="sprinkle"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            top: "-20px",
          }}
        />
      ))}
    </div>
  );
}

