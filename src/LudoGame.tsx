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

// Generate 52-cell outer loop following the specification
// Path runs only on neutral lanes: row 6 (top), col 8 (right), row 8 (bottom), col 6 (left)
const generateOuterLoop = (): Coord[] => {
  const isLoopCell = (x: number, y: number): boolean => {
    // x = column, y = row
    const onOuterLanes = ((y === 6 || y === 8) && x !== 7) || ((x === 6 || x === 8) && y !== 7);
    // Allow four connector cells so the loop is contiguous
    const isConnector = (x === 7 && (y === 6 || y === 8)) || (y === 7 && (x === 6 || x === 8));
    // Exclude the center
    const isCenter = x === 7 && y === 7;
    return (onOuterLanes || isConnector) && !isCenter;
  };

  const start: Coord = { x: 1, y: 6 }; // Red start tile (6,1) in (row,col) = (1,6) in (x,y)
  // Directions as [dx, dy]: Right, Down, Left, Up (x is column, y is row)
  const dirs: Array<[number, number]> = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  let dir = 0; // Start moving right on row 6
  let cur = start;
  const outerLoop = [cur];

  // Safety to avoid infinite loops in case of a logic error
  const maxSteps = 200;
  let steps = 0;
  while (steps < maxSteps) {
    // Try moving forward; if invalid, rotate clockwise until a valid loop cell is found
    let attempts = 0;
    let ndir = dir;
    let next: Coord = { x: cur.x, y: cur.y };
    while (attempts < 4) {
      const [dx, dy] = dirs[ndir];
      const candidate = { x: cur.x + dx, y: cur.y + dy };
      if (isLoopCell(candidate.x, candidate.y)) {
        next = candidate;
        break;
      }
      ndir = (ndir + 1) % 4;
      attempts++;
    }

    // If we returned to start, stop
    if (next.x === start.x && next.y === start.y) break;

    outerLoop.push(next);
    cur = next;
    dir = ndir;
    steps++;
  }

  return outerLoop;
};

// Generate the correct 52-square outer path
const path: Coord[] = generateOuterLoop();

// Ensure path is unique and ordered without duplicates (defensive)
const uniquePath = path.filter((p, idx, arr) => idx === arr.findIndex(q => q.x === p.x && q.y === p.y));
if (uniquePath.length !== path.length) {
  console.warn(`Deduped path: ${path.length} -> ${uniquePath.length}`);
}
// Use the unique path going forward and rotate so Red start is index 0
let loop: Coord[] = uniquePath;
const redStartIdx = loop.findIndex(p => p.x === 1 && p.y === 6);
if (redStartIdx > 0) {
  loop = [...loop.slice(redStartIdx), ...loop.slice(0, redStartIdx)];
}
// Precompute start indices within the path for each player
const startingPositions: Coord[] = [
  { x: 1, y: 6 }, // Red start: (6,1) -> (1,6)
  { x: 8, y: 1 }, // Blue start: (1,8) -> (8,1)
  { x: 13, y: 8 }, // Green start: (8,13) -> (13,8)
  { x: 6, y: 13 } // Yellow start: (13,6) -> (6,13)
];
const startIndices = startingPositions.map((coord, i) => {
  const idx = loop.findIndex(p => p.x === coord.x && p.y === coord.y);
  if (idx === -1) console.error(`Start index for player ${i} not found in path for coord (${coord.x},${coord.y})`);
  return idx;
});

// Validation: Ensure path is correct
if (loop.length !== 52) {
  console.error(`Path length is ${loop.length}, expected 52`);
}

// Validate no path cells are in colored yards
const validatePath = () => {
  const violations: string[] = [];
  loop.forEach((coord, index) => {
    const { x, y } = coord;
    // Check if in any colored yard
    if ((x >= 0 && x <= 5 && y >= 0 && y <= 5) || // Red yard
        (x >= 9 && x <= 14 && y >= 0 && y <= 5) || // Blue yard
        (x >= 9 && x <= 14 && y >= 9 && y <= 14) || // Green yard
        (x >= 0 && x <= 5 && y >= 9 && y <= 14)) { // Yellow yard
      violations.push(`Path cell ${index} at (${x},${y}) is in a colored yard`);
    }
  });
  if (violations.length > 0) {
    console.error('Path validation failed:', violations);
  } else {
    console.log('✅ Path validation passed - no cells in colored yards');
  }
};
validatePath();

