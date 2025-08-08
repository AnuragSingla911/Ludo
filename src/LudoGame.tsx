import React, { useState } from 'react';
import LudoBoard from './LudoBoard';
import Dice from './Dice';

interface Coord {
  x: number;
  y: number;
}

interface Token {
  player: number;
  position: number;
}

const colors = ['red', 'blue', 'green', 'yellow'];

const path: Coord[] = [
  { x: 1, y: 6 },
  { x: 2, y: 6 },
  { x: 3, y: 6 },
  { x: 4, y: 6 },
  { x: 5, y: 6 },
  { x: 5, y: 5 },
  { x: 5, y: 4 },
  { x: 5, y: 3 },
  { x: 5, y: 2 },
  { x: 5, y: 1 },
  { x: 5, y: 0 },
  { x: 6, y: 0 },
  { x: 7, y: 0 },
  { x: 7, y: 1 },
  { x: 7, y: 2 },
  { x: 7, y: 3 },
  { x: 7, y: 4 },
  { x: 7, y: 5 },
  { x: 8, y: 5 },
  { x: 9, y: 5 },
  { x: 10, y: 5 },
  { x: 11, y: 5 },
  { x: 12, y: 5 },
  { x: 13, y: 5 },
  { x: 13, y: 6 },
  { x: 13, y: 7 },
  { x: 12, y: 7 },
  { x: 11, y: 7 },
  { x: 10, y: 7 },
  { x: 9, y: 7 },
  { x: 8, y: 7 },
  { x: 8, y: 8 },
  { x: 8, y: 9 },
  { x: 8, y: 10 },
  { x: 8, y: 11 },
  { x: 8, y: 12 },
  { x: 8, y: 13 },
  { x: 7, y: 13 },
  { x: 7, y: 12 },
  { x: 7, y: 11 },
  { x: 7, y: 10 },
  { x: 7, y: 9 },
  { x: 7, y: 8 },
  { x: 6, y: 8 },
  { x: 5, y: 8 },
  { x: 4, y: 8 },
  { x: 3, y: 8 },
  { x: 2, y: 8 },
  { x: 1, y: 8 },
  { x: 0, y: 8 },
  { x: 0, y: 7 },
  { x: 0, y: 6 }
];

const initialTokens: Token[] = [
  { player: 0, position: 0 },
  { player: 1, position: 13 },
  { player: 2, position: 26 },
  { player: 3, position: 39 }
];

const LudoGame: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>(initialTokens);
  const [current, setCurrent] = useState(0);
  const [dice, setDice] = useState<number | null>(null);

  const rollDice = () => {
    const value = Math.floor(Math.random() * 6) + 1;
    setDice(value);
    setTokens(prev =>
      prev.map(t =>
        t.player === current
          ? { ...t, position: (t.position + value) % path.length }
          : t
      )
    );
    setCurrent(prev => (prev + 1) % colors.length);
  };

  return (
    <div>
      <LudoBoard path={path} tokens={tokens} />
      <div className="controls">
        <p>Current player: {colors[current]}</p>
        <Dice value={dice} onRoll={rollDice} />
      </div>
    </div>
  );
};

export default LudoGame;
