# Tetris

A simple browser-based Tetris game with Guideline-style scoring. Built with plain HTML, CSS, and JavaScript — published on [GitHub Pages](https://innaamogolonova.github.io/tetris/).

## Scoring

Uses the modern [Tetris Guideline](https://tetris.fandom.com/wiki/Scoring) rules:

| Action | Points |
|--------|--------|
| Single line | 100 × level |
| Double | 300 × level |
| Triple | 500 × level |
| Tetris (4 lines) | 800 × level |
| Soft drop | 1 per cell |
| Hard drop | 2 per cell |

Level increases every 5 lines cleared; gravity speeds up as level rises.

## Play locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

Then visit http://localhost:8080

## Controls

| Key | Action |
|-----|--------|
| ← → | Move |
| ↓ | Soft drop |
| ↑ | Rotate |
| Space | Hard drop |
| P | Pause |

On touch devices, use the on-screen buttons.

## GitHub Pages 
https://innaamogolonova.github.io/tetris/ 