// Home run paths for each player (5-cell colored paths leading to center)
// Following spec: Red r=7,c∈[1..5], Blue c=7,r∈[1..5], Green r=7,c∈[9..13], Yellow c=7,r∈[9..13]
const homeRunPaths = {
  0: [{ x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 5, y: 7 }], // Red: r=7, c∈[1..5]
  1: [{ x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 }, { x: 7, y: 4 }, { x: 7, y: 5 }], // Blue: c=7, r∈[1..5]
  2: [{ x: 9, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 }, { x: 12, y: 7 }, { x: 13, y: 7 }], // Green: r=7, c∈[9..13]
  3: [{ x: 7, y: 9 }, { x: 7, y: 10 }, { x: 7, y: 11 }, { x: 7, y: 12 }, { x: 7, y: 13 }]  // Yellow: c=7, r∈[9..13]
};

// Home positions for each player (6x6 yards in each quadrant)
const homePositions = {
  0: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }], // Red yard: r∈[0..5], c∈[0..5]
  1: [{ x: 10, y: 1 }, { x: 11, y: 1 }, { x: 10, y: 2 }, { x: 11, y: 2 }], // Blue yard: r∈[0..5], c∈[9..14]
  2: [{ x: 10, y: 10 }, { x: 11, y: 10 }, { x: 10, y: 11 }, { x: 11, y: 11 }], // Green yard: r∈[9..14], c∈[9..14]
  3: [{ x: 1, y: 10 }, { x: 2, y: 10 }, { x: 1, y: 11 }, { x: 2, y: 11 }] // Yellow yard: r∈[9..14], c∈[0..5]
};

// startingPositions moved above and precomputed indices

// Entry squares from outer loop to home rows
// Red: (6,6)->(7,6), Blue: (6,8)->(6,7), Green: (8,8)->(7,8), Yellow: (8,6)->(8,7)
const entrySquares: Coord[] = [
  { x: 6, y: 6 }, // Red entry: (6,6) -> (6,6)
  { x: 6, y: 8 }, // Blue entry: (6,8) -> (6,8) 
  { x: 8, y: 8 }, // Green entry: (8,8) -> (8,8)
  { x: 8, y: 6 } // Yellow entry: (8,6) -> (8,6)
];

// Each player has 4 tokens, starting at home (position -1 means at home)
const initialTokens: Token[] = [
  // Red player tokens (all start at home)
  { player: 0, position: -1 }, { player: 0, position: -1 }, { player: 0, position: -1 }, { player: 0, position: -1 },
  // Blue player tokens
  { player: 1, position: -1 }, { player: 1, position: -1 }, { player: 1, position: -1 }, { player: 1, position: -1 },
  // Green player tokens
  { player: 2, position: -1 }, { player: 2, position: -1 }, { player: 2, position: -1 }, { player: 2, position: -1 },
  // Yellow player tokens
  { player: 3, position: -1 }, { player: 3, position: -1 }, { player: 3, position: -1 }, { player: 3, position: -1 }
];

