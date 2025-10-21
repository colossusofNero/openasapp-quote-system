# GitHub & Vercel Setup Guide

## Step 1: Create GitHub Repository (5 minutes)

### Option A: Via GitHub Website (Easiest)
1. Go to https://github.com/new
2. Repository name: `openasapp-quote-system` (or your preferred name)
3. Description: "AI-powered cost segregation quote management system"
4. Choose: **Private** (recommended) or Public
5. **DO NOT** initialize with README, .gitignore, or license (we have these)
6. Click "Create repository"

### Option B: Via GitHub CLI
```bash
gh repo create openasapp-quote-system --private --source=. --remote=origin
```

---

## Step 2: Push to GitHub (3 minutes)

After creating the repository, GitHub will show you commands. Use these:

### Add Git Remote
```bash
cd /c/Users/scott/Claude_Code/OpenAsApp_App
git remote add origin https://github.com/YOUR_USERNAME/openasapp-quote-system.git
```

### Stage All Files
```bash
git add .
```

### Create First Commit
```bash
git commit -m "Initial commit: Complete OpenAsApp quote management system

- Full-stack Next.js 14 application
- Quote calculation engine with Excel logic
- 10 property types, 7 pricing factors
- PostgreSQL + Prisma ORM
- NextAuth.js authentication
- React Query + Tailwind UI
- Complete API with OpenAPI spec
- 25,000+ lines of documentation

Generated with Claude Code"
```

### Push to GitHub
```bash
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Vercel (7 minutes)

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel**
   - Visit https://vercel.com/new
   - Sign in with GitHub

2. **Import Project**
   - Click "Import Project"
   - Select your GitHub repository: `openasapp-quote-system`
   - Click "Import"

3. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `next build` (default)
   - Output Directory: `.next` (default)

4. **Add Environment Variables**
   Click "Environment Variables" and add these:

   ```
   DATABASE_URL=postgresql://...  (get from Railway/Supabase - see below)
   NEXTAUTH_SECRET=your-secret-here  (generate with: openssl rand -base64 32)
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be live at: `https://your-app.vercel.app`

### Option B: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

---

## Step 4: Set Up Production Database (10 minutes)

You need a PostgreSQL database for production. Choose one:

### Option A: Railway (Easiest, $5/month after free trial)

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Provision PostgreSQL"
4. Copy the connection string
5. In Vercel, add environment variable:
   ```
   DATABASE_URL=postgresql://user:pass@host:port/db
   ```

### Option B: Supabase (Free tier available)

1. Go to https://supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy "Connection string" (choose "URI")
5. Add to Vercel environment variables

### Option C: Vercel Postgres ($20/month)

1. In Vercel dashboard → Storage → Create Database
2. Choose Postgres
3. Connection string auto-added to environment variables

---

## Step 5: Run Database Migrations on Production (5 minutes)

After setting up the database:

1. **In Vercel Dashboard:**
   - Go to your project
   - Click "Deployments" → Latest deployment → "..." → "Redeploy"
   - Enable "Clear build cache"
   - This will run migrations during deployment

2. **Or via CLI:**
   ```bash
   # Set production database URL
   export DATABASE_URL="your-production-database-url"

   # Run migrations
   npx prisma migrate deploy

   # Seed database
   npx prisma db seed
   ```

---

## Step 6: Verify Deployment (2 minutes)

1. **Test the app:**
   - Visit your Vercel URL
   - Try signing in: `demo@openasapp.com` / `demo123`
   - Create a test quote

2. **Check logs:**
   - Vercel Dashboard → Your Project → Logs
   - Look for any errors

3. **Test API:**
   ```bash
   curl https://your-app.vercel.app/api/quotes/factors
   ```

---

## Troubleshooting

### Issue: Database Connection Failed
**Solution:**
- Check DATABASE_URL is correct in Vercel environment variables
- Ensure database allows connections from Vercel IPs (Railway/Supabase auto-configure this)
- Redeploy after adding/changing environment variables

### Issue: NextAuth Error
**Solution:**
- Verify NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL matches your Vercel domain
- Must be HTTPS in production

### Issue: Build Failed
**Solution:**
- Check Vercel build logs
- Ensure all dependencies are in package.json
- TypeScript errors may need fixing (see IMMEDIATE_FIXES_REQUIRED.md)

---

## Environment Variables Reference

### Required for Production:

| Variable | Example | How to Get |
|----------|---------|------------|
| `DATABASE_URL` | `postgresql://user:pass@host:port/db` | Railway/Supabase/Vercel Postgres |
| `NEXTAUTH_SECRET` | `abc123...` | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Your Vercel deployment URL |

### Optional (for future features):

| Variable | Purpose |
|----------|---------|
| `SMTP_HOST` | Email sending |
| `SMTP_PORT` | Email sending |
| `SMTP_USER` | Email sending |
| `SMTP_PASSWORD` | Email sending |
| `SENTRY_DSN` | Error tracking |

---

## Cost Summary

### Free Tier (Good for Testing)
- **GitHub:** Free (public or private repos)
- **Vercel Hobby:** Free (100GB bandwidth, serverless functions)
- **Supabase Free:** Free (500MB database, 2GB bandwidth)
- **Total:** $0/month

### Paid Tier (Recommended for Production)
- **GitHub:** Free
- **Vercel Pro:** $20/month
- **Railway Hobby:** $5/month (database)
- **Total:** $25/month

---

## Security Checklist

Before going live:

- [ ] Change default demo password in seed data
- [ ] Set strong NEXTAUTH_SECRET
- [ ] Enable HTTPS only (Vercel does this automatically)
- [ ] Review CORS settings if needed
- [ ] Set up database backups (Railway/Supabase have this built-in)
- [ ] Configure rate limiting (future task)
- [ ] Review error logging

---

## Next Steps After Deployment

1. **Custom Domain** (optional)
   - In Vercel: Settings → Domains → Add Domain
   - Point your domain's DNS to Vercel

2. **CI/CD** (automatic)
   - Every push to `main` branch auto-deploys to production
   - Create `develop` branch for staging environment

3. **Monitoring**
   - Set up Sentry for error tracking
   - Use Vercel Analytics (included)

4. **User Testing**
   - Share URL with team
   - Create real quotes
   - Gather feedback

---

## Quick Commands Reference

```bash
# Local development
npm run dev

# Build for production
npm run build

# Start production server locally
npm start

# Database commands
npm run prisma:migrate     # Run migrations
npm run prisma:seed        # Seed database
npm run prisma:studio      # Open database GUI

# Deploy to Vercel
vercel                     # Deploy to preview
vercel --prod              # Deploy to production
```

---

## Status After Completion

✅ Code on GitHub (version control, backup, collaboration)
✅ App on Vercel (live URL, automatic deployments)
✅ Database in cloud (Railway/Supabase/Vercel)
✅ CI/CD enabled (push to deploy)
✅ HTTPS enabled (automatic with Vercel)
✅ Ready for users!

---

**Estimated Total Time:** 30-40 minutes
**Total Cost:** $0-25/month depending on tier
**Result:** Production-ready app accessible worldwide

🚀 **Let's deploy!**
