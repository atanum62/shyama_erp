# Shyama ERP

A premium Enterprise Resource Planning system built with Next.js, MongoDB, and Cloudinary.

## Tech Stack
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes, Mongoose (MongoDB)
- **Storage**: Cloudinary (Abstracted for future Cloudflare R2 migration)
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Getting Started

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Setup Environment Variables**:
    Copy `.env.example` to `.env` and fill in your credentials.
    ```bash
    cp .env.example .env
    ```
4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## Project Structure

- `src/app`: Routes and API endpoints.
- `src/components`: React components (UI/UX).
- `src/lib`: Utilities and abstractions (DB, Storage, cn).
- `src/models`: Mongoose schemas for MongoDB.
- `src/services`: Business logic (optional layer for growth).

## Production Deployment (Render)

1.  Connect your GitHub repository to [Render](https://render.com).
2.  Select **Web Service**.
3.  Set **Build Command**: `npm install && npm run build`
4.  Set **Start Command**: `npm run start`
5.  Add **Environment Variables** in Render Dashboard:
    - `MONGODB_URI`
    - `CLOUDINARY_CLOUD_NAME`
    - `CLOUDINARY_API_KEY`
    - `CLOUDINARY_API_SECRET`
    - `NEXT_PUBLIC_APP_URL`

## Future-Proofing
The storage logic is abstracted in `src/lib/storage.ts`. To switch to Cloudflare R2 or Images, simply update the implementation in that file to maintain compatibility across the app.



admin@example.com
password123


Email: sumanta@shyama.com
Password: password@2026