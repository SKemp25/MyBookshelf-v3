# Sharing MyBookshelf for Review

## Option 1: Deploy to Vercel (Recommended - Free & Easy)

### Via Vercel Website (No CLI needed):

1. **Go to [vercel.com](https://vercel.com)** and sign up/login with GitHub

2. **Click "Add New Project"**

3. **Connect your repository**:
   - If you have the project on GitHub, import it directly
   - OR drag and drop your project folder (you may need to zip it first)

4. **Vercel will auto-detect Next.js** and use your `vercel.json` settings

5. **Click Deploy** - takes ~2-3 minutes

6. **Share the URL** - Vercel gives you a URL like `mybookshelf.vercel.app`

**That's it!** Your friend can access it immediately.

---

## Option 2: Deploy via Vercel CLI

If you prefer command line:

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to your project
cd "/Users/susannakemp/Library/Mobile Documents/com~apple~CloudDocs/AI Projects/AI Projects/MyBookshelf-v3/MyBookshelf-v3"

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Link to existing project? N (first time)
# - Project name? mybookshelf (or whatever you want)
# - Deploy to production? Y
```

---

## Option 3: Quick Local Sharing with ngrok (For Quick Testing)

If you want to share your local dev server temporarily:

```bash
# Install ngrok
brew install ngrok

# Start your dev server in one terminal
npm run dev

# In another terminal, expose it
ngrok http 3000
```

ngrok will give you a public URL like `https://abc123.ngrok.io` that anyone can access.

**Note:** This only works while your computer is running the dev server.

---

## Option 4: Deploy to Netlify (Alternative)

1. Go to [netlify.com](https://netlify.com) and sign up
2. Drag and drop your project folder
3. Build settings (auto-detected for Next.js):
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Click "Deploy site"

---

## Which Option Should You Choose?

- **Option 1 (Vercel)** - Best for permanent sharing, free, easy
- **Option 3 (ngrok)** - Best for quick testing while developing
- **Option 4 (Netlify)** - Good alternative if you prefer Netlify

---

## Before Sharing - Quick Checklist

- [ ] Test the app locally: `npm run dev`
- [ ] Make sure it builds: `npm run build`
- [ ] Check if you need any API keys or environment variables
- [ ] Remove any sensitive data from the code

---

## Sharing the URL

Once deployed, share the URL with your friend! They can:
- View it in their browser
- Test all features
- Give you feedback

**Tip:** Vercel deployments update automatically when you push to GitHub (if you connect a repo).
