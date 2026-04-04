# Prism - Premium Image Sharing

A modern, premium image sharing web application where users can discover, upload, and manage high-quality images.

## 🚀 Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4, Lucide React (Icons), Motion (Animations)
- **Authentication & Database:** Firebase (Auth, Firestore)
- **File Storage:** Supabase Storage
- **AI Integration:** Google Gemini AI

## 📦 Prerequisites

Make sure you have the following installed and configured:
- [Node.js](https://nodejs.org/) (v18 or higher)
- A [Firebase Project](https://console.firebase.google.com/) (with Authentication and Firestore enabled)
- A [Supabase Project](https://supabase.com/) (with a storage bucket named `images`)

## 🛠️ Local Environment Setup

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase:**
   Ensure your Firebase credentials are correctly set in the `firebase-applet-config.json` file in the root directory. This configures the Firebase connection to your app.

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL="your-supabase-project-url"
   VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

The application will be running locally. Open your browser and navigate to the local URL provided by Vite (typically `http://localhost:3000` or `http://localhost:5173`).

## 🔑 Key Features
- **User Authentication:** Sign up, log in smoothly using Firebase Auth (including Google Sign-In).
- **Cloud Storage:** Fast and secure image uploads powered by Supabase Storage.
- **Premium UI:** Dynamic and highly responsive user interface.
