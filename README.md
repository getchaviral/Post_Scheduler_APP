# Post Scheduler Sample Page

A polished React + Tailwind demo page for scheduling social posts with local state and `localStorage` persistence.

## Quick Start

1. Install dependencies
   ```bash
   npm install
   ```
2. Start the development server
   ```bash
   npm run dev
   ```
3. Open the local Vite URL shown in the terminal.

## Available Scripts

- `npm run dev` - start local development server
- `npm run build` - create production build
- `npm run preview` - preview the production build locally

## Project Structure

- `src/App.jsx` - complete sample page UI and client-side scheduling logic
- `src/main.jsx` - React entry point
- `src/index.css` - Tailwind imports and small global styles
- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS setup
- `vite.config.js` - Vite configuration

## Notes

- No backend is required.
- Scheduled posts are stored in browser `localStorage` so they persist across refreshes.
- This is intentionally scoped as a client demo / prototype page.
