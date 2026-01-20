# 🧪 Testing Guide - Pharmyrus Scientific Dashboard

## Quick Start

### 1. Setup
```bash
cd /home/claude/pharmyrus-frontend-v2/web
npm install
npm run dev
```

### 2. Access the Scientific Dashboard
Navigate to: `http://localhost:5173/results/scientific`

---

## Test Data Sources

### Primary Test File: `darolutamide_BR.json`

Located at: `/mnt/user-data/uploads/darolutamide_BR.json`

This JSON contains:
- ✅ 39 total patents
- ✅ Complete patent cliff data
- ✅ Confidence tier distribution (FOUND, INFERRED, EXPECTED, PREDICTED)
- ✅ Full patent metadata (dates, applicants, IPC codes)
- ✅ Molecular data with SMILES (for 3D viewer)

---

## Testing Scenarios

### Scenario 1: Complete Dashboard View

**What to test:**
- Summary cards display correct numbers
- Patent Cliff timeline renders with all years
- Confidence distribution shows all 6 tiers
- Patent list virtualizes smoothly

**Expected Results:**
```
Total Patentes: 39
Patent Cliff: 12.3 anos (Safe)
Primeira Expiração: 2038
Tempo de Análise: ~24 min

Confidence Tiers:
- FOUND: 22
- INFERRED: 35
- EXPECTED: 49
- PREDICTED: 28
- SPECULATIVE: 7
```

**How to Test:**
```javascript
// In SearchPage.tsx or Results.tsx
import darolutamideData from '/mnt/user-data/uploads/darolutamide_BR.json'

navigate('/results/scientific', { 
  state: { result: darolutamideData } 
})
```

---

### Scenario 2: Patent Cliff Visualization

**What to test:**
- Timeline shows years 2026-2044
- Reference line at "Hoje" (current year)
- Tooltip shows expiration counts per year
- Color zones visible in legend

**Verification:**
1. First expiration in 2038 (12.5 years away)
2. Most expirations concentrated 2040-2044
3. Green area dominates (Safe zone)
4. Hover tooltips work smoothly

---

### Scenario 3: Predicted Patents

**What to test:**
- Predicted patents have amber dashed borders
- Confidence badges display correctly
- Warning footers appear
- Modal shows enhanced warnings

**Find Predicted Patents:**
```javascript
const predictedPatents = darolutamideData.patent_discovery.all_patents
  .filter(p => p.confidence_tier === 'PREDICTED' || p.confidence_tier === 'EXPECTED')

console.log(`Found ${predictedPatents.length} predicted patents`)
```

**Expected Visual:**
- Border: `border-amber-300 border-dashed`
- Background: `bg-amber-50/30`
- Badge: `[PREDICTED]` in red
- Footer: Warning text with confidence score

---

### Scenario 4: Patent Modal - All Tabs

**What to test:**
Click on any patent card to open modal, then verify each tab:

**Tab 1 - Overview:**
- [ ] Patent Cliff card shows correct color (green/yellow/red)
- [ ] Years until expiration calculated correctly
- [ ] Bibliographic data complete (filing, publication, grant dates)
- [ ] Applicants and inventors listed
- [ ] IPC codes displayed as badges
- [ ] Abstract text readable
- [ ] External links work (INPI, Espacenet, Google Patents)

**Tab 2 - Family:**
- [ ] WO number displayed
- [ ] PCT number shown
- [ ] Family tree placeholder visible

**Tab 3 - Legal Status:**
- [ ] Current status badge (Granted/Pending)
- [ ] Legal events timeline (if available)
- [ ] Disclaimer about INPI verification

**Tab 4 - Claims:**
- [ ] Claims listed numerically
- [ ] Independent claims highlighted (blue border)
- [ ] Dependent claims visible (gray border)
- [ ] Or "not available" message shown

**Tab 5 - Analysis:**
- [ ] Strategic importance metrics displayed
- [ ] FTO risk assessment card (color-coded)
- [ ] Recommendations list relevant to patent status
- [ ] Legal disclaimer visible

**For Predicted Patents:**
- [ ] Extra warning in Overview tab
- [ ] Analysis tab mentions verification requirement
- [ ] Confidence score prominently displayed

---

