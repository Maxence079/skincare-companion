# SkinCare Companion - Deployment Guide

## 🚀 Quick Deploy Options

### Option 1: Deploy to Vercel (Recommended - 5 minutes)

**Why Vercel?**
- Built by Next.js creators
- Zero configuration needed
- Free tier with custom domain
- Automatic HTTPS
- Global CDN
- Perfect for this app

**Steps:**

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   - Follow prompts
   - Choose your project name
   - Deploy!

4. **Set Environment Variables** (in Vercel Dashboard):
   - Go to: https://vercel.com/dashboard
   - Select your project → Settings → Environment Variables
   - Add all variables from `.env.local`:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `ANTHROPIC_API_KEY`
     - `SUPABASE_DB_PASSWORD`
     - `SUPABASE_DB_HOST`
     - `SUPABASE_DB_USER`
     - `SUPABASE_DB_PORT`

5. **Redeploy** after adding env vars:
   ```bash
   vercel --prod
   ```

**Result**: You'll get a URL like `https://skincare-companion.vercel.app`

---

### Option 2: Deploy to Netlify

**Steps:**

1. **Install Netlify CLI**:
   ```bash
   npm i -g netlify-cli
   ```

2. **Login**:
   ```bash
   netlify login
   ```

3. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

4. **Add Environment Variables**:
   - Go to Site settings → Environment variables
   - Add all `.env.local` variables

---

### Option 3: Mobile App (Progressive Web App)

Your Next.js app can be installed as a mobile app! Add PWA support:

**Steps:**

1. **Install next-pwa**:
   ```bash
   npm install next-pwa
   ```

2. **Update `next.config.ts`**:
   ```typescript
   import withPWA from 'next-pwa';

   const nextConfig = withPWA({
     dest: 'public',
     register: true,
     skipWaiting: true,
   })({
     // your existing config
   });

   export default nextConfig;
   ```

3. **Create `public/manifest.json`**:
   ```json
   {
     "name": "SkinCare Companion",
     "short_name": "SkinCare",
     "description": "Your personalized skincare assistant",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#FFFFFF",
     "theme_color": "#6B7F6E",
     "icons": [
       {
         "src": "/icon-192.png",
         "sizes": "192x192",
         "type": "image/png"
       },
       {
         "src": "/icon-512.png",
         "sizes": "512x512",
         "type": "image/png"
       }
     ]
   }
   ```

4. **Deploy to Vercel/Netlify**

5. **Install on Mobile**:
   - Open URL on phone
   - Browser will prompt "Add to Home Screen"
   - Works like a native app!

---

### Option 4: Self-Hosted (Your Own Server)

**For VPS/Cloud Server:**

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm start
   ```

3. **Use PM2 for process management**:
   ```bash
   npm i -g pm2
   pm2 start npm --name "skincare-app" -- start
   pm2 save
   pm2 startup
   ```

4. **Set up Nginx reverse proxy** (optional):
   ```nginx
   server {
     listen 80;
     server_name yourdomain.com;

     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

---

### Option 5: Docker Container

**Create `Dockerfile`**:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

**Build and run**:
```bash
docker build -t skincare-app .
docker run -p 3000:3000 --env-file .env.local skincare-app
```

---

## 🧪 Testing Production Build Locally

Before deploying, test the production build:

```bash
# Build
npm run build

# Start production server
npm start
```

Then visit: http://localhost:3000

---

## 📱 Best Option for Testing on Phone

**Quick Mobile Test:**

1. Deploy to Vercel (5 minutes)
2. Get your URL: `https://your-app.vercel.app`
3. Open on your phone
4. Test everything in real conditions!

**Or use local network:**
```bash
npm run dev
```
Then visit from your phone: `http://YOUR_COMPUTER_IP:3000`
(Find your IP with `ipconfig` on Windows)

---

## ✅ Recommended Path

**For Real Testing:**
1. ✅ Deploy to Vercel (fastest, free, production-ready)
2. ✅ Test on your phone via the Vercel URL
3. ✅ Add PWA support if you want app-like experience
4. ✅ Consider custom domain later

**Want me to help you deploy to Vercel right now?** I can guide you through the process!
