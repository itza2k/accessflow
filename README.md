# AccessFlow

<p align="center">
  <img src="accessflow/public/icons/icon48.png" alt="AccessFlow Logo" width="128" height="128">
</p>

<p align="center">
  An AI-powered browser extension that creates an accessible and effortless flow of understanding for web content.
</p>

## 🌟 Introduction

AccessFlow leverages Google's Gemini AI to transform complex web content into more understandable formats for users with cognitive differences, learning disabilities, and anyone who prefers simplified content. The extension offers text simplification, summarization, key concept identification, and read-aloud capabilities to make digital content more accessible.

## ✨ Key Features

- **Text Simplification:** Transform complex text into simpler language while preserving meaning and context
- **Content Summarization:** Get concise summaries of long articles and complex documents
- **Key Concept Identification:** Extract and explain important terms and concepts from the text
- **Read Aloud:** Listen to processed text with adjustable reading speed and voice options
- **Accessibility Options:**
  - Font size and family customization
  - Line spacing adjustments
  - High contrast mode
  - Dyslexia-friendly font option
- **Export & Sharing:** Export processed content to PDF or share it with others
- **History Management:** Save processing history for quick reference
- **Dark Mode:** Full dark mode support with system preference detection

## 🛠️ Technical Stack

- **Frontend:** HTML, CSS, JavaScript
- **Build Tool:** Vite for fast development and optimized production builds
- **AI Integration:** Google Gemini API
- **Browser Extension APIs:**
  - Chrome Extension API
  - Web Speech API for read-aloud functionality
  - Storage API for settings and history
  - Clipboard API
  - Web Share API

## 📋 Requirements

- Google Chrome browser (version 88+)
- Gemini API key

## 🔧 Installation

### For Users

1. Download the extension from the Chrome Web Store (coming soon)
2. Click on the AccessFlow icon in your browser toolbar to open the popup
3. Go to Settings and enter your Gemini API key
4. Start using AccessFlow by selecting text on any webpage!

### For Developers

1. Clone the repository:
   ```
   git clone https://github.com/itza2k/accessflow.git
   ```

2. Install dependencies:
   ```
   cd accessflow
   npm install
   ```

3. Start development server:
   ```
   npm run dev
   ```

4. Build for production:
   ```
   npm run build
   ```

5. Navigate to Chrome's extension page:
   ```
   chrome://extensions/
   ```

6. Enable "Developer mode" in the top-right corner

7. Click "Load unpacked" and select the `/dist` directory from the build output

8. The extension should now be installed in development mode

## 🚀 Usage

1. **Process Text:**
   - Select text on any webpage
   - Right-click and select "Process with AccessFlow" or use keyboard shortcut `Ctrl+Shift+A`
   - Choose to simplify or summarize the selected text

2. **Configure Settings:**
   - Set your Gemini API key
   - Adjust simplification level
   - Customize display preferences
   - Configure read-aloud options

3. **Keyboard Shortcuts:**
   - `Ctrl+Shift+A` - Process selected text
   - `Alt+S` - Simplify text
   - `Alt+M` - Summarize text
   - `Alt+R` - Read text aloud

## 🔑 Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an account or sign in
3. Generate a new API key
4. Copy the key and paste it into the AccessFlow settings

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- Google Gemini API for powering the AI capabilities
- [Vite](https://vitejs.dev/) for the blazing fast build tooling
- [Inter Font](https://fonts.google.com/specimen/Inter) for the clean UI typography

---

<p align="center">
  Made by <a href="https://github.com/itza2k">itza2k</a>
</p>