### Scenario 5: Virtualized List Performance

**What to test:**
- Smooth scrolling through 39 patents
- No lag or jank
- Only ~15 items rendered at once (check DevTools)
- "Load more" button works if initially showing 10

**Performance Check:**
```javascript
// In browser DevTools Console
const patents = document.querySelectorAll('[data-index]')
console.log(`Rendered patents: ${patents.length}`) // Should be ~15

// Scroll to bottom
window.scrollTo(0, document.body.scrollHeight)
// Check that more items render dynamically
```

**Expected FPS:** 60fps during scroll

---

### Scenario 6: 3D Molecule Viewer

**What to test:**
- Molecule viewer appears in header
- 3D structure renders (if SMILES available)
- Rotation animation smooth
- Fallback graceful if SMILES missing

**Verification:**
```javascript
// Check if 3DMol is loaded
console.log(window.$3Dmol ? '3Dmol loaded ✓' : '3Dmol missing ✗')

// In darolutamide_BR.json, molecular data:
{
  "smiles": "CC1(C)CNC(=O)N1c1ccc(F)c(C(=O)c2ccc(C#N)c(C(F)(F)F)c2)c1F",
  "molecular_formula": "C19H15F5N4O2",
  "molecular_weight": 410.34
}
```

**Expected:**
- Small 64x64px viewer in header
- Larger viewer in R&D section (when implemented)

---

### Scenario 7: Responsive Behavior

**What to test:**

**Desktop (>1024px):**
- [ ] 4-column summary cards
- [ ] 6-column confidence tiers
- [ ] Side-by-side bibliographic cards in modal
- [ ] Modal max-width: 1280px

**Tablet (768-1024px):**
- [ ] 2-column summary cards
- [ ] 3-column confidence tiers
- [ ] Tabs scrollable horizontally if needed
- [ ] Modal width: 90vw

**Mobile (<768px):**
- [ ] All cards stack vertically
- [ ] Tabs become accordion
- [ ] Modal becomes full-screen
- [ ] Charts height reduced to 240px
- [ ] 3D molecule hidden

**Test Commands:**
```javascript
// In browser DevTools, emulate devices:
// iPhone 12 Pro: 390x844
// iPad Air: 820x1180
// Desktop: 1920x1080
```

---

### Scenario 8: Accessibility

**Keyboard Navigation:**
- [ ] Tab key navigates through cards
- [ ] Enter opens patent modal
- [ ] Escape closes modal
- [ ] Arrow keys navigate tabs in modal
- [ ] Focus visible on all interactive elements

**Screen Reader:**
- [ ] Alt text on molecule viewer
- [ ] ARIA labels on chart elements
- [ ] Modal title announced
- [ ] Patent status communicated

**Color Contrast:**
- [ ] All text meets WCAG AA (4.5:1 ratio)
- [ ] Status not communicated by color alone
- [ ] Icons + text for important states

---

### Scenario 9: Error Handling

**Test Empty/Missing Data:**

```javascript
// Minimal valid result
const minimalResult = {
  metadata: {
    molecule_name: "Test Molecule",
    search_date: "2026-01-19",
    target_countries: ["BR"],
    elapsed_seconds: 60,
    version: "v30.4"
  },
  patent_discovery: {
    summary: {
      total_patents: 0,
      total_wo_patents: 0,
      by_country: {},
      by_source: {}
    },
    patent_cliff: {
      first_expiration: "",
      last_expiration: "",
      years_until_cliff: 0,
      status: "N/A",
      all_expirations: []
    },
    all_patents: []
  }
}

navigate('/results/scientific', { state: { result: minimalResult } })
```

**Expected Behavior:**
- [ ] Dashboard renders without crashing
- [ ] "0 patentes" shown
- [ ] Empty charts display "No data"
- [ ] Patent list shows empty state
- [ ] No console errors

---

### Scenario 10: Export Excel (Fase 5 - Not Yet Implemented)

**Placeholder Test:**
- [ ] "Exportar Excel" button visible in header
- [ ] Click shows "Coming soon" or triggers download
- [ ] Future: Download .xlsx with all patent data

---

## Performance Benchmarks

