import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

interface SearchResult {
  metadata: {
    search_id?: string
    molecule_name: string
    brand_name?: string
    search_date?: string
    target_countries?: string[]
    elapsed_seconds?: number
    version?: string
  }
  patent_discovery: {
    summary: {
      total_patents: number
    }
    patent_cliff?: {
      status?: string
      first_expiration?: string
    }
  }
  research_and_development?: {
    molecular_data?: {
      smiles?: string
    }
  }
}

export function useSearchHistory() {
  const { user } = useAuth()

  /**
   * Save a search result to history
   */
  const saveToHistory = async (result: SearchResult) => {
    if (!user) {
      console.log('⚠️ No user logged in, skipping history save')
      return null
    }

    try {
      const historyRef = collection(db, 'search_history')
      const searchId = result.metadata.search_id || `${Date.now()}_${result.metadata.molecule_name}`
      const docId = `${user.uid}_${searchId}`
      
      const historyItem = {
        // Metadata
        id: docId,
        user_id: user.uid,
        search_id: searchId,
        
        // Molecule info
        molecule_name: result.metadata.molecule_name,
        brand_name: result.metadata.brand_name || null,
        smiles: result.research_and_development?.molecular_data?.smiles || null,
        
        // Search details
        search_date: result.metadata.search_date || new Date().toISOString(),
        countries: result.metadata.target_countries || ['BR'],
        
        // Results summary
        total_patents: result.patent_discovery?.summary?.total_patents || 0,
        patent_cliff_status: result.patent_discovery?.patent_cliff?.status || null,
        first_expiration: result.patent_discovery?.patent_cliff?.first_expiration || null,
        
        // Cache the full result for quick reload (optional - may be large)
        cached_result: result,
        
        // Timestamps
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      }

      await setDoc(doc(historyRef, docId), historyItem, { merge: true })
      
      console.log('✅ Search saved to history:', {
        molecule: result.metadata.molecule_name,
        patents: result.patent_discovery?.summary?.total_patents
      })
      
      return docId
    } catch (error) {
      console.error('❌ Error saving to history:', error)
      return null
    }
  }

  return { saveToHistory }
}
