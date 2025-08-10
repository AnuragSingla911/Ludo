import React from 'react';

interface Coord {
  x: number;
  y: number;
}

interface Token {
  player: number;
  position: number;
}

interface BoardProps {
  path: Coord[];
  homeRunPaths: {
    0: Coord[];
    1: Coord[];
    2: Coord[];
    3: Coord[];
  };
  tokens: Token[];
  onTokenClick: (tokenIndex: number) => void;
  movableTokens: number[];
  canMove: boolean;
}

const colors = ['red', 'blue', 'green', 'yellow'];
const size = 15;

// Home positions for each player (6x6 yards in each quadrant)
const homePositions = {
  0: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }], // Red yard: r∈[0..5], c∈[0..5]
  1: [{ x: 10, y: 1 }, { x: 11, y: 1 }, { x: 10, y: 2 }, { x: 11, y: 2 }], // Blue yard: r∈[0..5], c∈[9..14]
  2: [{ x: 10, y: 10 }, { x: 11, y: 10 }, { x: 10, y: 11 }, { x: 11, y: 11 }], // Green yard: r∈[9..14], c∈[9..14]
  3: [{ x: 1, y: 10 }, { x: 2, y: 10 }, { x: 1, y: 11 }, { x: 2, y: 11 }] // Yellow yard: r∈[9..14], c∈[0..5]
};

