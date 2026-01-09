# IdeationBuddy 💡

IdeationBuddy is an interactive, AI-powered whiteboard and PDF annotation tool designed to help you brainstorm and refine ideas. It integrates with Azure OpenAI to provide real-time creative assistance, visual analysis, and voice interaction.

## ✨ Features

- **Interactive Whiteboard**: Draw, sketch, and visualize ideas on an infinite canvas.
- **PDF Annotation**: Upload PDFs, highlight, and annotate directly on the pages.
- **AI-Powered Insights**: Chat with an AI assistant that can "see" your whiteboard or PDF content and offer suggestions.
- **Voice Interaction**: Speak to the AI and hear its responses using Azure Speech-to-Text and Text-to-Speech.
- **Secure & Private**: Your Azure OpenAI API keys are stored locally in your browser (LocalStorage) and never saved to our servers.
- **GitHub Pages Ready**: Easily deployable to GitHub Pages for instant access.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- An Azure OpenAI resource with deployments for:
  - `gpt-4o` (or similar for Chat & Vision)
  - `gpt-4o-transcribe-diarize` (Speech-to-Text)
  - `gpt-4o-mini-tts` (Text-to-Speech)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ideation-buddy.git
   cd ideation-buddy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:5173`.

### Configuration

On your first visit, you will be prompted to enter your **Azure OpenAI API Key** and **Endpoint URL**.
- These credentials are saved in your browser's LocalStorage.
- You can update them anytime by clicking the **Settings (⚙️)** button.

## 📦 Deployment

This project is configured for automated deployment to **GitHub Pages**.

1. Push your code to a GitHub repository named `ideation-buddy`.
2. The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically build and deploy the site.
3. Your site will be live at: `https://YOUR_USERNAME.github.io/ideation-buddy/`

### Manual Build

To build the project locally for production:

```bash
npm run build
```

The output will be in the `dist` directory.

## 🛠️ Tech Stack

- **Framework**: React 19, TypeScript
- **Build Tool**: Vite
- **AI Services**: Azure OpenAI (GPT-4o, Whisper, TTS)
- **PDF Handling**: pdf-lib, react-pdf
- **Styling**: CSS Modules

## 📄 License

MIT
