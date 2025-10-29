# RCGV Quote Parity Sandbox

This repository contains a lightweight Next.js 14 application that recreates the OpenAsApp “Quote” experience for RCG Valuation. The goal is to let prospects run a fast, accurate quote directly in the browser, review the calculated outputs, and (optionally) share the quote with the RCG team for follow-up. There is **no persistent storage in the UI**—every quote is transient unless a user explicitly submits it.

## ✅ What the app does

- Presents a single-page form at [`/quote`](./src/app/quote/page.tsx) that mirrors the OpenAsApp inputs using React Hook Form + Zod for validation.
- Calculates all pricing outputs client-side through pure helpers in [`lib/quoteMath.ts`](./src/lib/quoteMath.ts), which are unit-tested with Vitest.
- Shows an at-a-glance summary at [`/quote/preview`](./src/app/quote/preview/page.tsx) including payment options, property snapshot, and an email call-to-action so users can request a callback from RCG.
- Provides a “Start a new quote” action that clears the temporary session storage, reinforcing that this UI isn’t a quote archive.

## 🚫 What it intentionally does **not** do

- Store a history of quotes in the browser or require authentication.
- Expose draft/saved quote dashboards—those flows will live in the future backend.
- Persist submissions locally; the preview page only offers an email hand-off so the backend (or sales inbox) can own long-term storage.

## 🧭 User flow

1. Navigate to `/quote` and complete the required fields. Inline errors and required markers match the OpenAsApp behavior.
2. Submit the form to navigate to `/quote/preview`. Session storage is used only to ferry data between routes.
3. Review the calculated numbers. If desired, click **“Email this quote to RCG”**—a pre-filled `mailto:` draft includes the important inputs and final bid. RCG will store submitted quotes server-side.
4. Use **“Start a new quote”** to clear the temporary data and begin another run.

## 🧰 Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000/quote](http://localhost:3000/quote) in a browser to try the workflow.

### Tests

```bash
npx tsx scripts/run-quote-tests.ts
```

This command executes the Vitest suites for both the Zod schema (`__tests__/quoteSchema.test.ts`) and pricing helpers (`__tests__/quoteMath.test.ts`).

## 📋 Field and validation checklist

| Field | Type | Required | Validation notes |
| --- | --- | --- | --- |
| Name of Prospect | Text | ✅ | 3–120 characters |
| Address of Property | Text | ✅ | 5–200 characters |
| ZIP Code | Text | ✅ | Exactly five numeric digits (leading zeros preserved) |
| Tax Year | Number | ✅ | Integer between 2000 and 2100 |
| Tax Deadline | Select | ✅ | One of the 12 calendar months |
| Purchase Price | Currency | ✅ | $50,000–$50,000,000 |
| Capital Improvements | Toggle + Currency | ✅ | Amount enabled & required when “Yes” (0–$10M) |
| Land Value | Percentage | ✅ | 0–80%, two decimal precision |
| 1031 Exchange | Toggle + Currency | ✅ | Accumulated depreciation required when “Yes” |
| SqFt Building | Number | ✅ | 100–1,000,000 sqft |
| Acres Land | Decimal | ✅ | 0.01–100 acres |
| Type of Property | Select | ✅ | Must match `PROPERTY_TYPES` enum |
| Number of Floors | Number | ✅ | Integer 1–40 |
| Multiple Properties | Number | ✅ | Integer 1–50 |
| Need a Rush? | Select | ✅ | `no_rush` or `rush` (adds $1,500 fee) |
| Year Built | Number | ✅ | 1900–current year |
| Price Override | Toggle + Currency | ✅ | Override amount required when enabled ($1,000-$1,000,000) |

## 🧮 Calculations

All calculations live in [`lib/quoteMath.ts`](./src/lib/quoteMath.ts) and are derived from the Excel contract. Highlights:

- Lookup tables for cost basis, ZIP prefix, square footage, acres, property type, floors, and multi-property discounts.
- Base cost segregation bid, natural log smoothing, multi-property adjustment, and a cost-method floor at 1.1× (min $3,300).
- Rush fee (+$1,500) and manual overrides when provided.
- Payment plans (50/50 and monthly 1.2× premium) and bonus depreciation snapshot using the configured rate.

See [`SPECS.md`](./SPECS.md) for the exhaustive matrix, validation notes, and sample scenarios used in testing.

## 📬 Submitting quotes to RCG

The preview page generates a pre-filled email addressed to `quotes@rcgv.com`. When a prospect clicks **“Email this quote to RCG”**, their email client opens with:

- Subject line: `Quote Request – <property address>`
- Body: key inputs, rush selection, final bid, and property details.

This keeps the UI stateless while giving the sales team everything needed to store the quote in backend systems.

## 📎 Visual reference

Screenshots that mirror the OpenAsApp experience are archived internally. When sharing changes, attach updated comparisons in the PR description to keep parity visible.
