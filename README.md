<div align="center">
  <img src="public/icons/icon128.png" alt="RizzYt Logo" width="128">
  
  # RizzYt - Chrome Extension 🎬
  
  **An AI-powered Chrome Extension to summarize any YouTube video instantly.**
  
  [![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
</div>

---

## 🌟 Overview

RizzYt is a lightning-fast Chrome Extension that uses cutting-edge AI (Groq LLaMA 3.3 and Google Gemini) to summarize YouTube videos in seconds. It extracts transcripts, processes the context, and delivers structured summaries based on your preferred length directly within the YouTube interface.

## Features

- ⚡ **Blazing Fast Summaries**: Powered by Groq (Llama 3.3 70B) for instant AI inference.
- 🎯 **Adjustable Lengths**: Choose between Short (5 bullets), Medium (sections & takeaways), or Long (in-depth analysis).
- 💾 **Export & Save**: Instantly download your generated summaries as a clean `.txt` file.
- 📝 **Smart Fallbacks**: Extracts transcripts when available, and falls back to video metadata/chapters if closed captions are disabled.
- 🔒 **100% Private**: Your API keys are stored securely on your local device via `chrome.storage.local`.


## 🛠️ Installation (Developer Mode)

Since this extension requires your own API key, it is loaded manually via Chrome Developer Mode.

1. **Download the Extension:**
   - Go to the [Releases](https://github.com/goutham-05-raj/RizzYt/releases) page and download the latest `dist.zip`.
   - Extract the ZIP file to a folder on your computer.

2. **Load into Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer mode** (toggle switch in the top right corner).
   - Click **Load unpacked** in the top left corner.
   - Select the `dist` folder you just extracted.

3. **Pin & Setup:**
   - Click the puzzle piece 🧩 icon in your Chrome toolbar and pin **RizzYt**.
   - Click the extension icon and navigate to **⚙️ Settings**.
   - Get a free [Groq API Key](https://console.groq.com/keys) or [Google Gemini Key](https://aistudio.google.com/app/apikey) and save it.

---

## 💻 Development

Want to contribute or build from source? 

### Prerequisites
- Node.js 18+

### Setup

```bash
# Clone the repository
git clone https://github.com/goutham-05-raj/RizzYt.git
cd RizzYt

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The compiled extension will be output to the `dist/` directory, which you can load into Chrome.

---

## 🛡️ Privacy Policy

RizzYt does not collect, store, or transmit any of your personal data. 
- API Keys are saved locally on your device via Chrome Local Storage.
- Summarization requests are sent directly from your browser to the chosen AI provider (Groq/Google).
