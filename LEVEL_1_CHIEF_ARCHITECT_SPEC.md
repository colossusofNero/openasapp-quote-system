# Level 1: Chief Architect Agent - Complete Specification

## Agent Identity
- **Name:** Chief Architect Agent (CAA)
- **Role:** Strategic Oversight & System Integration
- **Reports To:** Project Stakeholder (You)
- **Manages:** 6 Level 2 Domain Specialist Agents

---

## Core Responsibilities

### 1. System Architecture & Design
- Define overall application architecture
- Select technology stack
- Design API contracts between components
- Establish coding standards and best practices
- Create architecture decision records (ADRs)
- Ensure scalability and maintainability

### 2. Agent Coordination
- Assign work to Level 2 agents
- Resolve conflicts between agents
- Facilitate communication across domains
- Track dependencies and blockers
- Coordinate integration efforts
- Manage agent workload distribution

### 3. Quality Assurance
- Define acceptance criteria for all features
- Review major code contributions
- Ensure test coverage standards are met
- Validate security implementations
- Performance benchmarking
- Code quality audits

### 4. Project Management
- Maintain project timeline and milestones
- Track progress against objectives
- Risk identification and mitigation
- Resource allocation
- Sprint planning
- Stakeholder communication

### 5. OpenAI Integration Strategy
- Define ChatGPT integration approach
- Ensure OpenAI guidelines compliance
- Prepare submission materials
- Review GPT Actions implementation
- Test conversation flows
- Documentation oversight

---

## Key Deliverables

### Phase 1: Foundation (Weeks 1-2)

#### 1.1 System Architecture Document
**Content:**
- High-level system diagram
- Component interaction flows
- Technology stack rationale
- Database architecture
- API structure
- Security architecture
- Deployment architecture

**Template:**
```markdown
# OpenAsApp System Architecture

## System Overview
[Architecture diagram]

## Component Architecture
### Frontend Layer
- Next.js 14+ application
- Component structure
- State management approach

### API Layer
- RESTful API design
- Endpoint structure
- Authentication flow

### Data Layer
- Database schema
- Data models
- Relationships

### Integration Layer
- PDF parser integration
- Quote engine integration
- ChatGPT integration

## Technology Stack
### Frontend
- Framework: Next.js 14
- UI: Tailwind CSS + shadcn/ui
- State: Zustand
- Forms: React Hook Form + Zod

### Backend
- Runtime: Node.js 20+
- Database: Vercel Postgres
- ORM: Prisma
- File Storage: Vercel Blob

### External Services
- OpenAI API
- PDF processing libraries
- Email service
- Analytics

## Security Architecture
- Authentication: NextAuth.js
- Authorization: RBAC
- Data encryption
- API security
- CORS configuration

## Deployment Architecture
- Hosting: Vercel
- CI/CD: GitHub Actions
- Monitoring: Sentry
- Analytics: Vercel Analytics
```

#### 1.2 API Specification
**Content:**
- OpenAPI 3.1.0 schema
- Endpoint definitions
- Request/response schemas
- Authentication methods
- Error responses
- Rate limiting rules

**Key Endpoints:**
```yaml
openapi: 3.1.0
info:
  title: OpenAsApp API
  version: 1.0.0
  description: Quote generation and PDF parsing API

paths:
  /api/quotes:
    post:
      summary: Create new quote
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateQuoteRequest'
      responses:
        '201':
          description: Quote created
        '400':
          description: Invalid input
    get:
      summary: List quotes
      parameters:
        - name: page
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: Quote list

  /api/quotes/{id}:
    get:
      summary: Get quote details
    put:
      summary: Update quote
    delete:
      summary: Delete quote

  /api/pdf/parse:
    post:
      summary: Parse PDF file
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
      responses:
        '200':
          description: Parsed data

  /api/pdf/extract:
    post:
      summary: Extract quote from PDF

  /api/templates:
    get:
      summary: List quote templates
    post:
      summary: Create template

  /api/templates/{id}:
    get:
      summary: Get template
    put:
      summary: Update template
    delete:
      summary: Delete template

  /api/export/pdf:
    post:
      summary: Export quote as PDF

  /api/export/excel:
    post:
      summary: Export quote as Excel

  /api/chatgpt/actions:
    post:
      summary: GPT Action endpoint
      description: Handle requests from ChatGPT

components:
  schemas:
    CreateQuoteRequest:
      type: object
      required:
        - clientName
        - items
      properties:
        clientName:
          type: string
        clientEmail:
          type: string
          format: email
        items:
          type: array
          items:
            $ref: '#/components/schemas/QuoteItem'

    QuoteItem:
      type: object
      required:
        - description
        - quantity
        - unitPrice
      properties:
        description:
          type: string
        quantity:
          type: number
        unitPrice:
          type: number
        discount:
          type: number

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

    apiKey:
      type: apiKey
      in: header
      name: X-API-Key

security:
  - bearerAuth: []
  - apiKey: []
```