const LudoGame: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>(initialTokens);
  const [current, setCurrent] = useState(0);
  const [dice, setDice] = useState<number | null>(null);
  const [canMove, setCanMove] = useState(false);
  const [movableTokens, setMovableTokens] = useState<number[]>([]);
  const [sixCount, setSixCount] = useState(0); // Track consecutive sixes

  const rollDice = () => {
    const value = Math.floor(Math.random() * 6) + 1;
    setDice(value);
    
    // Handle triple six rule
    if (value === 6) {
      const newSixCount = sixCount + 1;
      setSixCount(newSixCount);
      
      // If rolled 6 three times in a row, end turn
      if (newSixCount >= 3) {
        setSixCount(0);
        setCurrent(prev => (prev + 1) % colors.length);
        setTimeout(() => {
          setDice(null);
          setCanMove(false);
        }, 2000);
        return;
      }
    } else {
      setSixCount(0); // Reset six count if didn't roll 6
    }
    
    // Find which tokens can move
    const playerTokens = tokens.filter(t => t.player === current);
    const movable: number[] = [];
    
    playerTokens.forEach((token, index) => {
      const tokenIndex = tokens.findIndex(t => t === token);
      
      // Can move from home if rolled 6
      if (token.position === -1 && value === 6) {
        // Only allow spawning if the start square is free of same-color stacks blocking rules, or allow stacking per spec
        const startIdx = startIndices[current];
        const occupiedByOwn = tokens.some(t => t.position === startIdx && t.player === current);
        // If you want to allow stacking (2+), change this check accordingly; for now allow stacking
        if (true || !occupiedByOwn) {
          movable.push(tokenIndex);
        }
      }
      // Can move if on path
      else if (token.position >= 0) {
        const homeRunPath = homeRunPaths[current as keyof typeof homeRunPaths];
        const startCoord = startingPositions[current];
        const startIndex = loop.findIndex(p => p.x === startCoord.x && p.y === startCoord.y);
        
        // Check if token is already in home run
        if (token.position >= 100 + current * 10) {
          const currentHomeRunPos = token.position - (100 + current * 10);
          const newHomeRunPos = currentHomeRunPos + value;
          // Must land exactly on center (exact landing rule)
          if (newHomeRunPos < homeRunPath.length || newHomeRunPos === homeRunPath.length) {
            movable.push(tokenIndex);
          }
        }
        // Token is on main path
        else {
          // Calculate distance traveled from start
          let distanceTraveled = 0;
          if (token.position >= startIndex) {
            distanceTraveled = token.position - startIndex;
          } else {
            distanceTraveled = (loop.length - startIndex) + token.position;
          }
          
          const newDistance = distanceTraveled + value;
          
          // Check if can enter home column after completing circuit
          if (newDistance >= loop.length) {
            const homeRunPos = newDistance - loop.length;
            if (homeRunPos <= homeRunPath.length) {
              movable.push(tokenIndex);
            }
          }
          // Normal movement on main path
          else {
            movable.push(tokenIndex);
          }
        }
      }
    });
    
    setMovableTokens(movable);
    setCanMove(movable.length > 0);
    
    // If no moves possible or only one token can move, move automatically
    if (movable.length === 0) {
      // No moves possible, change turn (unless rolled 6)
      if (value !== 6) {
        setCurrent(prev => (prev + 1) % colors.length);
        setSixCount(0);
      }
      window.setTimeout(() => {
        setDice(null);
        setCanMove(false);
      }, 2000);
    } // No auto-move; user must click the token even if only one is available
  };

  const moveToken = (tokenIndex: number) => {
    if (!dice || !canMove) return;
    
    setTokens(prev => {
      const updated = [...prev];
      const token = updated[tokenIndex];
      
      if (token.position === -1 && dice === 6) {
        // Move from home to starting position (precomputed start index)
        const startIndex = startIndices[current];
        updated[tokenIndex] = { ...token, position: startIndex };
      } else if (token.position >= 0) {
        const homeRunPath = homeRunPaths[current as keyof typeof homeRunPaths];
        const startCoord = startingPositions[current];
        const startIndex = loop.findIndex(p => p.x === startCoord.x && p.y === startCoord.y);
        
        // Check if token is already in home run
        if (token.position >= 100 + current * 10) {
          const currentHomeRunPos = token.position - (100 + current * 10);
          const newHomeRunPos = currentHomeRunPos + dice;
          
          if (newHomeRunPos < homeRunPath.length) {
            // Move within home run
            updated[tokenIndex] = { ...token, position: 100 + current * 10 + newHomeRunPos };
          } else if (newHomeRunPos === homeRunPath.length) {
            // Exact landing on center - token wins!
            updated[tokenIndex] = { ...token, position: 999 };
          }
          // If would overshoot center, cannot move (exact landing rule)
        }
        // Token is on main path
        else {
          // Calculate distance traveled from start
          let distanceTraveled = 0;
          if (token.position >= startIndex) {
            distanceTraveled = token.position - startIndex;
          } else {
            // Wrapped around
            distanceTraveled = (loop.length - startIndex) + token.position;
          }
          
          const newDistance = distanceTraveled + dice;
          
          // Check if should enter home column after completing full circuit
          if (newDistance >= loop.length) {
            const homeRunPos = newDistance - loop.length;
            if (homeRunPos < homeRunPath.length) {
              // Enter home run
              updated[tokenIndex] = { ...token, position: 100 + current * 10 + homeRunPos };
            } else if (homeRunPos === homeRunPath.length) {
              // Direct win - exact landing on center
              updated[tokenIndex] = { ...token, position: 999 };
            }
            // If would overshoot, cannot move (exact landing rule)
          }
          // Normal movement on main path
          else {
            const newPosition = (startIndex + newDistance) % loop.length;
            updated[tokenIndex] = { ...token, position: newPosition };
          }
        }
      }
      
      return updated;
    });
    
    // Reset move state
    setCanMove(false);
    setMovableTokens([]);
    
    // Change turn if didn't roll 6
    if (dice !== 6) {
      setCurrent(prev => (prev + 1) % colors.length);
      setSixCount(0); // Reset six count when turn changes
    }
    
    setTimeout(() => setDice(null), 1000);
  };

  const resetGame = () => {
    setTokens(initialTokens);
    setCurrent(0);
    setDice(null);
    setCanMove(false);
    setMovableTokens([]);
    setSixCount(0);
  };

  return (
    <div className="app">
      <LudoBoard 
        path={path} 
        homeRunPaths={homeRunPaths}
        tokens={tokens} 
        onTokenClick={moveToken}
        movableTokens={movableTokens}
        canMove={canMove}
      />
      <div className="controls">
        <h2>🎲 Ludo Game</h2>
        <div className="current-player">
          <h3>Current Player:</h3>
          <div className={`player-indicator ${colors[current]}`}>
            {colors[current].toUpperCase()}
          </div>
        </div>
        
        <Dice value={dice} onRoll={rollDice} disabled={canMove} />
        
        {canMove && movableTokens.length > 1 && (
          <div className="move-instruction">
            <p>🎯 Click a {colors[current]} token to move it!</p>
          </div>
        )}
        
        {dice && !canMove && (
          <div className="no-moves">
            <p>❌ No valid moves available</p>
          </div>
        )}
        
        {sixCount > 0 && (
          <div className="six-count">
            <p>🎲 Consecutive 6s: {sixCount}/3</p>
            {sixCount === 2 && <p>⚠️ One more 6 ends your turn!</p>}
          </div>
        )}
        
        <button className="reset-button" onClick={resetGame}>
          🔄 Reset Game
        </button>
        
        <div className="game-info">
          <h3>📊 Game Status:</h3>
          {[0, 1, 2, 3].map(player => {
            const playerTokens = tokens.filter(t => t.player === player);
            const homeCount = playerTokens.filter(t => t.position === -1).length;
            const pathCount = playerTokens.filter(t => t.position >= 0).length;
            return (
              <div key={player} className="player-status">
                <span style={{color: colors[player], fontWeight: 'bold'}}>
                  {colors[player]}:
                </span>
                <span> 🏠 {homeCount} | 🛤️ {pathCount}</span>
              </div>
            );
          })}
        </div>
        
        <div className="game-info">
          <h3>📋 Rules:</h3>
          <ul>
            <li>Roll 🎲 6 to bring tokens out of home</li>
            <li>Rolling 6 gives you another turn</li>
            <li>Click tokens to move them when multiple options</li>
            <li>First to get all tokens to center wins!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LudoGame;
