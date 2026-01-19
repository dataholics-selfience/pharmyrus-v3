import * as XLSX from 'xlsx'

interface Patent {
  patent_number: string
  country?: string
  source: string
  title: string
  applicants: string[]
  inventors?: string[]
  ipc_codes?: string[]
  filing_date: string
  publication_date?: string
  grant_date?: string
  expiration_date: string
  years_until_expiration?: number
  patent_status?: string
  wo_number?: string
  pct_number?: string
  link_national?: string
  abstract?: string
  confidence_tier?: string
  confidence_score?: number
}

export function useExportExcel() {
  const exportToExcel = (patents: Patent[], moleculeName: string) => {
    try {
      // Map patents to Excel-friendly format
      const data = patents.map(p => ({
        'Patent Number': p.patent_number || '',
        'WO Number': p.wo_number || '',
        'PCT Number': p.pct_number || '',
        'Country': p.country || '',
        'Source': p.source || '',
        'Status': p.patent_status || '',
        'Confidence Tier': p.confidence_tier || '',
        'Confidence Score': p.confidence_score?.toFixed(2) || '',
        'Title': p.title || '',
        'Applicants': Array.isArray(p.applicants) ? p.applicants.join('; ') : '',
        'Inventors': Array.isArray(p.inventors) ? p.inventors.join('; ') : '',
        'IPC Codes': Array.isArray(p.ipc_codes) ? p.ipc_codes.join('; ') : '',
        'Filing Date': p.filing_date || '',
        'Publication Date': p.publication_date || '',
        'Grant Date': p.grant_date || '',
        'Expiration Date': p.expiration_date || '',
        'Years Until Expiration': p.years_until_expiration?.toFixed(2) || '',
        'Link': p.link_national || '',
        'Abstract': p.abstract || ''
      }))

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(data)

      // Set column widths
      const colWidths = [
        { wch: 15 }, // Patent Number
        { wch: 15 }, // WO Number
        { wch: 15 }, // PCT Number
        { wch: 8 },  // Country
        { wch: 12 }, // Source
        { wch: 10 }, // Status
        { wch: 12 }, // Confidence Tier
        { wch: 8 },  // Confidence Score
        { wch: 60 }, // Title
        { wch: 30 }, // Applicants
        { wch: 30 }, // Inventors
        { wch: 20 }, // IPC Codes
        { wch: 12 }, // Filing Date
        { wch: 12 }, // Publication Date
        { wch: 12 }, // Grant Date
        { wch: 12 }, // Expiration Date
        { wch: 10 }, // Years Until Expiration
        { wch: 40 }, // Link
        { wch: 80 }  // Abstract
      ]
      ws['!cols'] = colWidths

      // Apply header styling
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + '1'
        if (!ws[address]) continue
        ws[address].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "4F81BD" } },
          alignment: { horizontal: "center", vertical: "center" }
        }
      }

      // Create workbook
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Patents')

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${moleculeName.replace(/\s+/g, '_')}_patents_${timestamp}.xlsx`

      // Download file
      XLSX.writeFile(wb, filename)

      return { success: true, filename }
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  return { exportToExcel }
}
