# Access Guide - PDF Parser & Excel Integration

## 1. Accessing Your Working PDF Parser

### Current Deployment

**Your PDF parser is already deployed on Vercel!** 🎉

### Option A: Access Via Vercel Dashboard

1. **Go to Vercel Dashboard:**
   ```
   https://vercel.com/dashboard
   ```

2. **Log in with your account**

3. **Find your project:**
   - Look for "rcgv-capex-parse" or similar name
   - Click on the project

4. **Get the URL:**
   - You'll see the production URL (e.g., `https://rcgv-capex-parse.vercel.app`)
   - Click to open it in your browser

5. **Use the app:**
   - Enter an NP_ID
   - Upload PDF files
   - Click "Parse PDFs & Export CSV"
   - CSV downloads automatically

### Option B: Run Locally

```bash
# Navigate to the PDF parser directory
cd C:\Users\scott\Claude_Code\RCGV_CapEx_Parse

# Install dependencies (if not already done)
npm install

# Run development server
npm run dev

# Open in browser
# http://localhost:3000
```

### Option C: Check Deployment Status

```bash
cd C:\Users\scott\Claude_Code\RCGV_CapEx_Parse

# Install Vercel CLI if not installed
npm install -g vercel

# Login to Vercel
vercel login

# Check deployment info
vercel ls

# Get production URL
vercel inspect
```

---

## 2. Excel File Integration

### Step 1: Copy Your Excel File

**Please copy your Excel quote file to this location:**

```
C:\Users\scott\Claude_Code\OpenAsApp_App\reference\OpenAsApp_Quote_Template.xlsx
```

**Using File Explorer:**
1. Navigate to where your Excel file is located
2. Copy the file (Ctrl+C)
3. Navigate to: `C:\Users\scott\Claude_Code\OpenAsApp_App\reference\`
4. Paste the file (Ctrl+V)
5. Rename it to: `OpenAsApp_Quote_Template.xlsx`

**Using Command Line:**
```bash
# Example - adjust path to where your file actually is:
cp "/path/to/your/excel/file.xlsx" "C:\Users\scott\Claude_Code\OpenAsApp_App\reference\OpenAsApp_Quote_Template.xlsx"

# Or if it's on your desktop:
cp ~/Desktop/YourQuoteFile.xlsx "C:\Users\scott\Claude_Code\OpenAsApp_App\reference\OpenAsApp_Quote_Template.xlsx"
```

### Step 2: Verify the File

```bash
# Check that the file is in the right place
ls -la C:\Users\scott\Claude_Code\OpenAsApp_App\reference\
```

You should see:
```
OpenAsApp_Quote_Template.xlsx
```

---

## 3. Using the PDF Parser

### Understanding the Current Parser

**What it does:**
- Accepts multiple PDF files
- Extracts text using pdf-parse
- Finds patterns for names and amounts
- Exports to CSV format

**API Endpoint:**
```
POST /api/parse-pdf
```

**Request Format:**
```javascript
const formData = new FormData();
formData.append('npId', 'YOUR_ID');
formData.append('pdfs', pdfFile1);
formData.append('pdfs', pdfFile2);
// Add more PDF files as needed
```

**Response:**
```
CSV file download with format:
NP_ID,Name,Paid_Amount
YOUR_ID,Extracted Name,1234.56
```

### Testing the Parser

**From the deployed URL:**
1. Open your Vercel deployment URL
2. Enter a test NP_ID (e.g., "TEST001")
3. Upload a test PDF (any PDF with text)
4. Click "Parse PDFs & Export CSV"
5. Check the downloaded CSV file

**From local development:**
```bash
cd C:\Users\scott\Claude_Code\RCGV_CapEx_Parse
npm run dev
# Open http://localhost:3000 in browser
```

### Sample API Call (curl)

```bash
curl -X POST http://localhost:3000/api/parse-pdf \
  -F "npId=TEST001" \
  -F "pdfs=@/path/to/test.pdf" \
  --output result.csv
```

---

## 4. Quick Access Commands

### Check if PDF Parser is Running Locally
```bash
cd C:\Users\scott\Claude_Code\RCGV_CapEx_Parse
npm run dev
```

### Find Your Vercel Deployment
```bash
cd C:\Users\scott\Claude_Code\RCGV_CapEx_Parse
vercel ls
```

### View Deployment Logs
```bash
cd C:\Users\scott\Claude_Code\RCGV_CapEx_Parse
vercel logs
```

### Get Production URL
```bash
cd C:\Users\scott\Claude_Code\RCGV_CapEx_Parse
vercel inspect --prod
```

---

## 5. What I Need to See Your PDF Parser

To help you access your PDF parser, I need one of these:

### Option 1: Vercel Deployment URL
```
# If you know your Vercel URL:
https://your-project-name.vercel.app

