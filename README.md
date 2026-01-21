# VolleyBrain Admin Portal

A web-based administration dashboard for VolleyBrain league management.

## Features

- 🏢 **Organization Setup Wizard** - First-time league setup
- 📄 **Waiver Management** - Create and edit waiver documents
- 💳 **Payment Setup** - Configure Stripe, Venmo, Zelle, Cash App
- 📅 **Season Management** - Create and manage seasons
- 📊 **Dashboard** - Overview of league stats
- ⚙️ **Settings** - Organization and account settings

## Tech Stack

- **React 18** - UI Framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Supabase** - Backend (shared with mobile app)
- **Lucide React** - Icons

## Quick Start

### 1. Install Dependencies

```bash
cd volleybrain-admin
npm install
```

### 2. Configure Environment

Copy the example environment file and update if needed:

```bash
cp .env.example .env
```

The default values should work with your existing Supabase project.

### 3. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

## Deployment Options

### Option A: Vercel (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Set environment variables in Vercel dashboard
5. Deploy!

Your site will be available at `your-project.vercel.app`

### Option B: GitHub Pages

1. Add homepage to package.json:
   ```json
   "homepage": "https://yourusername.github.io/volleybrain-admin"
   ```

2. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

3. Add deploy script to package.json:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

### Option C: Netlify

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Connect your repository
4. Set build command: `npm run build`
5. Set publish directory: `dist`
6. Deploy!

## Database Requirements

This portal uses the same Supabase database as your mobile app. Make sure you have:

- `organizations` table with `settings` JSONB column
- `user_roles` table with `league_admin` role
- `seasons` table
- `profiles` table

### Add Waivers Support

If you don't have a settings column on organizations, run this SQL:

```sql
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
```

## Login

Use your existing VolleyBrain credentials. Only users with `league_admin` role can access this portal.

## Support

For issues or feature requests, contact: support@volleybrain.app
