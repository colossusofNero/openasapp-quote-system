# OpenAsApp - Quick Reference Guide

## 🎯 Project At a Glance

**Goal:** Build a web app that mimics Excel quote functionality + PDF parser + ChatGPT integration

**Timeline:** 12 weeks

**Team Structure:** 31 AI agents (1 Chief + 6 Domain + 24 Task agents)

**Tech Stack:** Next.js 14, TypeScript, Prisma, Vercel Postgres, OpenAI

---

## 📋 Quick Links

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [README.md](./README.md) | Project overview | First time setup |
| [GETTING_STARTED.md](./GETTING_STARTED.md) | Setup instructions | Day 1 |
| [PROJECT_ROADMAP.md](./PROJECT_ROADMAP.md) | 12-week timeline | Planning & tracking |
| [AGENT_HIERARCHY.md](./AGENT_HIERARCHY.md) | Agent system overview | Understanding roles |
| [LEVEL_1_CHIEF_ARCHITECT_SPEC.md](./LEVEL_1_CHIEF_ARCHITECT_SPEC.md) | Strategic oversight | Architecture decisions |
| [LEVEL_2_AGENTS_SPECS.md](./LEVEL_2_AGENTS_SPECS.md) | Domain specialists | Feature development |
| [LEVEL_3_AGENTS_SPECS.md](./LEVEL_3_AGENTS_SPECS.md) | Task specialists | Implementation details |

---

## 🏗️ Three-Level Agent Hierarchy

```
                    ┌─────────────────────────────────┐
                    │   Level 1: Chief Architect      │
                    │   - Overall coordination        │
                    │   - Architecture decisions      │
                    │   - Quality assurance          │
                    └────────────┬────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
     ┌──────────▼─────┐  ┌──────▼──────┐  ┌─────▼──────┐
     │  Level 2 Agent │  │ Level 2 Agent│  │ Level 2 ... │
     │  (6 total)     │  │              │  │             │
     └────────┬───────┘  └──────┬───────┘  └─────┬──────┘
              │                 │                  │
       ┌──────┼──────┐   ┌──────┼──────┐   ┌──────┼──────┐
   ┌───▼──┐┌──▼─┐┌───▼┐┌─▼──┐┌──▼─┐┌───▼┐┌─▼──┐┌──▼─┐
   │Level3││L3  ││L3  ││L3  ││L3  ││L3  ││L3  ││L3  │
   │Agent ││    ││    ││    ││    ││    ││    ││    │
   └──────┘└────┘└────┘└────┘└────┘└────┘└────┘└────┘

   (24 Level 3 Agents total, 4 under each Level 2 Agent)
```

### Level 1: Chief Architect (1 Agent)
- **Role:** Strategic oversight & integration
- **Focus:** Architecture, coordination, quality
- **Reports to:** Stakeholder (You)

### Level 2: Domain Specialists (6 Agents)
1. **Backend Infrastructure** - APIs, database, auth
2. **Frontend Application** - UI, components, state
3. **Quote Engine** - Calculations, templates, exports
4. **PDF Parser** - Parsing, extraction, OCR
5. **ChatGPT Integration** - GPT Actions, OAuth
6. **DevOps & Deployment** - CI/CD, monitoring

### Level 3: Task Specialists (24 Agents)
4 specialized agents under each Level 2 agent

---

## 🗓️ 12-Week Timeline

```
Weeks 1-2:  Foundation          🏗️  Setup, database, auth, core APIs
Weeks 3-6:  Core Development    ⚙️  Quote system, PDF parser, exports
Weeks 7-8:  Integration         🔗  Testing, security, polish
Weeks 9-10: ChatGPT Integration 🤖  GPT Actions, OAuth, submission
Weeks 11-12: Launch            🚀  Deploy, monitor, support
```

### Week-by-Week Breakdown

| Week | Focus | Key Deliverables |
|------|-------|------------------|
| 1 | Infrastructure | Next.js app, database, auth |
| 2 | Foundation | API endpoints, frontend setup, calculator |
| 3 | Quote Management | Create/edit quotes, forms |
| 4 | Templates & Export | Templates, PDF/Excel export |
| 5 | PDF Parser | PDF upload, extraction, mapping |
| 6 | Enhancement | Advanced features, performance |
| 7 | Integration Testing | E2E tests, bug fixes |
| 8 | Security & QA | Security audit, final QA |
| 9 | GPT Development | GPT endpoints, OAuth |
| 10 | GPT Testing | Testing, submission prep |
| 11 | Pre-Launch | Production deploy, monitoring |
| 12 | Launch | Public launch, support |

---

## 🎯 Core Features

### 1️⃣ Quote Management
```
Create Quote → Add Items → Calculate → Export → Send
    ↓           ↓           ↓          ↓        ↓
  Client    Line Items    Tax &    PDF/Excel  Email
   Info      Qty×Price   Discount
```

**Key Capabilities:**
- Dynamic line items
- Real-time calculations
- Tax and discount handling
- Quote versioning
- Status tracking (Draft, Sent, Accepted, etc.)

