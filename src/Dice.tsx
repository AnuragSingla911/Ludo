import React from 'react';

interface DiceProps {
  value: number | null;
  onRoll: () => void;
}

const Dice: React.FC<DiceProps> = ({ value, onRoll }) => (
  <div>
    <button onClick={onRoll}>Roll</button>
    {value !== null && <span> {value}</span>}
  </div>
);

export default Dice;