const LudoBoard: React.FC<BoardProps> = ({ path, homeRunPaths, tokens, onTokenClick, movableTokens, canMove }) => {
  const cells: JSX.Element[] = [];

  // Helper function to get cell type following the specification
  const getCellType = (x: number, y: number) => {
    // Check if it's the center
    if (x === 7 && y === 7) {
      return 'center';
    }
    
    // Check if it's a path cell (outer loop - only on neutral lanes)
    const pathIndex = path.findIndex(p => p.x === x && p.y === y);
    if (pathIndex !== -1) {
      const classes = ['path'];

      // Determine direction from next step for indicators
      const next = path[(pathIndex + 1) % path.length] ?? path[pathIndex];
      const dx = Math.sign((next?.x ?? x) - x);
      const dy = Math.sign((next?.y ?? y) - y);
      if (dx === 1) classes.push('arrow-right');
      else if (dx === -1) classes.push('arrow-left');
      else if (dy === 1) classes.push('arrow-down');
      else if (dy === -1) classes.push('arrow-up');

      // Find starting positions in the generated path and mark them
      const startingCoords = [
        { x: 1, y: 6 }, // Red start: (6,1) -> (1,6)
        { x: 8, y: 1 }, // Blue start: (1,8) -> (8,1)
        { x: 13, y: 8 }, // Green start: (8,13) -> (13,8)
        { x: 6, y: 13 } // Yellow start: (13,6) -> (6,13)
      ];
      const startingColors = ['red', 'blue', 'green', 'yellow'] as const;
      const startIdx = startingCoords.findIndex(coord => coord.x === x && coord.y === y);
      if (startIdx !== -1) {
        classes.push('start', `start-${startingColors[startIdx]}`);
      }
      
      // Mark safe zones (starting positions + 8 steps clockwise from each)
      const safeIndices: number[] = [];
      startingCoords.forEach(coord => {
        const idx = path.findIndex(p => p.x === coord.x && p.y === coord.y);
        if (idx !== -1) {
          safeIndices.push(idx); // Starting position
          safeIndices.push((idx + 8) % path.length); // 8 steps clockwise
        }
      });
      if (safeIndices.includes(pathIndex)) {
        classes.push('safe');
      }

      return classes.join(' ');
    }
    
    // Check if it's a home run path (only colored dotted strips toward center)
    for (let player = 0; player < 4; player++) {
      const homeRunPath = homeRunPaths[player as keyof typeof homeRunPaths];
      if (homeRunPath.some(pos => pos.x === x && pos.y === y)) {
        return `home-run home-run-${colors[player]}`;
      }
    }
    
    // Check if it's a home area (in 6x6 yards)
    for (let player = 0; player < 4; player++) {
      if (homePositions[player as keyof typeof homePositions].some(pos => pos.x === x && pos.y === y)) {
        return `home home-${colors[player]}`;
      }
    }
    
    // Check if it's part of the cross structure (neutral corridors)
    if ((x >= 6 && x <= 8 && y >= 0 && y <= 14) || (y >= 6 && y <= 8 && x >= 0 && x <= 14)) {
      return 'cross';
    }
    
    // Determine quadrant colors (6x6 yards)
    // Red yard: r∈[0..5], c∈[0..5] -> y∈[0..5], x∈[0..5]
    if (x >= 0 && x <= 5 && y >= 0 && y <= 5) {
      return 'quadrant red-quadrant';
    }
    // Blue yard: r∈[0..5], c∈[9..14] -> y∈[0..5], x∈[9..14]  
    else if (x >= 9 && x <= 14 && y >= 0 && y <= 5) {
      return 'quadrant blue-quadrant';
    }
    // Green yard: r∈[9..14], c∈[9..14] -> y∈[9..14], x∈[9..14]
    else if (x >= 9 && x <= 14 && y >= 9 && y <= 14) {
      return 'quadrant green-quadrant';
    }
    // Yellow yard: r∈[9..14], c∈[0..5] -> y∈[9..14], x∈[0..5]
    else if (x >= 0 && x <= 5 && y >= 9 && y <= 14) {
      return 'quadrant yellow-quadrant';
    }
    
    return 'empty';
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cellType = getCellType(x, y);
      const classNames = ['cell', cellType];
      
      // Find tokens at this position
      const tokensHere: Token[] = [];
      
      // Check for tokens on the main path
      const pathIndex = path.findIndex(p => p.x === x && p.y === y);
      if (pathIndex !== -1) {
        tokensHere.push(...tokens.filter(t => t.position === pathIndex));
      }
      
      // Check for tokens on home run paths
      for (let player = 0; player < 4; player++) {
        const homeRunPath = homeRunPaths[player as keyof typeof homeRunPaths];
        const homeRunIndex = homeRunPath.findIndex(pos => pos.x === x && pos.y === y);
        if (homeRunIndex !== -1) {
          // Find tokens in this player's home run at this position
          const homeRunPosition = 100 + player * 10 + homeRunIndex;
          tokensHere.push(...tokens.filter(t => t.position === homeRunPosition));
        }
      }
      
      // Check for winning tokens at center
      if (x === 7 && y === 7) {
        tokensHere.push(...tokens.filter(t => t.position === 999));
      }
      
      // Check for tokens at home
      for (let player = 0; player < 4; player++) {
        const homePos = homePositions[player as keyof typeof homePositions];
        const homeIndex = homePos.findIndex(pos => pos.x === x && pos.y === y);
        if (homeIndex !== -1) {
          // Find tokens at home for this player at this specific home position
          const homeTokens = tokens.filter(t => t.player === player && t.position === -1);
          if (homeTokens[homeIndex]) {
            tokensHere.push(homeTokens[homeIndex]);
          }
        }
      }

      cells.push(
        <div className={classNames.join(' ')} key={`${x}-${y}`}>
          {tokensHere.map((token, index) => {
            const tokenIndex = tokens.findIndex(t => t === token);
            const isMovable = movableTokens.includes(tokenIndex);
            const tokenClasses = [
              'token', 
              colors[token.player],
              isMovable && canMove ? 'movable' : '',
              canMove && !isMovable ? 'disabled' : ''
            ].filter(Boolean).join(' ');
            
            return (
              <div 
                key={index} 
                className={tokenClasses}
                onClick={() => isMovable && canMove ? onTokenClick(tokenIndex) : undefined}
                style={{ 
                  cursor: isMovable && canMove ? 'pointer' : 'default',
                  zIndex: isMovable ? 10 : 5
                }}
              />
            );
          })}
        </div>
      );
    }
  }

  return <div className="board">{cells}</div>;
};

export default LudoBoard;