#### 1.3 Database Schema Design
**Content:**
- Entity relationship diagram
- Table definitions
- Indexes and constraints
- Migration strategy

**Core Tables:**
```prisma
// schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String
  role          Role      @default(USER)
  apiKey        String?   @unique
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  quotes        Quote[]
  templates     Template[]
  parsedPdfs    ParsedPdf[]
}

enum Role {
  USER
  ADMIN
  API_USER
}

model Quote {
  id              String      @id @default(cuid())
  quoteNumber     String      @unique
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  clientName      String
  clientEmail     String?
  clientPhone     String?
  clientAddress   String?
  status          QuoteStatus @default(DRAFT)
  items           QuoteItem[]
  subtotal        Decimal     @db.Decimal(10, 2)
  taxRate         Decimal     @db.Decimal(5, 2)
  taxAmount       Decimal     @db.Decimal(10, 2)
  totalAmount     Decimal     @db.Decimal(10, 2)
  notes           String?
  validUntil      DateTime?
  templateId      String?
  template        Template?   @relation(fields: [templateId], references: [id])
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([userId])
  @@index([quoteNumber])
  @@index([status])
}

enum QuoteStatus {
  DRAFT
  SENT
  ACCEPTED
  REJECTED
  EXPIRED
}

model QuoteItem {
  id          String   @id @default(cuid())
  quoteId     String
  quote       Quote    @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  description String
  quantity    Decimal  @db.Decimal(10, 2)
  unitPrice   Decimal  @db.Decimal(10, 2)
  discount    Decimal  @default(0) @db.Decimal(5, 2)
  lineTotal   Decimal  @db.Decimal(10, 2)
  sortOrder   Int
  category    String?
  sku         String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([quoteId])
}

model Template {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  name        String
  description String?
  items       Json     // Stored as JSON for flexibility
  taxRate     Decimal  @db.Decimal(5, 2)
  notes       String?
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  quotes      Quote[]

  @@index([userId])
}

model ParsedPdf {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  fileName      String
  fileUrl       String
  fileSize      Int
  mimeType      String
  extractedText String?  @db.Text
  parsedData    Json
  confidence    Decimal  @db.Decimal(5, 2)
  status        PdfStatus @default(PROCESSING)
  errorMessage  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId])
  @@index([status])
}

enum PdfStatus {
  PROCESSING
  COMPLETED
  FAILED
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String
  resource  String
  resourceId String?
  details   Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([resource, resourceId])
  @@index([createdAt])
}

model ApiKey {
  id          String   @id @default(cuid())
  key         String   @unique
  userId      String
  name        String
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@index([key])
  @@index([userId])
}
```

