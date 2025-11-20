"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const GRID_SIZE = 4;
const TILE_VALUES = [2, 4];
const TILE_PROBABILITIES = [0.9, 0.1];

function getRandomTile() {
  return Math.random() < TILE_PROBABILITIES[0] ? TILE_VALUES[0] : TILE_VALUES[1];
}

function cloneGrid(grid: number[][]) {
  return grid.map(row => [...row]);
}

function addRandomTile(grid: number[][]) {
  const empty: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  grid[r][c] = getRandomTile();
  return grid;
}

function slideAndMerge(row: number[]) {
  const nonZero = row.filter(v => v !== 0);
  const merged: number[] = [];
  let skip = false;
  for (let i = 0; i < nonZero.length; i++) {
    if (skip) {
      skip = false;
      continue;
    }
    if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
      merged.push(nonZero[i] * 2);
      skip = true;
    } else {
      merged.push(nonZero[i]);
    }
  }
  while (merged.length < GRID_SIZE) merged.push(0);
  return merged;
}

function move(grid: number[][], direction: "up" | "down" | "left" | "right") {
  let newGrid = cloneGrid(grid);
  let changed = false;

  const rotate = (g: number[][], times: number) => {
    let res = g;
    for (let t = 0; t < times; t++) {
      const tmp: number[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          tmp[c][GRID_SIZE - 1 - r] = res[r][c];
        }
      }
      res = tmp;
    }
    return res;
  };

  // Normalize to left move
  if (direction === "right") newGrid = rotate(newGrid, 3);
  else if (direction === "up") newGrid = rotate(newGrid, 1);
  else if (direction === "down") newGrid = rotate(newGrid, 2);

  for (let r = 0; r < GRID_SIZE; r++) {
    const original = newGrid[r];
    const merged = slideAndMerge(original);
    if (!changed && merged.some((v, i) => v !== original[i])) changed = true;
    newGrid[r] = merged;
  }

  // Rotate back
  if (direction === "right") newGrid = rotate(newGrid, 1);
  else if (direction === "up") newGrid = rotate(newGrid, 3);
  else if (direction === "down") newGrid = rotate(newGrid, 2);

  return { grid: newGrid, changed };
}

function hasMoves(grid: number[][]) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) return true;
      if (c + 1 < GRID_SIZE && grid[r][c] === grid[r][c + 1]) return true;
      if (r + 1 < GRID_SIZE && grid[r][c] === grid[r + 1][c]) return true;
    }
  }
  return false;
}

export default function Game() {
  const [grid, setGrid] = useState<number[][]>(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    let g = addRandomTile(addRandomTile(grid));
    setGrid(g);
  }, []);

  const handleMove = (dir: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    const { grid: newGrid, changed } = move(grid, dir);
    if (!changed) return;
    const addedScore = newGrid.flat().reduce((acc, val, idx, arr) => {
      const prev = grid.flat()[idx];
      if (val > prev) acc += val - prev;
      return acc;
    }, 0);
    setScore(prev => prev + addedScore);
    setGrid(newGrid);
    const afterAdd = addRandomTile(newGrid);
    setGrid(afterAdd);
    if (!hasMoves(afterAdd)) setGameOver(true);
  };

  const tileColor = (value: number) => {
    const colors: Record<number, string> = {
      0: "bg-gray-200",
      2: "bg-blue-200",
      4: "bg-blue-300",
      8: "bg-green-200",
      16: "bg-green-300",
      32: "bg-yellow-200",
      64: "bg-yellow-300",
      128: "bg-orange-200",
      256: "bg-orange-300",
      512: "bg-red-200",
      1024: "bg-red-300",
      2048: "bg-purple-200",
    };
    return colors[value] ?? "bg-purple-300";
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {grid.flat().map((val, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-center h-16 w-16 rounded-md text-2xl font-bold ${tileColor(val)}`}
          >
            {val !== 0 ? val : null}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => handleMove("up")}>↑</Button>
        <Button variant="outline" onClick={() => handleMove("left")}>←</Button>
        <Button variant="outline" onClick={() => handleMove("right")}>→</Button>
        <Button variant="outline" onClick={() => handleMove("down")}>↓</Button>
      </div>
      <div className="text-xl">Score: {score}</div>
      {gameOver && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-2xl font-bold">Game Over!</div>
          <Share text={`I scored ${score} in 2048! ${url}`} />
        </div>
      )}
    </div>
  );
}
