# Tetris

A simple browser-based Tetris game (no scoring yet). Built with plain HTML, CSS, and JavaScript — ready for [GitHub Pages](https://pages.github.com/).

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

## Publish on GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose branch `main` (or `master`) and folder **`/ (root)`**.
5. Save. Your game will be at `https://<username>.github.io/tetris/` (repo name becomes the path for project sites).

If your repo is named differently, replace `tetris` in the URL with your repo name.
