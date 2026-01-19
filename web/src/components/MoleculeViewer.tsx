import { useEffect, useRef } from 'react'

interface MoleculeViewerProps {
  smiles?: string
  pdbId?: string
  width?: number
  height?: number
  backgroundColor?: string
  rotating?: boolean
}

export function MoleculeViewer({ 
  smiles, 
  pdbId,
  width = 300, 
  height = 300,
  backgroundColor = 'white',
  rotating = true
}: MoleculeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Dynamically import 3Dmol
    const load3Dmol = async () => {
      try {
        // @ts-ignore - 3Dmol is loaded via CDN
        const $3Dmol = window.$3Dmol
        
        if (!$3Dmol) {
          console.warn('3Dmol.js not loaded')
          return
        }

        // Clear previous viewer
        if (viewerRef.current) {
          viewerRef.current.clear()
        }

        const config = { 
          backgroundColor: backgroundColor
        }
        
        const viewer = $3Dmol.createViewer(containerRef.current, config)
        viewerRef.current = viewer

        if (smiles) {
          // Convert SMILES to 3D structure
          // Note: This requires a backend service or RDKit.js
          // For now, show a simple representation
          viewer.addModel(`\nGenerated from SMILES: ${smiles}\n`, 'xyz')
          viewer.setStyle({}, { stick: { colorscheme: 'Jmol' } })
          viewer.zoomTo()
          viewer.render()
          
          if (rotating) {
            viewer.rotate(360, { x: 0, y: 1, z: 0 }, 20000)
          }
        } else if (pdbId) {
          // Load from PDB
          $3Dmol.download(`pdb:${pdbId}`, viewer, {}, () => {
            viewer.setStyle({}, { cartoon: { color: 'spectrum' } })
            viewer.zoomTo()
            viewer.render()
            
            if (rotating) {
              viewer.spin(true)
            }
          })
        } else {
          // Default molecule placeholder
          viewer.addModel('PLACEHOLDER', 'xyz')
          viewer.setStyle({}, { sphere: { colorscheme: 'Jmol', radius: 0.5 } })
          viewer.zoomTo()
          viewer.render()
        }
      } catch (error) {
        console.error('Error loading 3Dmol:', error)
      }
    }

    load3Dmol()

    return () => {
      if (viewerRef.current) {
        viewerRef.current.clear()
      }
    }
  }, [smiles, pdbId, backgroundColor, rotating])

  return (
    <div 
      ref={containerRef} 
      className="rounded-lg overflow-hidden border border-border"
      style={{ width, height }}
    />
  )
}