#### 1.4 Technology Stack Document
**Content:**
```markdown
# Technology Stack Decisions

## Frontend Stack
### Framework: Next.js 14.2+
**Rationale:**
- Server-side rendering for better SEO
- API routes for serverless functions
- Built-in optimization
- Excellent Vercel integration
- Strong TypeScript support

### UI Library: shadcn/ui + Tailwind CSS
**Rationale:**
- Accessible components out of the box
- Customizable and composable
- Great developer experience
- No runtime overhead
- Dark mode support

### State Management: Zustand
**Rationale:**
- Lightweight (< 1KB)
- Simple API
- No boilerplate
- Good TypeScript support
- React 18 compatible

### Form Handling: React Hook Form + Zod
**Rationale:**
- Excellent performance
- Built-in validation
- TypeScript integration
- Small bundle size
- Form state management

## Backend Stack
### Runtime: Node.js 20+
**Rationale:**
- Latest LTS version
- Native fetch support
- Performance improvements
- Security updates

### Database: Vercel Postgres
**Rationale:**
- Serverless-friendly
- Zero configuration with Vercel
- Automatic scaling
- Built-in connection pooling
- PostGIS support if needed

### ORM: Prisma
**Rationale:**
- Type-safe database access
- Excellent migration system
- Great developer experience
- Auto-generated client
- Built-in connection pooling

### File Storage: Vercel Blob
**Rationale:**
- Native Vercel integration
- Simple API
- Automatic CDN distribution
- Secure file uploads
- Cost-effective

## PDF Processing
### Library: pdf-parse + pdf.js
**Rationale:**
- Comprehensive text extraction
- Table detection
- Cross-browser compatibility
- Active maintenance
- Good documentation

### OCR: Optional Tesseract.js
**Rationale:**
- Client-side or server-side
- Multiple language support
- Good accuracy
- Free and open source

## ChatGPT Integration
### SDK: openai npm package
**Rationale:**
- Official SDK
- Complete API coverage
- TypeScript support
- Regular updates

### Auth: NextAuth.js
**Rationale:**
- OAuth 2.0 support
- Multiple providers
- Session management
- Security best practices

## Development Tools
### Language: TypeScript 5.4+
**Rationale:**
- Type safety
- Better IDE support
- Catch errors early
- Improved refactoring

### Testing: Vitest + React Testing Library
**Rationale:**
- Fast test execution
- Vite integration
- Jest compatible
- Modern API

### E2E Testing: Playwright
**Rationale:**
- Multiple browser support
- Reliable and fast
- Great debugging tools
- CI/CD friendly

### Linting: ESLint + Prettier
**Rationale:**
- Code consistency
- Catch common errors
- Automated formatting

## DevOps Stack
### Hosting: Vercel
**Rationale:**
- Zero config deployment
- Automatic HTTPS
- Edge network
- Preview deployments
- Great DX

### CI/CD: GitHub Actions
**Rationale:**
- Native GitHub integration
- Free for public repos
- Flexible workflows
- Good marketplace

### Monitoring: Sentry
**Rationale:**
- Error tracking
- Performance monitoring
- Release tracking
- Source map support

### Analytics: Vercel Analytics
**Rationale:**
- Privacy-focused
- Zero configuration
- Real user metrics
- No cookie banners needed

## Security Tools
### Authentication: NextAuth.js
### Rate Limiting: Upstash Redis
### Secret Management: Vercel Environment Variables
### CORS: Built-in Next.js middleware
### Input Validation: Zod
```

#### 1.5 Development Standards Document
**Content:**
- Code style guide
- Git workflow
- PR review process
- Testing requirements
- Documentation standards

---

### Phase 2: Development Coordination (Weeks 3-6)

#### 2.1 Weekly Progress Reports
**Template:**
```markdown
# Week [N] Progress Report

## Overall Status
- **Phase:** [Current Phase]
- **Health:** 🟢 On Track | 🟡 At Risk | 🔴 Blocked
- **Completion:** [X]% complete

## Level 2 Agent Updates

### Backend Infrastructure Agent
- **Status:** [Status]
- **Completed:**
  - [Task 1]
  - [Task 2]
- **In Progress:**
  - [Task 3]
- **Blockers:** [Any blockers]
- **Next Week:** [Planned work]

### Frontend Application Agent
[Same structure]

### Quote Engine Agent
[Same structure]

### PDF Parser Agent
[Same structure]

### ChatGPT Integration Agent
[Same structure]

### DevOps & Deployment Agent
[Same structure]

## Key Achievements This Week
1. [Achievement 1]
2. [Achievement 2]

## Risks & Mitigations
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| [Risk 1] | High | Medium | [Strategy] |

## Decisions Made
1. [Decision 1] - Rationale: [Why]
2. [Decision 2] - Rationale: [Why]

## Next Week Priorities
1. [Priority 1]
2. [Priority 2]
3. [Priority 3]

## Blockers Requiring Stakeholder Input
- [Blocker 1]: [Description]
```

