import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

// Pages
import { LandingPage } from '@/pages/Landing'
import { LoginPage } from '@/pages/Login'
import { SignupPage } from '@/pages/Signup'
import { SearchPage } from '@/pages/Search'
import { ResultsPage } from '@/pages/Results'
import { ResultsScientificPage } from '@/pages/ResultsScientific'
import { DashboardPage } from '@/pages/Dashboard'

// Providers
import { AuthProvider } from '@/hooks/useAuth'

/**
 * React Query Client Configuration
 * 
 * Optimized for patent data caching:
 * - 5 min stale time (patent data doesn't change frequently)
 * - 30 min cache time (keep results in memory)
 * - Retry failed requests 2x
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (was cacheTime in v4)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  console.log('🚀 APP LOADED')
  console.log('📍 Current path:', window.location.pathname)
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<SignupPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/results/scientific" element={<ResultsScientificPage />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* Toast notifications */}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
