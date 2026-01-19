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

// Components
import { ProtectedRoute } from '@/components/ProtectedRoute'

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
            {/* Public routes - Landing and Auth */}
            <Route path="/" element={<LandingPage />} />
            <Route 
              path="/login" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <LoginPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/cadastro" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <SignupPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected routes - Require authentication */}
            <Route 
              path="/search" 
              element={
                <ProtectedRoute>
                  <SearchPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/results" 
              element={
                <ProtectedRoute>
                  <ResultsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/results/scientific" 
              element={
                <ProtectedRoute>
                  <ResultsScientificPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            
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
