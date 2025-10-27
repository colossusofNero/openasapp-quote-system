# PDF Quote Generator

This module generates professional PDF quotes that match the RCG Valuation brand design.

## Features

- **RCG Branding**: Matches the exact RCG color scheme and typography
- **Complete Quote Data**: Includes all quote information displayed on the web
- **Professional Layout**: Clean, organized layout optimized for printing
- **Automatic Page Numbers**: Pages are numbered automatically
- **Metadata**: PDFs include proper metadata for organization
- **Client-Side Generation**: Fast PDF generation in the browser

## Library Used

**jsPDF with jspdf-autotable**
- Chosen for excellent browser compatibility
- Great table support via jspdf-autotable
- Well-documented and actively maintained
- No server-side dependencies required
- Smaller bundle size compared to alternatives

## PDF Structure

### Page 1
1. **Header Section**
   - RCG logo (left)
   - Quote date (right)

2. **Client Information**
   - Client name in blue
   - Property address

3. **Property Details Grid**
   - Purchase Price
   - Building SqFt
   - Land Acres
   - Year Built

4. **Engagement Fee Section**
   - Three payment option boxes:
     - Pay Upfront (with "BEST VALUE" badge)
     - Pay 50/50
     - Pay Over Time

5. **First Year Bonus Depreciation**
   - Highlighted box with light blue background
   - Large, prominent display of first year benefit

6. **Depreciation Comparison Table**
   - 6-year comparison table
   - Columns: Year, Cost Seg Est, Std. Dep, Trad. Cost Seg, Bonus Dep
   - Totals row at bottom
   - First year highlighted in light blue
   - Bonus Dep column highlighted

### Page 2 (if needed)
- Continued table (if overflow)
- Footer with company information

### Footer (all pages)
- Company name
- Tagline
- Website and contact info
- Page numbers

## Color Palette

```typescript
const COLORS = {
  navy: { r: 30, g: 41, b: 73 },      // Primary text, headers
  blue: { r: 74, g: 144, b: 226 },    // Accent color, CTAs
  lightBlue: { r: 232, g: 243, b: 255 }, // Highlights
  success: { r: 16, g: 185, b: 129 }, // BEST VALUE badge
  gray: { r: 107, g: 114, b: 128 },   // Secondary text
  lightGray: { r: 243, g: 244, b: 246 }, // Table alternating rows
};
```

## Usage

```typescript
import { generateQuotePDF } from '@/lib/pdf/quote-pdf';
import { SavedQuote } from '@/lib/validations/quote.schema';

// Generate and download PDF
function handleDownload(quote: SavedQuote) {
  try {
    generateQuotePDF(quote);
    // PDF will automatically download
    toast.success("PDF downloaded successfully");
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error("Failed to generate PDF");
  }
}
```

## File Naming

PDFs are automatically named with the format:
```
RCGV_Quote_[ClientName]_[Timestamp].pdf
```

Example: `RCGV_Quote_John_Doe_1698765432000.pdf`

## PDF Metadata

Each PDF includes metadata:
- **Title**: "RCGV Quote - [Client Name]"
- **Subject**: "Cost Segregation Quote"
- **Author**: "RCG Valuation"
- **Creator**: "OpenAsApp Quote System"
- **Keywords**: "cost segregation, depreciation, tax savings"

## File Size

Typical PDF file size: **150-300 KB**
- No embedded images (logo drawn with vectors)
- Standard fonts used
- Efficient table rendering

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Opera

**Note**: Requires JavaScript enabled (client-side generation)

## Customization

### Adding New Sections

To add a new section to the PDF:

1. Update the `yPos` variable to position your content
2. Use the `COLORS` constant for consistent branding
3. Use helper functions like `toColorArray()` for color conversion
4. Check if you need a new page: `if (yPos > pageHeight - 40) { doc.addPage(); }`

### Modifying Colors

Update the `COLORS` object at the top of `quote-pdf.ts`:

```typescript
const COLORS = {
  navy: { r: 30, g: 41, b: 73 },
  // ... add or modify colors
};
```

### Changing Font Sizes

Standard font sizes used:
- **20px**: Logo text
- **18px**: Client name
- **16px**: Section headers
- **12px**: Values in boxes
- **11px**: Body text
- **9px**: Labels and secondary text
- **8px**: Small labels, footer

## Known Limitations

1. **Table Overflow**: Very long tables automatically span multiple pages
2. **Font Options**: Limited to standard PDF fonts (Helvetica, Times, Courier)
3. **Image Embeds**: Logo is drawn with vectors (not an actual image file)
4. **Print Margins**: Uses 20mm margins (standard for business documents)

## Testing Checklist

- [x] PDF downloads successfully
- [x] All quote data is visible
- [x] Colors match RCG brand
- [x] Numbers are formatted correctly
- [x] Tables render properly
- [x] Page numbers appear on all pages
- [x] Logo displays correctly
- [x] Footer information is accurate
- [x] File size is under 500KB
- [x] Filename includes client name

## Troubleshooting

### PDF doesn't download
- Check browser console for errors
- Verify quote data is complete
- Try a different browser

### Colors look wrong
- Check if COLORS constant matches RCG brand guide
- Verify RGB values are 0-255 range

### Text is cut off
- Check yPos positioning
- Add page break if needed: `doc.addPage()`
- Adjust margins if content is too wide

### Table doesn't render
- Check if depreciation data exists
- Verify table data array structure
- Check autoTable options

## Future Enhancements

Potential improvements:
- [ ] Add company logo image (replace vector logo)
- [ ] Support for custom fonts
- [ ] Email delivery option
- [ ] Save to cloud storage
- [ ] Multiple quote comparison PDF
- [ ] Interactive PDF forms
- [ ] Digital signature support

## Dependencies

```json
{
  "jspdf": "^3.0.3",
  "jspdf-autotable": "^5.0.2",
  "@types/jspdf": "^1.3.3"
}
```

## Related Files

- **Generator**: `src/lib/pdf/quote-pdf.ts`
- **UI Component**: `src/app/(dashboard)/quotes/[id]/page.tsx`
- **Type Definitions**: `src/lib/validations/quote.schema.ts`
- **Utility Functions**: `src/lib/utils.ts`

## Support

For issues or questions about PDF generation, contact the development team or refer to:
- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [jspdf-autotable Documentation](https://github.com/simonbengtsson/jsPDF-AutoTable)
