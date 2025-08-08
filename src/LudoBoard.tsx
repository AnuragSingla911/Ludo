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
  tokens: Token[];
}

const colors = ['red', 'blue', 'green', 'yellow'];
const size = 15;

const LudoBoard: React.FC<BoardProps> = ({ path, tokens }) => {
  const cells: JSX.Element[] = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const pathIndex = path.findIndex(p => p.x === x && p.y === y);
      const token = tokens.find(
        t => path[t.position].x === x && path[t.position].y === y
      );

      const classNames = ['cell'];
      if (pathIndex !== -1) classNames.push('path');

      cells.push(
        <div className={classNames.join(' ')} key={`${x}-${y}`}>
          {token && <div className={`token ${colors[token.player]}`} />}
        </div>
      );
    }
  }

  return <div className="board">{cells}</div>;
};

export default LudoBoard;
