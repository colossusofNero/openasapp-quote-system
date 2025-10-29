# OpenAsApp - AI-Powered Quote Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-Latest-brightgreen.svg)](https://www.prisma.io/)

> A modern web application that combines Excel-based quote functionality with intelligent PDF parsing, deployable to Vercel and integrable with ChatGPT.

---

## 🎯 Project Overview

OpenAsApp is a comprehensive quote management system that:
- **Creates professional quotes** with automatic calculations, templates, and export options
- **Parses PDF documents** to extract quote data intelligently
- **Integrates with ChatGPT** via OpenAI GPT Actions for conversational quote management
- **Mimics Excel functionality** while providing a superior web-based experience

### Key Features

✅ **Quote Management**
- Create, edit, and track quotes
- Dynamic line items with real-time calculations
- Tax and discount handling
- Quote versioning and status tracking

✅ **Template System**
- Reusable quote templates
- Variable substitution
- Default and custom templates
- Template categories

✅ **PDF Parser**
- Extract data from PDF quotes
- Table detection and parsing
- Confidence scoring
- Manual review workflow

✅ **Export Options**
- PDF generation
- Excel export
- CSV export
- Email integration

✅ **ChatGPT Integration**
- Create quotes via conversation
- Parse PDFs through chat
- List and manage quotes
- OAuth 2.0 secured

---

## 📚 Documentation

### Getting Started
- **[Getting Started Guide](./GETTING_STARTED.md)** - Setup instructions and first steps
- **[Project Roadmap](./PROJECT_ROADMAP.md)** - 12-week development timeline

### Agent Hierarchy
- **[Agent Hierarchy Overview](./AGENT_HIERARCHY.md)** - Three-level agent system
- **[Level 1: Chief Architect](./LEVEL_1_CHIEF_ARCHITECT_SPEC.md)** - Strategic oversight
- **[Level 2: Domain Specialists](./LEVEL_2_AGENTS_SPECS.md)** - 6 specialized agents
- **[Level 3: Task Agents](./LEVEL_3_AGENTS_SPECS.md)** - 24 task-specific agents

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- Next.js 14+ (React 18+)
- TypeScript 5.0+
- Tailwind CSS + shadcn/ui
- Zustand (State Management)
- React Hook Form + Zod

**Backend:**
- Next.js API Routes
- Prisma ORM
- Vercel Postgres
- NextAuth.js (Authentication)

**External Services:**
- OpenAI API (ChatGPT)
- Vercel Blob (File Storage)
- Resend/SendGrid (Email)
- Sentry (Error Tracking)

### System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   Quotes    │  │  Templates   │  │    PDF     │ │
│  │     UI      │  │      UI      │  │  Parser UI │ │
│  └─────────────┘  └──────────────┘  └────────────┘ │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              API Layer (Next.js API Routes)         │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌───────┐│
│  │  Quote  │  │ Template │  │   PDF   │  │  GPT  ││
│  │   API   │  │   API    │  │ Parser  │  │ Actions││
│  └─────────┘  └──────────┘  └─────────┘  └───────┘│
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                 Business Logic Layer                │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │    Quote     │  │   Template   │  │    PDF    │ │
│  │ Calculation  │  │    Engine    │  │  Parser   │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              Data Layer (Prisma + Postgres)         │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌───────┐│
│  │ Quotes  │  │Templates │  │  Users  │  │ Audit ││
│  │  Table  │  │  Table   │  │  Table  │  │  Log  ││
│  └─────────┘  └──────────┘  └─────────┘  └───────┘│
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Git
- Vercel account
- GitHub account

### Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/openasapp.git
cd openasapp

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Quote parity form (client-only)

The `/quote` route provides a standalone form that mirrors the OpenAsApp "Quote" experience using React Hook Form and Zod. To exercise it locally:

