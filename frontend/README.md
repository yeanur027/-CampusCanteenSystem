# CCOS React frontend

This Vite + React application uses the existing Flask API. During development, Vite proxies `/api` to `http://127.0.0.1:5000`.

From this directory:

```powershell
npm install
npm run dev
```

Open http://localhost:5173. Keep the Flask server running in another terminal.

For a single-server build, run `npm run build`. Vite writes the compiled app to `../static/react`; Flask automatically serves it at `/`.