# Or run this command and paste the output:
cd C:\Users\scott\Claude_Code\RCGV_CapEx_Parse
vercel ls
```

### Option 2: Run Locally
```bash
cd C:\Users\scott\Claude_Code\RCGV_CapEx_Parse
npm run dev

# Then open: http://localhost:3000
# Take a screenshot if needed
```

### Option 3: Vercel Dashboard Access
- Log into https://vercel.com
- Navigate to your projects
- Find the RCGV CapEx Parse project
- Copy the production URL

---

## 6. Next Steps After Excel File

Once you copy your Excel file to the `reference/` folder:

### Automatic Analysis

I will:
1. ✅ Read the Excel file
2. ✅ Document its structure
3. ✅ Extract all formulas
4. ✅ Identify calculation logic
5. ✅ Create matching database schema
6. ✅ Plan the integration

### You'll Get:

**Excel Analysis Report:**
- Complete structure documentation
- Formula breakdown
- Business rules extracted
- Database schema design
- Implementation plan

**Timeline:**
- Analysis: ~30 minutes
- Documentation: Complete
- Ready to code: Immediately after

---

## 7. Troubleshooting

### Can't Find Vercel Deployment

**Solution 1: Check Vercel Dashboard**
```
1. Go to https://vercel.com/dashboard
2. Log in
3. Look for project named "rcgv-capex-parse"
4. Click to view details
```

**Solution 2: Deploy Now**
```bash
cd C:\Users\scott\Claude_Code\RCGV_CapEx_Parse
vercel --prod
```

### Can't Run Locally

**Check Node.js:**
```bash
node --version
# Should be v18 or higher
```

**Reinstall Dependencies:**
```bash
cd C:\Users\scott\Claude_Code\RCGV_CapEx_Parse
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Excel File Issues

**Can't Find Reference Folder:**
```bash
# Create it:
mkdir -p C:\Users\scott\Claude_Code\OpenAsApp_App\reference
```

**File Won't Copy:**
- Try dragging and dropping in File Explorer
- Make sure Excel file isn't open
- Check file permissions

---

## 8. What Happens After You Provide Excel File

### Immediate Actions (I'll Do This):

```
1. Read Excel file ✓
2. Analyze structure ✓
3. Extract formulas ✓
4. Document logic ✓
5. Create EXCEL_ANALYSIS.md ✓
```

### You'll Review:

```
EXCEL_ANALYSIS.md will contain:
- Sheet structure
- Cell formulas
- Calculation logic
- Business rules
- Proposed database schema
```

### Then We'll:

```
1. Initialize Next.js project
2. Set up database with Prisma
3. Implement calculation engine
4. Build quote UI
5. Integrate PDF parser
6. Test everything
```

---

## 9. Quick Reference

### File Locations

```
PDF Parser (Working):
C:\Users\scott\Claude_Code\RCGV_CapEx_Parse\

OpenAsApp (New):
C:\Users\scott\Claude_Code\OpenAsApp_App\

Excel File (Copy Here):
C:\Users\scott\Claude_Code\OpenAsApp_App\reference\OpenAsApp_Quote_Template.xlsx

Sample PDFs (Optional):
C:\Users\scott\Claude_Code\OpenAsApp_App\reference\sample-pdfs\
```

### Key Commands

```bash
# Run PDF parser locally
cd C:\Users\scott\Claude_Code\RCGV_CapEx_Parse && npm run dev

# Check Vercel deployments
vercel ls

# Create reference folder
mkdir -p C:\Users\scott\Claude_Code\OpenAsApp_App\reference

# List reference contents
ls -la C:\Users\scott\Claude_Code\OpenAsApp_App\reference\
```

---

## 🎯 Current Status

**PDF Parser:** ✅ Working, deployed on Vercel
**Access:** ⏳ Need Vercel URL or run locally
**Excel File:** ⏳ Waiting for you to copy to reference folder

---

## 📞 Ready to Continue!

**To give me access to your PDF parser, please:**

1. **Option A:** Share your Vercel deployment URL
   ```
   Run: cd ../RCGV_CapEx_Parse && vercel ls
   Share the URL shown
   ```

2. **Option B:** Run locally and confirm it works
   ```
   Run: cd ../RCGV_CapEx_Parse && npm run dev
   Confirm: "It's running on http://localhost:3000"
   ```

3. **Option C:** Give me Vercel dashboard details
   ```
   Your Vercel username/email
   Project name
   ```

**To provide your Excel file:**

```bash
# Copy your Excel file to:
C:\Users\scott\Claude_Code\OpenAsApp_App\reference\OpenAsApp_Quote_Template.xlsx

# Then tell me: "Excel file is ready!"
```

**I'm ready to analyze it immediately!** 🚀
