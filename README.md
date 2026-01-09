# 🎨 Ideation Buddy

Your AI-powered creative companion for brainstorming and visual thinking.

![Ideation Buddy](https://img.shields.io/badge/Powered%20by-Azure%20OpenAI-blue)

## What is this?

Ideation Buddy is a whiteboard + AI assistant that helps you think through ideas visually. Draw, sketch, annotate PDFs, and have a conversation with an AI that can see what you're working on.

**Try it live:** [themikulrai.github.io/ideation-buddy](https://themikulrai.github.io/ideation-buddy/)

## ✨ Features

- **🖌️ Whiteboard Mode** — Draw freely with pen tools, switch colors, and let AI analyze your sketches
- **📄 PDF Mode** — Upload PDFs, annotate them, and discuss the content with AI
- **💬 Conversational AI** — Chat with Azure OpenAI about what you're working on
- **🔊 Text-to-Speech** — Hear AI responses read aloud (optional)
- **🔒 Privacy First** — Your API keys stay in your browser, never sent to any server

## 🚀 Getting Started

### Use the Live Site

1. Visit [themikulrai.github.io/ideation-buddy](https://themikulrai.github.io/ideation-buddy/)
2. Enter your Azure OpenAI credentials when prompted
3. Start drawing or upload a PDF!

### Run Locally

```bash
git clone https://github.com/themikulrai/ideation-buddy.git
cd ideation-buddy
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173)

## 🔑 Azure OpenAI Setup

You'll need an Azure OpenAI resource with:

| Field | Description |
|-------|-------------|
| **Endpoint** | Your Azure OpenAI endpoint (e.g., `https://your-resource.openai.azure.com`) |
| **API Key** | Your API key from Azure Portal |
| **Deployment Name** | The name of your deployed model (e.g., `gpt-4o`) |

Optional for text-to-speech:
- **Speech Key** — Azure Cognitive Services Speech key
- **Speech Region** — Azure region (e.g., `eastus`)

## 🛠️ Tech Stack

- React 19 + TypeScript
- Vite
- Azure OpenAI
- PDF.js for PDF rendering

## 📝 License

MIT — do whatever you want with it!

---

Built with ☕ and curiosity.