### 2️⃣ Template System
```
Create Template → Save Items → Apply to Quote → Customize
       ↓              ↓             ↓               ↓
   Name & Desc   Default Items  Pre-fill Form   Adjust
```

**Key Capabilities:**
- Reusable templates
- Variable substitution
- Default settings
- Categories

### 3️⃣ PDF Parser
```
Upload PDF → Extract Text → Parse Data → Review → Create Quote
     ↓           ↓             ↓          ↓          ↓
   File       Raw Text     Structured  Manual   Editable
              (Tables)       Data      Fixes     Quote
```

**Key Capabilities:**
- Text extraction
- Table detection
- Pattern recognition
- Confidence scoring
- Manual correction

### 4️⃣ Export Options
```
Quote → Select Format → Generate → Download/Send
  ↓          ↓            ↓           ↓
Data    PDF/Excel/CSV  Process    Deliver
```

**Formats:**
- PDF (professional layout)
- Excel (editable spreadsheet)
- CSV (data export)
- Email (with attachments)

### 5️⃣ ChatGPT Integration
```
User Message → GPT Action → API Call → Response → GPT Reply
     ↓             ↓           ↓          ↓          ↓
 "Create      OAuth Auth   Quote API   JSON     Formatted
  quote..."                               Result   Message
```

**Capabilities:**
- Create quotes via chat
- Parse PDFs through conversation
- List and manage quotes
- Natural language interface

---

## 🛠️ Tech Stack Summary

### Frontend
| Technology | Purpose | Why |
|------------|---------|-----|
| Next.js 14 | Framework | SSR, routing, API routes |
| TypeScript | Language | Type safety |
| Tailwind CSS | Styling | Utility-first CSS |
| shadcn/ui | Components | Accessible, customizable |
| Zustand | State | Lightweight state management |
| React Hook Form | Forms | Performance, validation |
| Zod | Validation | Type-safe schemas |

### Backend
| Technology | Purpose | Why |
|------------|---------|-----|
| Next.js API Routes | API | Serverless functions |
| Prisma | ORM | Type-safe database access |
| Vercel Postgres | Database | Serverless, scalable |
| NextAuth.js | Auth | OAuth, JWT support |
| pdf-parse | PDF parsing | Text extraction |
| PDFKit | PDF generation | Create PDFs |
| ExcelJS | Excel export | Create spreadsheets |

### Infrastructure
| Technology | Purpose | Why |
|------------|---------|-----|
| Vercel | Hosting | Zero-config deployment |
| GitHub Actions | CI/CD | Automated testing/deploy |
| Sentry | Monitoring | Error tracking |
| Vercel Blob | Storage | File uploads |

---

## 📊 Database Schema (Simplified)

```
┌─────────────┐
│    User     │
├─────────────┤
│ id          │◄──┐
│ email       │   │
│ name        │   │
│ role        │   │
└─────────────┘   │
                  │
┌─────────────┐   │
│   Quote     │   │
├─────────────┤   │
│ id          │   │
│ quoteNumber │   │
│ userId      │───┘
│ clientName  │
│ status      │
│ totalAmount │
│ items       │───┐
└─────────────┘   │
                  │
┌─────────────┐   │
│  QuoteItem  │   │
├─────────────┤   │
│ id          │   │
│ quoteId     │◄──┘
│ description │
│ quantity    │
│ unitPrice   │
│ discount    │
│ lineTotal   │
└─────────────┘

┌─────────────┐
│  Template   │
├─────────────┤
│ id          │
│ userId      │
│ name        │
│ items (JSON)│
│ isDefault   │
└─────────────┘

┌─────────────┐
│ ParsedPdf   │
├─────────────┤
│ id          │
│ userId      │
│ fileName    │
│ extractedText│
│ parsedData  │
│ confidence  │
└─────────────┘
```

---

## 🔑 Key API Endpoints

### Authentication
```
POST   /api/auth/signin          Login
POST   /api/auth/register         Register
POST   /api/auth/refresh          Refresh token
```

### Quotes
```
GET    /api/quotes               List quotes
POST   /api/quotes               Create quote
GET    /api/quotes/:id           Get quote
PUT    /api/quotes/:id           Update quote
DELETE /api/quotes/:id           Delete quote
POST   /api/quotes/export        Export quote
```

### Templates
```
GET    /api/templates            List templates
POST   /api/templates            Create template
GET    /api/templates/:id        Get template
PUT    /api/templates/:id        Update template
DELETE /api/templates/:id        Delete template
```

### PDF
```
POST   /api/pdf/parse            Parse PDF
POST   /api/pdf/extract          Extract quote data
```

### GPT Actions
```
POST   /api/gpt/quote/create     Create quote (GPT)
GET    /api/gpt/quote/list       List quotes (GPT)
POST   /api/gpt/pdf/parse        Parse PDF (GPT)
```

### OAuth
```
GET    /api/oauth/authorize      OAuth authorization
POST   /api/oauth/token          Token exchange
```

---

## 🚦 Development Workflow

### Daily Routine
```
Morning:
├─ git pull origin main
├─ npx prisma migrate dev
├─ npm run dev
└─ Review daily tasks

Development:
├─ Create feature branch
├─ Make changes
├─ npm test
├─ npm run type-check
├─ git commit -m "feat: ..."
└─ git push

Evening:
├─ Update standup notes
├─ Push all changes
└─ Update task board
```

