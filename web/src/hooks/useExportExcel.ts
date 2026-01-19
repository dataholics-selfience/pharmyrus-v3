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
  const exportToExcel = async (patents: Patent[], moleculeName: string) => {
    try {
      // Dynamically import xlsx
      const XLSX = await import('xlsx')
      
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
        { wch: 18 }, // Patent Number
        { wch: 18 }, // WO Number
        { wch: 18 }, // PCT Number
        { wch: 8 },  // Country
        { wch: 15 }, // Source
        { wch: 12 }, // Status
        { wch: 14 }, // Confidence Tier
        { wch: 10 }, // Confidence Score
        { wch: 60 }, // Title
        { wch: 35 }, // Applicants
        { wch: 30 }, // Inventors
        { wch: 25 }, // IPC Codes
        { wch: 12 }, // Filing Date
        { wch: 14 }, // Publication Date
        { wch: 12 }, // Grant Date
        { wch: 14 }, // Expiration Date
        { wch: 12 }, // Years Until Expiration
        { wch: 50 }, // Link
        { wch: 100 } // Abstract
      ]
      ws['!cols'] = colWidths

      // Create workbook
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Patents')

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${moleculeName.replace(/\s+/g, '_')}_patents_${timestamp}.xlsx`

      // Download file using writeFileXLSX for better browser compatibility
      XLSX.writeFile(wb, filename, { bookType: 'xlsx' })

      console.log('✅ Excel exportado com sucesso:', filename)
      return { success: true, filename }
    } catch (error) {
      console.error('❌ Error exporting to Excel:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Alternative: Export as CSV (fallback)
  const exportToCSV = (patents: Patent[], moleculeName: string) => {
    try {
      const headers = [
        'Patent Number', 'WO Number', 'PCT Number', 'Country', 'Source', 
        'Status', 'Confidence Tier', 'Confidence Score', 'Title', 
        'Applicants', 'Inventors', 'IPC Codes', 'Filing Date', 
        'Publication Date', 'Grant Date', 'Expiration Date', 
        'Years Until Expiration', 'Link', 'Abstract'
      ]

      const rows = patents.map(p => [
        p.patent_number || '',
        p.wo_number || '',
        p.pct_number || '',
        p.country || '',
        p.source || '',
        p.patent_status || '',
        p.confidence_tier || '',
        p.confidence_score?.toFixed(2) || '',
        `"${(p.title || '').replace(/"/g, '""')}"`,
        `"${(Array.isArray(p.applicants) ? p.applicants.join('; ') : '').replace(/"/g, '""')}"`,
        `"${(Array.isArray(p.inventors) ? p.inventors.join('; ') : '').replace(/"/g, '""')}"`,
        `"${(Array.isArray(p.ipc_codes) ? p.ipc_codes.join('; ') : '').replace(/"/g, '""')}"`,
        p.filing_date || '',
        p.publication_date || '',
        p.grant_date || '',
        p.expiration_date || '',
        p.years_until_expiration?.toFixed(2) || '',
        p.link_national || '',
        `"${(p.abstract || '').replace(/"/g, '""')}"`
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${moleculeName.replace(/\s+/g, '_')}_patents_${timestamp}.csv`
      
      link.href = URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      return { success: true, filename }
    } catch (error) {
      console.error('Error exporting to CSV:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  return { exportToExcel, exportToCSV }
}