### Target Metrics:
```
Lighthouse Scores (Desktop):
- Performance: >90
- Accessibility: >95
- Best Practices: >90

Core Web Vitals:
- LCP (Largest Contentful Paint): <2.5s
- INP (Interaction to Next Paint): <200ms
- CLS (Cumulative Layout Shift): <0.1
```

### Measuring Performance:
```javascript
// In browser console
performance.mark('dashboard-start')

// After dashboard fully loaded
performance.mark('dashboard-end')
performance.measure('dashboard-load', 'dashboard-start', 'dashboard-end')

const measures = performance.getEntriesByType('measure')
console.log(`Dashboard loaded in ${measures[0].duration}ms`)
```

**Expected Load Time:** <2000ms on 3G connection

---

## Common Issues & Solutions

### Issue 1: 3DMol Not Loading
**Symptom:** Empty box in header, console error
**Solution:**
```html
<!-- Verify in index.html -->
<script src="https://3dmol.csb.pitt.edu/build/3Dmol-min.js"></script>
```

### Issue 2: Charts Not Rendering
**Symptom:** Empty space where chart should be
**Check:**
1. Data structure matches expected format
2. ResponsiveContainer has height
3. No console errors from Recharts

### Issue 3: Modal Doesn't Open
**Symptom:** Click on patent card, nothing happens
**Debug:**
```javascript
// Check if Dialog is imported
import { Dialog } from '@/components/ui/dialog'

// Verify state management
const [selectedPatent, setSelectedPatent] = useState<Patent | null>(null)
console.log('Selected:', selectedPatent)
```

### Issue 4: Virtual List Not Scrolling
**Symptom:** Can't scroll through patent list
**Solution:**
```typescript
// Parent div MUST have fixed height
<div ref={parentRef} className="h-[600px] overflow-auto">
```

---

## Data Validation

### Required Fields Check:
```typescript
interface ValidResult {
  metadata: {
    molecule_name: string ✓
    search_date: string ✓
    target_countries: string[] ✓
    elapsed_seconds: number ✓
    version: string ✓
  }
  patent_discovery: {
    summary: {
      total_patents: number ✓
      total_wo_patents: number ✓
    }
    patent_cliff: {
      first_expiration: string
      years_until_cliff: number
      status: string
      all_expirations: Array<{
        expiration_date: string ✓
        years_until_expiration: number ✓
      }>
    }
    all_patents: Patent[] ✓
  }
}
```

### Validation Script:
```javascript
function validateResult(result) {
  const errors = []
  
  if (!result.metadata?.molecule_name) errors.push('Missing molecule_name')
  if (!result.patent_discovery?.summary?.total_patents) errors.push('Missing total_patents')
  if (!Array.isArray(result.patent_discovery?.all_patents)) errors.push('Invalid all_patents')
  
  if (errors.length > 0) {
    console.error('Validation failed:', errors)
    return false
  }
  
  console.log('✓ Data structure valid')
  return true
}

validateResult(darolutamideData)
```

---

## Next Steps After Testing

Once basic functionality is verified:

1. **Integrate with Real API**
   - Replace mock data with Railway API calls
   - Implement loading states
   - Handle API errors gracefully

2. **Implement Export Excel** (Fase 5)
   - Install xlsx library
   - Map all patent fields to columns
   - Add auto-width and formatting

3. **Add R&D Section** (Fase 4)
   - Clinical trials data
   - FDA approvals
   - PubMed literature

4. **Enable Groq AI Analysis** (Fase 7)
   - Executive summary
   - Per-patent strategic analysis
   - FTO recommendations

---

## Support & Documentation

**Files to Reference:**
- `/mnt/project/DESIGN_SYSTEM_SPEC_BOLT_new.pdf` - Design guidelines
- `/mnt/project/Building_a_Patent_Intelligence_SaaS__Frontend_Architecture_Guide.md` - Best practices
- `/mnt/project/Pharmaceutical_Patent_Search_Strategies_Across_Leading_Intelligence_Platforms.md` - UX patterns

**Test Data:**
- `/mnt/user-data/uploads/darolutamide_BR.json` - Complete example
- `/mnt/project/*.xlsx` - Additional molecule datasets

---

**Testing Status**: Ready for QA  
**Last Updated**: January 2026  
**Version**: Pharmyrus v30.4
