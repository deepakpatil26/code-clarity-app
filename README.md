# 🚀 CodeClarity: AI-Powered Code Review

> **The 24/7 Senior Developer on your team** — Instant, insightful code reviews to help you ship with confidence.

<div align="center">
  <a href="https://code-clarity-app.vercel.app/" target="_blank">
    <img src="https://vercel.com/button" alt="Deploy with Vercel"/>
  </a>
</div>

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Google%20Gemini-8E77F7?style=for-the-badge&logo=google-gemini&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT" />
</div>

## ✨ Why CodeClarity?

Tired of waiting for code reviews? Say hello to **instant, AI-powered code analysis** that helps you write better, more secure, and more efficient code.

- ⚡ **Lightning-Fast Feedback**: Get suggestions as you analyze local files or review pull requests.
- 🔒 **Catch Issues Early**: Find potential quality, performance, and security issues before they make it to production.
- 🗣️ **Listen to Your Review**: A unique text-to-speech feature reads the analysis back to you.
- 🤖 **Your 24/7 Code Partner**: An intelligent assistant that's always available to help you improve.

---

## 📸 App Preview

![A GIF showing the CodeClarity app in action. It demonstrates analyzing a local file, viewing suggestions, and then analyzing a GitHub Pull Request, including the text-to-speech feature.](app-preview.gif)

---

## 🚀 Deployment

This application is deployed on Vercel. You can access the live version here:

**[https://code-clarity-app.vercel.app/](https://code-clarity-app.vercel.app/)**

---

## 🎯 Key Features

### Smart Code Analysis
- **Multi-language Support**: JavaScript, TypeScript, Python, Java, C++, and Go.
- **Real-time Feedback**: Get actionable, line-by-line suggestions in the UI.
- **Pull Request Integration**: Connect to your GitHub account to list repositories and analyze open pull requests.
- **Listen to Analysis**: Use the text-to-speech feature to hear an audio report of the suggestions.
- **Exportable Reports**: Download analysis results as a standalone HTML file.

### 🛠️ Built With
- **Framework**: Next.js 14+ & React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS & shadcn/ui
- **Authentication**: Firebase Authentication (Email/Password & GitHub Provider)
- **AI Integration**: Genkit with Google Gemini
- **GitHub API**: Octokit for repository and PR management

## 🏁 Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/deepakpatil26/code-clarity-app.git

# 2. Navigate to the project directory
cd code-clarity-app

# 3. Install dependencies
npm install

# 4. Set up your environment variables
# Create a .env file in the root and add your Firebase project credentials.
# You can get these from your Firebase project settings.
# NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... (and so on for all firebase config values)
# GEMINI_API_KEY=your_gemini_api_key

# 5. Run the development server
npm run dev
```
The app will be available at `http://localhost:9002`.

## 🤝 Contributing

Contributions are welcome! If you have suggestions or want to improve the app, please feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Made with ❤️ by Deepak Patil
</div>
