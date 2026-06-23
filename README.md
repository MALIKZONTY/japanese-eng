# Japanese Learning Dictionary

An interactive, AI-powered personal Japanese learning assistant web application. It allows users to search, save, and organize Japanese vocabulary, build custom groups, discover related expressions, and auto-fill translations using the Grok AI engine.

---

## TECH STACK

**Frontend:**
*   React 19 & Vite
*   TypeScript
*   Tailwind CSS v4 (standalone `@tailwindcss/vite` compiler)
*   React Router DOM
*   TanStack Query (React Query)
*   Axios & Lucide Icons

**Backend:**
*   Node.js & Express.js
*   TypeScript & Mongoose
*   Zod Validation

**Database:**
*   MongoDB Atlas

**AI Engine:**
*   xAI Grok API (OpenAI compatible integration)

---

## MAIN FEATURES

1.  **Dashboard Hub**: Counters for total words, groups, and favorites. Includes recent search history logs and a quick-action search box.
2.  **Dual Search Pipeline**: Searches the local MongoDB database first. If no results are found, it queries the Grok AI engine to retrieve translations, Romaji, and related expressions, allowing you to save it to your dictionary with a single click.
3.  **AI Auto-Fill (Add Word)**: Input a term in English, Japanese, Telugu, or Romaji, click "Auto Fill", and Grok automatically translates and romanizes the text, writes Telugu meaning, and formats usage notes.
4.  **Related Expressions**: Recommends related terms (e.g. searching "bye" suggests "mata ne", "mata ashita", etc.). You can individually save, edit, or add suggested related cards to custom groups.
5.  **Word Groups & Details**: Group vocabulary (e.g., "Greetings", "JLPT N5"). Manage word memberships inside group details. Edit notes and favorite indicators inline.
6.  **AI Caching & Storage**: Automatically caches Grok AI queries in `ai_cache` to optimize API usage and log search terms in `search_history`.

---

## PROJECT STRUCTURE

```
japanese-learning-dictionary/
├── package.json         <- Root script coordinator & concurrently dev runner
├── README.md            <- Setup instructions
├── backend/             <- Node/Express API server
│   ├── src/
│   │   ├── config/      <- Database connectivity
│   │   ├── controllers/ <- Endpoint logic controllers
│   │   ├── middleware/  <- Error and cast parser middlewares
│   │   ├── models/      <- Mongoose word, group, cache schemas
│   │   ├── routes/      <- Router endpoints mapping
│   │   ├── services/    <- Grok AI integration & cache layer
│   │   └── index.ts     <- Server entry point
│   ├── tsconfig.json
│   └── package.json
└── frontend/            <- Vite React app
    ├── src/
    │   ├── components/  <- Reusable Button, Card, Dialog, Toast UI elements
    │   ├── layouts/     <- Sidebar layout and persistent Dark Theme toggle
    │   ├── pages/       <- Dashboard, Dictionary, AddWord, Details, Groups, Favorites pages
    │   ├── services/    <- Axios service bindings
    │   ├── types/       <- TypeScript interface definitions
    │   ├── utils/       <- Class merge helpers
    │   ├── App.tsx      <- Route pathways
    │   └── main.tsx     <- React mounter
    ├── vite.config.ts
    └── package.json
```

---

## ENVIRONMENT CONFIGURATION

Make sure the following environment variables are exported on your system (or added to a `.env` file in the `backend/` directory):

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/japanese_dictionary?retryWrites=true&w=majority
GROK_API_KEY=xai-your-grok-api-key-here
```

---

## GETTING STARTED

The project is configured with a root coordinator so it is runnable immediately using standard scripts:

### 1. Install Dependencies
Run this in the root folder of the project. It will automatically install packages for the root runner, the backend server, and the frontend Vite app:
```bash
npm install
```

### 2. Start Development Servers
Run the following script to start the backend API server (on port `5001`) and the Vite development server (on port `5173`) concurrently:
```bash
npm run dev
```

### 3. Open in Browser
Open your browser and navigate to:
*   Frontend: [http://localhost:5173](http://localhost:5173)
*   Backend API healthcheck: [http://localhost:5001/api](http://localhost:5001/api)
