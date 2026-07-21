# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Vanilla-JS Tetris on HTML5 Canvas. No package.json, no bundler, no transpiler, no tests, no lint config. Three source files: `index.html`, `style.css`, `game.js`.

## Running

Open `index.html` directly (`start index.html` on Windows), or serve statically:

```bash
python3 -m http.server 8000   # or: npx serve .
```

No build step — edits are live on reload.

## Architecture (`game.js`, single IIFE-less global scope, `'use strict'`)

State lives in module-level `let` bindings (`board, current, next, score, lines, level, paused, gameOver, dropInterval, ...`), all reset by `init()`. There is no class or module boundary; functions mutate this shared state directly.

Key invariants worth knowing before editing:

- **Board model**: `ROWS × COLS` matrix of ints. `0` = empty; `1–7` = the classic tetrominoes, `8–12` = non-standard pieces (`8`=+, `9`=U, `10`=Y pentominoes, `11`=1×1, `12`=hollow 3×3), all indexing into both `COLORS` and `PIECES`. Cell value *is* the color key — don't decouple them without updating both tables.
- **Pieces** are matrices (`PIECES[type]`, not always square). `randomPiece(forceType)` deep-copies the template, so rotation mutates only the live piece. Type selection goes through `pickType()`: `SPECIAL_CHANCE` (12%) rolls one of `SPECIAL_TYPES` (the + / U / Y / hollow pieces), otherwise a uniform classic tetromino. Type `11` (1×1) is never drawn randomly — `clearLines()` sets `rewardPending` on a 4-line clear, and `spawn()` forces the next piece to `REWARD_TYPE` when that flag is set.
- **Rotation** = `rotateCW` (transpose + row-reverse) plus `tryRotate`'s ad-hoc wall kicks (`[0,-1,1,-2,2]` column offsets). This is not SRS.
- **Collision** (`collide(shape, ox, oy)`) allows `ny < 0` (above the board) so pieces can spawn/rotate partially off-screen; it only rejects horizontal out-of-bounds and floor.
- **Game loop**: `requestAnimationFrame(loop)` accumulates `dt` into `dropAccum`; a drop fires when it exceeds `dropInterval`. Pause/game-over work by `cancelAnimationFrame(animId)` — anything that stops or restarts the loop must keep `animId` and `lastTime` consistent, or `dt` spikes on resume.
- **Speed curve**: `dropInterval = max(100, 1000 - (level-1)*90)`, level = `floor(lines/10)+1`, recomputed in `clearLines()`.
- **Scoring**: `LINE_SCORES[cleared] * level`, plus 2/cell for hard drop and 1/row for soft drop.
- **Rendering** is full-redraw each frame: `draw()` clears, then grid → settled board → ghost (`ghostY()`, alpha 0.2) → current piece. `drawBlock` is shared by both canvases; `drawNext()` centers the preview in a 4×4 grid at 30px.

## Cross-file coupling

Canvas dimensions are hardcoded in `index.html` (`board` = 300×600, `next-canvas` = 120×120). Changing `COLS`, `ROWS`, or `BLOCK` in `game.js` requires updating the `<canvas>` `width`/`height` attributes to match `COLS*BLOCK × ROWS*BLOCK`.

`game.js` grabs all DOM nodes by id at load time (`board`, `next-canvas`, `score`, `lines`, `level`, `overlay`, `overlay-title`, `overlay-score`, `restart-btn`) — renaming an id in the HTML breaks the script silently at startup.

## Conventions

- UI strings and README/comments are in Spanish; code identifiers in English. Keep that split.
- ES6+ browser-native only; do not introduce dependencies or a build step.
- Keybindings are handled in one `keydown` listener switching on `e.code` (not `e.key`).
