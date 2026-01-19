import { useEffect, useRef, useState } from 'react'
import { Loader2, AlertCircle, RotateCw } from 'lucide-react'

interface MoleculeViewerProps {
  smiles?: string
  pubchemCid?: number | string
  moleculeName?: string
  width?: number
  height?: number
  backgroundColor?: string
  rotating?: boolean
}

declare global {
  interface Window {
    $3Dmol: any
  }
}

export function MoleculeViewer({ 
  smiles, 
  pubchemCid,
  moleculeName,
  width = 300, 
  height = 300,
  backgroundColor = 'white',
  rotating = true
}: MoleculeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)
  const animationRef = useRef<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let mounted = true

    const initViewer = async () => {
      try {
        setLoading(true)
        setError(null)

        // Wait for 3Dmol to be available
        let attempts = 0
        while (!window.$3Dmol && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }

        if (!window.$3Dmol) {
          setError('3Dmol não carregou')
          setLoading(false)
          return
        }

        const $3Dmol = window.$3Dmol

        // Clear previous viewer
        if (viewerRef.current) {
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
          }
          viewerRef.current.clear()
        }

        // Create viewer
        const viewer = $3Dmol.createViewer(containerRef.current, {
          backgroundColor: backgroundColor,
          antialias: true
        })
        viewerRef.current = viewer

        // Try to get 3D structure from PubChem
        let sdfData: string | null = null

        // Method 1: Use PubChem CID if available
        if (pubchemCid) {
          try {
            const response = await fetch(
              `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${pubchemCid}/SDF?record_type=3d`
            )
            if (response.ok) {
              sdfData = await response.text()
            }
          } catch (e) {
            console.log('PubChem CID fetch failed, trying other methods')
          }
        }

        // Method 2: Use molecule name
        if (!sdfData && moleculeName) {
          try {
            // First get CID from name
            const searchResponse = await fetch(
              `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(moleculeName)}/cids/JSON`
            )
            if (searchResponse.ok) {
              const searchData = await searchResponse.json()
              const cid = searchData.IdentifierList?.CID?.[0]
              if (cid) {
                const sdfResponse = await fetch(
                  `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=3d`
                )
                if (sdfResponse.ok) {
                  sdfData = await sdfResponse.text()
                }
              }
            }
          } catch (e) {
            console.log('PubChem name search failed')
          }
        }

        // Method 3: Use SMILES (2D -> generate 3D)
        if (!sdfData && smiles) {
          try {
            // Search by SMILES
            const searchResponse = await fetch(
              `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(smiles)}/cids/JSON`
            )
            if (searchResponse.ok) {
              const searchData = await searchResponse.json()
              const cid = searchData.IdentifierList?.CID?.[0]
              if (cid) {
                const sdfResponse = await fetch(
                  `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=3d`
                )
                if (sdfResponse.ok) {
                  sdfData = await sdfResponse.text()
                }
              }
            }
          } catch (e) {
            console.log('PubChem SMILES search failed')
          }
        }

        if (!mounted) return

        if (sdfData && sdfData.length > 100) {
          // Load SDF data
          viewer.addModel(sdfData, 'sdf')
          
          // Style: Ball and stick with element colors
          viewer.setStyle({}, {
            stick: { 
              radius: 0.15,
              colorscheme: 'Jmol'
            },
            sphere: { 
              scale: 0.25,
              colorscheme: 'Jmol'
            }
          })
          
          viewer.zoomTo()
          viewer.render()

          // Smooth rotation animation
          if (rotating) {
            let angle = 0
            const rotate = () => {
              if (!mounted || !viewerRef.current) return
              angle += 0.5
              viewerRef.current.rotate(0.5, { x: 0, y: 1, z: 0 })
              viewerRef.current.render()
              animationRef.current = requestAnimationFrame(rotate)
            }
            animationRef.current = requestAnimationFrame(rotate)
          }

          setLoading(false)
        } else {
          // Fallback: show placeholder with molecule info
          setError('Estrutura 3D não disponível')
          setLoading(false)
        }

      } catch (err) {
        console.error('Error initializing 3Dmol:', err)
        if (mounted) {
          setError('Erro ao carregar molécula')
          setLoading(false)
        }
      }
    }

    initViewer()

    return () => {
      mounted = false
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (viewerRef.current) {
        try {
          viewerRef.current.clear()
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }, [smiles, pubchemCid, moleculeName, backgroundColor, rotating])

  if (error) {
    return (
      <div 
        className="rounded-lg overflow-hidden border border-border bg-muted/30 flex flex-col items-center justify-center gap-2"
        style={{ width, height }}
      >
        <AlertCircle className="h-6 w-6 text-muted-foreground" />
        <span className="text-xs text-muted-foreground text-center px-2">{error}</span>
      </div>
    )
  }

  return (
    <div className="relative" style={{ width, height }}>
      {loading && (
        <div 
          className="absolute inset-0 rounded-lg overflow-hidden border border-border bg-muted/30 flex flex-col items-center justify-center gap-2 z-10"
        >
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground">Carregando 3D...</span>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="rounded-lg overflow-hidden border border-border"
        style={{ width, height, opacity: loading ? 0 : 1 }}
      />
      {rotating && !loading && !error && (
        <div className="absolute bottom-1 right-1">
          <RotateCw className="h-3 w-3 text-muted-foreground/50 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
      )}
    </div>
  )
}
