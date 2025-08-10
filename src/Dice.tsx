import React, { useEffect, useRef, useState } from 'react';

interface DiceProps {
  value: number | null;
  onRoll: () => void;
  disabled?: boolean;
}

const Dice: React.FC<DiceProps> = ({ value, onRoll, disabled = false }) => {
  const [displayValue, setDisplayValue] = useState<number>(value ?? 1);
  const [isRolling, setIsRolling] = useState(false);
  const rollIntervalRef = useRef<number | null>(null);
  const safetyStopRef = useRef<number | null>(null);

  // When external value updates (final roll), stop animation and show it
  useEffect(() => {
    if (value !== null) {
      setDisplayValue(value);
      if (rollIntervalRef.current) {
        window.clearInterval(rollIntervalRef.current);
        rollIntervalRef.current = null;
      }
      if (safetyStopRef.current) {
        window.clearTimeout(safetyStopRef.current);
        safetyStopRef.current = null;
      }
      setIsRolling(false);
    }
  }, [value]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) window.clearInterval(rollIntervalRef.current);
      if (safetyStopRef.current) window.clearTimeout(safetyStopRef.current);
    };
  }, []);

  const handleRoll = () => {
    if (disabled || isRolling) return;

    setIsRolling(true);
    // Pre-roll animation for a brief moment
    rollIntervalRef.current = window.setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
    }, 75);

    // Trigger the real roll after a small delay so animation is visible
    window.setTimeout(() => {
      onRoll();
    }, 450);

    // Safety stop: if parent fails to deliver a value for any reason, stop animation
    safetyStopRef.current = window.setTimeout(() => {
      if (rollIntervalRef.current) {
        window.clearInterval(rollIntervalRef.current);
        rollIntervalRef.current = null;
      }
      setIsRolling(false);
    }, 1500);
  };

  return (
    <div className="dice-container">
      <div className={`dice-face ${isRolling ? 'rolling' : ''}`} onClick={handleRoll}>
        <span className="dice-number">{displayValue}</span>
      </div>
      <button 
        className={`dice-button ${disabled ? 'disabled' : ''}`} 
        onClick={handleRoll}
        disabled={disabled || isRolling}
      >
        {disabled ? 'Choose Token' : isRolling ? 'Rolling…' : 'Roll Dice'}
      </button>
      {value !== null && <span className="dice-result">🎲 {value}</span>}
    </div>
  );
};

export default Dice;