### Testing Checklist
```
Before Commit:
☐ npm test (unit tests)
☐ npm run type-check (TypeScript)
☐ npm run lint (ESLint)
☐ npm run format (Prettier)

Before PR:
☐ All tests passing
☐ No TypeScript errors
☐ Code formatted
☐ Documentation updated

Before Deploy:
☐ Integration tests passing
☐ E2E tests passing
☐ Security audit clear
☐ Performance benchmarks met
```

---

## 📈 Success Metrics

### Technical
- API response time: **<200ms**
- Page load time: **<2s**
- Lighthouse score: **>90**
- Test coverage: **>80%**
- Uptime: **99.9%**

### Business
- User signups: **100+**
- Quotes created: **500+**
- PDFs parsed: **200+**
- User satisfaction: **>4.5/5**
- Quote creation time: **<2 min**
- PDF parse accuracy: **>95%**

### Development
- Sprint velocity: **Consistent**
- Bug resolution: **<48 hours**
- PR review time: **<24 hours**
- Code quality: **A grade**
- Documentation: **100%**

---

## 🎨 UI/UX Guidelines

### Design Principles
1. **Simplicity** - Clean, uncluttered interface
2. **Speed** - Fast interactions, instant feedback
3. **Clarity** - Clear labels, obvious actions
4. **Consistency** - Uniform patterns throughout
5. **Accessibility** - WCAG 2.1 AA compliant

### Color Palette
```
Primary:   #2563EB (Blue)
Secondary: #10B981 (Green)
Accent:    #F59E0B (Amber)
Error:     #EF4444 (Red)
Gray:      #6B7280 (Neutral)
```

### Typography
```
Headings:  font-semibold, text-2xl/xl/lg
Body:      font-normal, text-base
Small:     font-normal, text-sm
Mono:      font-mono (for numbers/code)
```

---

## 🔒 Security Checklist

### Authentication
- [x] Secure password hashing (bcrypt)
- [x] JWT with expiration
- [x] Session management
- [x] Protected routes
- [x] OAuth 2.0 flow

### Data Protection
- [x] Input validation (Zod)
- [x] SQL injection prevention (Prisma)
- [x] XSS protection
- [x] CSRF tokens
- [x] Rate limiting
- [x] HTTPS/TLS

### API Security
- [x] Authentication required
- [x] Authorization checks
- [x] Request validation
- [x] Error handling (no info leak)
- [x] Rate limiting
- [x] CORS configuration

---

## 🐛 Troubleshooting Quick Fixes

### Database Issues
```bash
# Reset database
npx prisma migrate reset

# Regenerate client
npx prisma generate

# Check connection
npx prisma db push
```

### Build Issues
```bash
# Clear cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check types
npm run type-check
```

### Deployment Issues
```bash
# Check environment variables
vercel env ls

# View logs
vercel logs

# Redeploy
vercel --prod --force
```

---

## 📞 Quick Support

### Common Issues

**Issue:** "Prisma Client not generated"
**Fix:** `npx prisma generate`

**Issue:** "Database connection failed"
**Fix:** Check `DATABASE_URL` in `.env.local`

**Issue:** "NextAuth session not working"
**Fix:** Verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL`

**Issue:** "API route 404"
**Fix:** Ensure file is named `route.ts` in `app/api/`

**Issue:** "TypeScript errors"
**Fix:** `npx prisma generate && npm run type-check`

### Resources
- **Documentation:** See [README.md](./README.md)
- **Issues:** GitHub Issues
- **Questions:** GitHub Discussions

---

## ✅ Pre-Flight Checklist

### Before Starting Development
- [ ] Node.js 20+ installed
- [ ] Git configured
- [ ] GitHub account created
- [ ] Vercel account created
- [ ] VS Code (or IDE) ready
- [ ] All documentation reviewed

### Before First Commit
- [ ] Git initialized
- [ ] .gitignore configured
- [ ] README updated
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Dev server running

### Before Deployment
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Environment variables in Vercel
- [ ] Database migrations ready
- [ ] Monitoring configured
- [ ] Documentation complete

### Before Launch
- [ ] Security audit complete
- [ ] Performance optimized
- [ ] User testing done
- [ ] Marketing ready
- [ ] Support system ready
- [ ] Monitoring active

---

## 🎉 You're Ready!

**Next Steps:**
1. Read [GETTING_STARTED.md](./GETTING_STARTED.md)
2. Follow setup instructions
3. Start with Week 1 tasks
4. Review daily progress
5. Coordinate with agent teams

**Remember:**
- This is a marathon, not a sprint
- Quality over speed
- Test everything
- Document as you go
- Ask for help when needed

**Good luck! 🚀**

---

**Quick Access Commands:**

```bash
# Start development
npm run dev

# Run tests
npm test

# Check types
npm run type-check

# Database GUI
npx prisma studio

# Deploy
vercel --prod
```

---

**Last Updated:** 2025-10-20
**Version:** 1.0
