# AI Council Frontend

The React client for AI Council, a debate arena where you assemble a council of personas, pick strategies, and run structured rounds against an opposing team. This frontend handles the setup flow, live debate UI, analytics, and history replay.

**Features**
- Authentication gate and session bootstrapping
- Multi-step setup flow for mode, topic, and roster selection
- Persona creation and editing for custom agents
- Draft-style team selection with opponent team auto-selection
- Strategy selection with preview generation and tweakable drafts
- Turn-based combat UI with round pairing and transcript display
- Final results screen with per-round verdicts and total score
- Discussion history loading and replay
- Bias control slider and live analytics panels

**Tech Stack**
- React, Vite, Tailwind CSS, Zustand

**Project Structure**
```
frontend
|-- public
|-- src
|   |-- components         # UI building blocks
|   |-- data               # Mock data and constants
|   |-- store              # Zustand state
|   |-- lib                # API client and helpers
|   |-- App.jsx            # Main app shell
|   `-- main.jsx           # React entry point
|-- index.html
`-- README.md
```

**Getting Started**
1. Install dependencies

```
npm install
```

2. Set the API base URL (optional)

Create a `frontend/.env` file if your backend is not at the default `/api` proxy path.

```
VITE_API_BASE_URL=http://localhost:3000/api
```

3. Start the dev server

```
npm run dev
```

The app runs on `http://localhost:5173` by default.

**Inspirations**
- Competitive debate formats and adjudication
- Sports-style drafting and team composition
- Role-playing personas with distinct rhetorical styles
- Director''s cut editing workflows for creative drafting
