# 🧠 AI Council

> **AI Council** is a full-stack multi-agent AI platform where multiple AI personas collaborate, debate, mentor, and reason together under the supervision of an intelligent orchestrator.

Instead of interacting with a single chatbot, users can assemble an AI council of specialized AI personas, each with its own personality, expertise, and reasoning style. The platform intelligently manages discussions using an orchestrator that selects the most suitable agent for every turn while maintaining fairness and conversation flow.

---

## ✨ Features

### 🤖 Multi-Agent AI System

- Create and manage AI personas
- Multiple AI agents participate in a shared discussion
- Persona-driven responses with unique reasoning styles
- Configurable discussion modes

---

### 🎭 Intelligent Orchestrator

The orchestrator controls the entire discussion by:

- Dynamically selecting the next speaker
- Using LLM-based decision making
- Maintaining fair participation among agents
- Supporting Round-Robin fallback
- Tracking conversation history
- Managing discussion flow

---

### 🧠 Persona-Based AI Agents

Every AI agent has its own:

- Name
- Role
- Personality
- Speech Style
- Backstory
- Domain
- Special Ability

Each response is generated while preserving the assigned persona.

---

### 🛠️ Intelligent Tool Calling

Before answering, an AI agent can automatically decide whether external tools are required.

Supported tools include:

- Wikipedia Search
- Medical Search
- Drug Information
- Hospital Finder
- News Search
- ArXiv Research
- Stanford Encyclopedia
- World Bank Data
- UN Statistics
- Country Profile
- Supreme Court Cases
- Quote Search
- Logical Fallacy Detection

Tool selection is planned by an LLM and executed automatically.

---

### 🧠 Memory System

Supports conversation-aware memory with:

- Context Summarization
- Session Memory
- Topic Memory
- Minimal Memory Mode
- Full Memory Mode

---

### ⚙️ Model Routing

Supports multiple AI providers through a common abstraction layer.

Features include:

- Dynamic model selection
- Persona-specific model configuration
- Provider abstraction
- Ollama integration
- OpenAI Compatible APIs

---

### 📊 Conversation Analytics

Tracks important discussion metrics including:

- Speaking history
- Participation statistics
- Decision trace
- Confidence scores
- Performance metrics

---

# 🏗️ Architecture

```text
                           User
                             │
                             ▼
                    Message Controller
                             │
                             ▼
                      Discussion Service
                             │
                             ▼
                       Orchestrator
                             │
            ┌────────────────┴────────────────┐
            │                                 │
            ▼                                 ▼
 Dynamic Speaker Selection          Round-Robin Fallback
            │
            ▼
        Agent Runtime
            │
            ▼
     Tool Planner (LLM)
            │
            ▼
     Tool Execution Layer
            │
            ▼
    External Knowledge Sources
            │
            ▼
       AI Generated Response
```

---

# 📂 Project Structure

```text
AI_Council_minor_project/

├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── lib/
│   │   ├── data/
│   │   └── App.jsx
│   │
│   └── public/
│
├── backend/
│   ├── features/
│   │   ├── agent/
│   │   ├── auth/
│   │   ├── combat/
│   │   ├── message/
│   │   ├── orchestrator/
│   │   ├── panels/
│   │   └── research/
│   │
│   ├── middleware/
│   ├── routes/
│   ├── shared/
│   ├── tools/
│   └── config/
│
└── README.md
```

---

# 🚀 Tech Stack

## Frontend

- React
- Vite
- Tailwind CSS
- Zustand

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose

## AI

- OpenAI Compatible APIs
- Ollama
- Prompt Engineering
- Multi-Agent Architecture
- Tool Calling

---

# ⚡ Backend Highlights

- Feature-Based Modular Architecture
- Multi-Agent Runtime
- Intelligent Orchestrator
- Persona Prompting
- Tool Planning
- Tool Execution
- Memory Management
- Shared LLM Client
- Model Registry
- Configurable Discussion Modes

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/<your-username>/AI_Council_minor_project.git
cd AI_Council_minor_project
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Backend Setup

```bash
cd backend
npm install
npm run dev
```

---

## Environment Variables

Create a `.env` file inside the backend directory.

```env
PORT=3000

OPENAI_API_KEY=your_api_key

OPENAI_BASE_URL=your_base_url

MONGODB_URI=your_mongodb_connection_string
```

---

# 🎯 Project Highlights

- 🤖 Multi-Agent AI Platform
- 🧠 Persona-Based AI Agents
- 🎭 Intelligent Conversation Orchestrator
- 🛠️ Automatic Tool Calling
- 🧠 Context-Aware Memory
- ⚙️ Multiple LLM Provider Support
- 📊 Conversation Analytics
- 🏗️ Modular Backend Architecture

---

# 👨‍💻 Author

**Suraj Kumar**

B.Tech Information Technology

Minor Project — AI Council (Multi-Agent AI Platform)

---

⭐ **If you found this project interesting, consider giving it a Star!**
