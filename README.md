
# Astra Ledger

Astra Ledger is an AI-powered financial assistant that allows you to track expenses using natural language and image recognition.

## Features

- 💬 **Natural Language Logging**: Type "Spent 500 on dinner" and it automatically parses the amount, category, and item.
- 📸 **Receipt Scanning**: Upload an image of a receipt; the AI extracts the total, merchant, and infers the category.
- 📊 **Smart Dashboard**: Visual analytics of your spending habits.
- 🧠 **AI Coach**: Provides insights based on your spending patterns.
- 💾 **Hybrid Storage**: Works immediately with LocalStorage, or syncs to the cloud if Firebase is configured.

## Getting Started

### Prerequisites

You need a **Google Gemini API Key**.
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Create an API Key.
3. If running locally via Node/Vite, create a `.env` file: `VITE_API_KEY=your_key_here`.
4. If running in a web environment (like StackBlitz/CodeSandbox), ensure the API key is injected into `process.env.API_KEY`.

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/yourusername/astra-ledger.git
   ```
2. Install packages
   ```sh
   npm install
   ```
3. Run Development Server
   ```sh
   npm run dev
   ```

## Cloud Sync (Optional)

By default, the app runs in **Local Mode**, saving data to your browser. To enable cloud sync across devices:

1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** (Select "Anonymous" provider).
3. Enable **Firestore Database** (Start in Test Mode).
4. Open `constants.ts` and replace the `FIREBASE_CONFIG` object with your project keys.

## Tech Stack

- **React 19**
- **Google GenAI SDK** (Gemini 2.5 Flash)
- **Tailwind CSS**
- **Firebase** (Firestore & Auth)
- **Lucide React** (Icons)
- **Recharts** (Analytics)