1. Run `npm run dev`.
2. Open [http://localhost:3000/quote](http://localhost:3000/quote) to enter quote inputs.
3. Submit the form to navigate to `/quote/preview`, which renders the calculated outputs in a summary card.

#### Field checklist

| Field | Type | Validation highlights |
| --- | --- | --- |
| Name of Prospect | Text | 3–120 characters, required |
| Address of Property | Text | 5–200 characters, required |
| ZIP Code | Text | Exactly five numeric digits |
| Tax Year | Number | Integer between 2000 and 2100 |
| Tax Deadline | Select | One of the 12 calendar months |
| Purchase Price | Currency | Required, $50,000–$50,000,000 |
| Capital Improvements | Toggle + Currency | When “Yes”, amount required ($0–$10,000,000) |
| Land Value | Percentage | 0–80%, two decimal precision |
| 1031 Exchange | Toggle + Currency | When “Yes”, accumulated depreciation required ($0–$10,000,000) |
| SqFt Building | Number | 100–1,000,000 sqft |
| Acres Land | Decimal | 0.01–100 acres |
| Property Type | Select | Must match OpenAsApp property list |
| Number of Floors | Number | 1–40 |
| Multiple Properties | Number | 1–50 |
| Need a Rush? | Select | `no_rush` or `rush` (adds $1,500) |
| Year Built | Number | 1900–current year |
| Price Override | Toggle + Currency | When “Yes”, override amount $1,000–$1,000,000 |

#### Calculations shown on `/quote/preview`

- Base cost segregation bid, natural log quote, multiple properties quote, and cost method floor
- Final bid selection with manual override + optional rush fee
- 50/50 (base bid) and monthly (20% premium) payment options with installment totals
- Bonus depreciation snapshot (land, building, and first-year bonus)
- Factor breakdown (cost basis, ZIP, square footage, acreage, property type, floors, multiple properties)

### Default Credentials

```
Email: admin@openasapp.com
Password: admin123
```

**⚠️ Change these in production!**

---

## 📖 Usage

### Creating a Quote

1. **Navigate to Quotes** → Click "New Quote"
2. **Enter client information:**
   - Client name (required)
   - Email, phone, address (optional)
3. **Add line items:**
   - Description, quantity, unit price
   - Optional discount percentage
4. **Configure:**
   - Tax rate
   - Notes/terms
   - Valid until date
5. **Save** as draft or send to client

### Using Templates

1. **Create Template:**
   - Save frequently used line items
   - Set default tax rates and notes
2. **Apply Template:**
   - Select template when creating quote
   - Customize as needed
3. **Manage Templates:**
   - Edit, duplicate, or delete templates

### Parsing PDFs

1. **Upload PDF:**
   - Drag and drop or click to browse
2. **Review Extracted Data:**
   - Verify client information
   - Check line items
   - Validate totals
3. **Correct if Needed:**
   - Manual adjustments supported
4. **Create Quote:**
   - Convert to editable quote

### ChatGPT Integration

1. **Find OpenAsApp in ChatGPT:**
   - Search GPT Store for "OpenAsApp"
2. **Authenticate:**
   - Follow OAuth flow
3. **Create quotes via chat:**
   ```
   Create a quote for Acme Corp with:
   - Web design: 40 hours at $150/hour
   - Development: 80 hours at $150/hour
   - Apply 10% discount
   ```

---

## 🧪 Development

### Project Structure

```
openasapp/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── (auth)/            # Auth pages
│   │   ├── (dashboard)/       # Dashboard pages
│   │   ├── api/               # API routes
│   │   └── layout.tsx
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   ├── forms/            # Form components
│   │   ├── quote/            # Quote components
│   │   └── pdf/              # PDF components
│   ├── lib/                   # Utility libraries
│   │   ├── auth/             # Auth helpers
│   │   ├── database/         # DB utilities
│   │   ├── quote-engine/     # Quote logic
│   │   ├── pdf-parser/       # PDF parsing
│   │   └── exporters/        # Export utilities
│   ├── stores/                # State management
│   └── types/                 # TypeScript types
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── migrations/           # DB migrations
│   └── seed.ts               # Seed data
├── public/                    # Static assets
├── __tests__/                 # Tests
└── docs/                      # Documentation
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # TypeScript check
npm run format          # Format code with Prettier

# Database
npx prisma studio       # Open database GUI
npx prisma generate     # Generate Prisma client
npx prisma migrate dev  # Run migrations
npx prisma db seed      # Seed database

# Testing
npm test                # Run tests
npm run test:ci         # Run tests with coverage

# Deployment
vercel                  # Deploy to preview
vercel --prod          # Deploy to production
```

---

## 🧑‍💻 Agent System

This project uses a unique three-level agent hierarchy for development:

### Level 1: Chief Architect
- Overall system coordination
- Architecture decisions
- Quality assurance
- OpenAI submission management

### Level 2: Domain Specialists (6 Agents)
1. **Backend Infrastructure Agent** - API, database, auth
2. **Frontend Application Agent** - UI, components, state
3. **Quote Engine Agent** - Calculations, templates, exports
4. **PDF Parser Agent** - Parsing, extraction, OCR
5. **ChatGPT Integration Agent** - GPT Actions, OAuth
6. **DevOps & Deployment Agent** - CI/CD, monitoring

### Level 3: Task Specialists (24 Agents)
Specialized agents for specific tasks under each Level 2 agent.

**See [AGENT_HIERARCHY.md](./AGENT_HIERARCHY.md) for complete details.**

---

## 📊 Project Timeline

### Phase 1: Foundation (Weeks 1-2)
- Project setup
- Database schema
- Authentication
- Core APIs

### Phase 2: Core Development (Weeks 3-6)
- Quote management
- Templates
- PDF parsing
- Export functionality

### Phase 3: Integration (Weeks 7-8)
- End-to-end testing
- Security audit
- Performance optimization
- Polish

### Phase 4: ChatGPT Integration (Weeks 9-10)
- GPT Actions development
- OAuth implementation
- Testing
- OpenAI submission

### Phase 5: Launch (Weeks 11-12)
- Production deployment
- Monitoring setup
- Beta testing
- Public launch

**See [PROJECT_ROADMAP.md](./PROJECT_ROADMAP.md) for detailed timeline.**

---

## 🔒 Security

### Authentication
- JWT-based authentication via NextAuth.js
- Session management
- Role-based access control (RBAC)
- API key support for programmatic access

### Data Protection
- Encrypted passwords (bcrypt)
- HTTPS/TLS in production
- CORS protection
- Rate limiting
- Input validation (Zod)
- SQL injection prevention (Prisma)
- XSS protection

### OAuth 2.0
- Secure OAuth flow for ChatGPT
- Token-based authorization
- Scope-based permissions

---

## 🧪 Testing

### Unit Tests
```bash
npm test                        # Run unit tests
npm run test:coverage          # With coverage report
```

### Integration Tests
```bash
npm run test:integration       # API integration tests
```

### E2E Tests
```bash
npm run test:e2e              # End-to-end tests (Playwright)
```

### Test Coverage Goals
- Unit tests: >80%
- Integration tests: >70%
- E2E tests: Critical paths covered

---

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository:**
   ```bash
   vercel link
   ```

2. **Configure Environment:**
   ```bash
   # Set environment variables in Vercel dashboard or:
   vercel env add DATABASE_URL production
   vercel env add NEXTAUTH_SECRET production
   # ... add all required env vars
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

### Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_URL="https://openasapp.com"
NEXTAUTH_SECRET="your-secret-here"

# OpenAI
OPENAI_API_KEY="sk-..."
OPENAI_CLIENT_ID="your-client-id"
OPENAI_CLIENT_SECRET="your-client-secret"

# Storage
BLOB_READ_WRITE_TOKEN="vercel-blob-token"

# Email
RESEND_API_KEY="re_..."
EMAIL_FROM="quotes@openasapp.com"

# Monitoring (optional)
SENTRY_DSN="..."
```

---

## 📈 Monitoring

### Error Tracking
- **Sentry** for error and performance monitoring
- Real-time error notifications
- Source map support

### Analytics
- **Vercel Analytics** for web vitals
- Custom event tracking
- User flow analysis

### Performance
- Lighthouse CI
- Core Web Vitals tracking
- API response time monitoring

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork the repository**
2. **Create feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make changes and test:**
   ```bash
   npm test
   npm run type-check
   npm run lint
   ```
4. **Commit with conventional commits:**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
5. **Push and create PR:**
   ```bash
   git push origin feature/amazing-feature
   ```

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

**Types:** feat, fix, docs, style, refactor, test, chore

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Next.js** - Amazing React framework
- **Prisma** - Excellent ORM
- **shadcn/ui** - Beautiful components
- **Vercel** - Seamless deployment
- **OpenAI** - ChatGPT integration

---

## 📞 Support

### Documentation
- [Getting Started](./GETTING_STARTED.md)
- [Project Roadmap](./PROJECT_ROADMAP.md)
- [Agent Hierarchy](./AGENT_HIERARCHY.md)

### Community
- GitHub Issues: [Report bugs](https://github.com/YOUR_USERNAME/openasapp/issues)
- GitHub Discussions: [Ask questions](https://github.com/YOUR_USERNAME/openasapp/discussions)

### Contact
- Email: support@openasapp.com
- Twitter: [@openasapp](https://twitter.com/openasapp)

---

## 🗺️ Roadmap

### v1.0 (Current)
- ✅ Quote management
- ✅ PDF parsing
- ✅ Export functionality
- ✅ ChatGPT integration

### v2.0 (Planned)
- [ ] Advanced analytics
- [ ] Team collaboration
- [ ] Mobile app
- [ ] Integrations (Stripe, QuickBooks)
- [ ] AI-powered suggestions
- [ ] Multi-language support

---

## 📊 Project Status

| Component | Status | Coverage |
|-----------|--------|----------|
| Backend API | 🟡 In Progress | - |
| Frontend UI | 🟡 In Progress | - |
| Quote Engine | 🟡 In Progress | - |
| PDF Parser | 🟡 In Progress | - |
| ChatGPT Integration | ⚪ Planned | - |
| Documentation | 🟢 Complete | 100% |

**Legend:** 🟢 Complete | 🟡 In Progress | ⚪ Planned | 🔴 Blocked

---

## 🎉 Get Started Now!

```bash
git clone https://github.com/YOUR_USERNAME/openasapp.git
cd openasapp
npm install
npm run dev
```

**Then visit [http://localhost:3000](http://localhost:3000)**

---

**Built with ❤️ by the OpenAsApp Team**

⭐ Star us on GitHub if you find this project helpful!
“Deployed via PR preview ✅”.

[View on GitHub](https://github.com/YOUR_USERNAME/openasapp) | [Report Bug](https://github.com/YOUR_USERNAME/openasapp/issues) | [Request Feature](https://github.com/YOUR_USERNAME/openasapp/issues)
