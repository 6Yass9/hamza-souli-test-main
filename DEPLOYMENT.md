# Souli Weddings App - Deployment Guide

This guide will help you install the application on your laptop and deploy it to the web.

## 1. Prerequisites

You need **Node.js** installed on your computer.
1. Download Node.js from [nodejs.org](https://nodejs.org/) (Choose the "LTS" version).
2. Install it and restart your terminal/command prompt.

## 2. Local Installation

1. Create a new folder on your computer named `souli-weddings`.
2. Open that folder in your code editor (like VS Code).
3. Initialize a new project:
   ```bash
   npm create vite@latest . -- --template react-ts
   ```
4. Install the required dependencies:
   ```bash
   npm install lucide-react tailwindcss postcss autoprefixer
   ```
5. Initialize Tailwind CSS:
   ```bash
   npx tailwindcss init -p
   ```

## 3. Copying Files

1. Copy the contents of the files provided in this chat into your new project folder, maintaining the structure:
   - `src/components/` (Put all component files here)
   - `src/services/` (Put `api.ts` here)
   - `src/types.ts`
   - `src/App.tsx`
   - `index.html` (Replace the default one in the root folder)

2. Configure Tailwind:
   Update `tailwind.config.js` with the configuration found in the `index.html` script tag from the chat (specifically the `theme` and `content` sections). 
   *Make sure `content` includes `["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]`.*

## 4. Running Locally

Run this command to start the app on your laptop:
```bash
npm run dev
```
Open the link shown (usually `http://localhost:5173`) to view your app.

## 5. Deploying to the Web (Netlify)

The easiest way to put this online for free is **Netlify Drop**.

1. In your project folder, run:
   ```bash
   npm run build
   ```
   This creates a `dist` folder with your final website.

2. Go to [Netlify Drop](https://app.netlify.com/drop).
3. Drag and drop the `dist` folder onto the page.
4. Netlify will publish your site instantly and give you a URL (e.g., `souli-weddings.netlify.app`).

## 6. Important Note on Data

This application currently uses `localStorage` (Browser Storage) to save clients and photos.
- **Pros**: Zero cost, no backend setup required.
- **Cons**: Data is stored **only in your browser**. If you clear cookies or use a different computer, the data won't be there.
- **For Clients**: When a client logs in on *their* device, they won't see data you saved on *your* device unless you upgrade this app to use a real database (like Firebase or Supabase) in the future.