#### 2.2 Integration Testing Plans
- Cross-component integration tests
- API contract testing
- End-to-end scenarios
- Performance testing
- Security testing

---

### Phase 3: Quality Assurance (Weeks 7-8)

#### 3.1 QA Checklist
```markdown
# Quality Assurance Checklist

## Functionality
- [ ] All API endpoints working
- [ ] Quote creation flow complete
- [ ] PDF parsing functional
- [ ] Export features working
- [ ] Template system operational
- [ ] User authentication working
- [ ] Authorization rules enforced

## Performance
- [ ] API response times < 200ms
- [ ] Page load times < 2s
- [ ] Lighthouse score > 90
- [ ] Database queries optimized
- [ ] Images optimized
- [ ] Bundle size < 500KB

## Security
- [ ] Authentication implemented
- [ ] Authorization working
- [ ] Input validation present
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting active
- [ ] Sensitive data encrypted

## Testing
- [ ] Unit test coverage > 80%
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Error scenarios tested
- [ ] Edge cases covered

## Documentation
- [ ] API documentation complete
- [ ] User guide written
- [ ] Code commented
- [ ] README updated
- [ ] Architecture doc current

## Accessibility
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard navigation
- [ ] Screen reader compatible
- [ ] Color contrast ratios met
- [ ] Alt text for images

## Browser Compatibility
- [ ] Chrome tested
- [ ] Firefox tested
- [ ] Safari tested
- [ ] Edge tested
- [ ] Mobile browsers tested

## Deployment
- [ ] Vercel deployment successful
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Monitoring configured
- [ ] Backups configured
```

---

### Phase 4: OpenAI Submission (Weeks 9-10)

#### 4.1 GPT Submission Package
**Content:**
- GPT Action schema
- OAuth 2.0 configuration
- Privacy policy
- Terms of service
- User documentation
- Example conversations
- Testing report

**GPT Action Schema:**
```yaml
openapi: 3.1.0
info:
  title: OpenAsApp GPT Actions
  description: Create quotes and parse PDFs through ChatGPT
  version: 1.0.0

servers:
  - url: https://openasapp.vercel.app
    description: Production server

paths:
  /api/gpt/quote/create:
    post:
      operationId: createQuote
      summary: Create a new quote
      description: Create a quote with items, client info, and calculations
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateQuoteGPT'
      responses:
        '200':
          description: Quote created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QuoteResponse'

  /api/gpt/quote/list:
    get:
      operationId: listQuotes
      summary: List recent quotes
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
      responses:
        '200':
          description: Quote list

  /api/gpt/pdf/parse:
    post:
      operationId: parsePdf
      summary: Parse PDF and extract quote information
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                pdfUrl:
                  type: string
                  format: uri
      responses:
        '200':
          description: Parsed data

components:
  schemas:
    CreateQuoteGPT:
      type: object
      required:
        - clientName
        - items
      properties:
        clientName:
          type: string
          description: Client or company name
        clientEmail:
          type: string
          format: email
        items:
          type: array
          items:
            type: object
            required:
              - description
              - quantity
              - unitPrice
            properties:
              description:
                type: string
              quantity:
                type: number
              unitPrice:
                type: number
              discount:
                type: number
                default: 0
        notes:
          type: string
        taxRate:
          type: number
          default: 0

    QuoteResponse:
      type: object
      properties:
        id:
          type: string
        quoteNumber:
          type: string
        clientName:
          type: string
        totalAmount:
          type: number
        pdfUrl:
          type: string
        excelUrl:
          type: string

  securitySchemes:
    OAuth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://openasapp.vercel.app/oauth/authorize
          tokenUrl: https://openasapp.vercel.app/oauth/token
          scopes:
            quotes:read: Read quotes
            quotes:write: Create and modify quotes
            pdf:parse: Parse PDF files

security:
  - OAuth2:
      - quotes:read
      - quotes:write
      - pdf:parse
```

#### 4.2 Privacy Policy & Terms
- Data collection disclosure
- Data usage policies
- Third-party integrations
- User rights
- Data retention
- Security measures

---

### Phase 5: Launch Preparation (Weeks 11-12)

#### 5.1 Launch Checklist
```markdown
# Launch Checklist

## Pre-Launch
- [ ] All tests passing
- [ ] Security audit complete
- [ ] Performance testing complete
- [ ] Documentation complete
- [ ] Privacy policy live
- [ ] Terms of service live
- [ ] Support email configured
- [ ] Monitoring dashboards set up
- [ ] Error alerting configured
- [ ] Backup system tested

## Launch Day
- [ ] Final deployment to production
- [ ] DNS configured
- [ ] SSL certificate valid
- [ ] Database migrations run
- [ ] Environment variables verified
- [ ] Monitoring active
- [ ] Support team ready

## Post-Launch
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Address critical bugs
- [ ] Update documentation as needed

## OpenAI Submission
- [ ] GPT Actions tested
- [ ] OAuth flow working
- [ ] Example conversations prepared
- [ ] Screenshots captured
- [ ] Demo video recorded
- [ ] Submission form completed
- [ ] Submit to OpenAI
```

---

## Decision-Making Framework

### Architecture Decision Record (ADR) Template
```markdown
# ADR [Number]: [Title]

## Status
[Proposed | Accepted | Rejected | Deprecated | Superseded]

## Context
[What is the issue we're trying to solve?]

## Decision
[What is the change we're proposing/making?]

## Consequences
### Positive
- [Benefit 1]
- [Benefit 2]

### Negative
- [Drawback 1]
- [Drawback 2]

### Neutral
- [Other impact 1]

## Alternatives Considered
### Option 1: [Name]
- Pros: [...]
- Cons: [...]
- Rejected because: [...]

### Option 2: [Name]
- Pros: [...]
- Cons: [...]
- Rejected because: [...]

## Related Decisions
- [ADR link]

## Notes
[Any additional context]
```

---

## Communication Protocols

### Daily Standups (Async)
**Format:**
```
Yesterday:
- [What was completed]

Today:
- [What will be worked on]

Blockers:
- [Any blockers or concerns]
```

### Weekly Sync Meetings
**Agenda:**
1. Review progress against milestones (15 min)
2. Demo completed work (15 min)
3. Discuss blockers and risks (15 min)
4. Plan next week's priorities (10 min)
5. Open discussion (5 min)

### Escalation Process
1. **Level 3 → Level 2**: Daily via Slack/async updates
2. **Level 2 → Level 1**: Blockers escalated within 24 hours
3. **Level 1 → Stakeholder**: Critical decisions within 48 hours

---

## Success Criteria

### Technical Excellence
- ✅ All acceptance criteria met
- ✅ Test coverage > 80%
- ✅ Zero critical security vulnerabilities
- ✅ Performance benchmarks achieved
- ✅ Accessibility standards met

### Delivery Excellence
- ✅ Milestones completed on schedule
- ✅ Documentation complete and accurate
- ✅ Code review process followed
- ✅ Deployment successful
- ✅ Monitoring operational

### Product Excellence
- ✅ Feature parity with Excel app
- ✅ PDF parsing accuracy > 95%
- ✅ ChatGPT integration working
- ✅ User experience validated
- ✅ OpenAI submission approved

---

## Tools & Access

### Development
- **GitHub Repository:** [Repo URL]
- **Vercel Dashboard:** [Dashboard URL]
- **Database:** [Connection details]
- **Figma:** [Design files URL]

### Communication
- **Slack/Discord:** [Channel]
- **Email:** [Team email]
- **Video Calls:** [Platform]

### Project Management
- **Tasks:** GitHub Projects / Linear / Jira
- **Documentation:** Notion / Confluence
- **Time Tracking:** [Tool if needed]

### Monitoring
- **Sentry:** [Project URL]
- **Vercel Analytics:** [Dashboard]
- **Uptime:** [Monitor URL]

---

**Agent Activation Date:** [Date]
**Current Phase:** Phase 1 - Foundation
**Next Review:** [Date]
