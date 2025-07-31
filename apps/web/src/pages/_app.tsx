import type { AppProps } from 'next/app'
import { Inter } from 'next/font/google'
import { metadata } from '../lib/metadata'
import { ThemeProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import { UrlValidationProvider } from '@/components/url-validation-provider'
import { StorageProvider } from '@/components/storage-provider'
import { Toaster } from '@/components/ui/sonner'
import { DevelopmentDebug } from '@/components/development-debug'
import { ElectronHydrationFix } from '@/components/electron-hydration-fix'
import { ElectronErrorBoundary } from '@/components/electron-error-boundary'
import { ElectronImmediateFix } from '@/components/electron-immediate-fix'
import { ElectronRouterWrapper } from '@/components/electron-router-wrapper'
import { ElectronReactProvider } from '@/components/electron-react-provider'
// import { TanStackRouterApp } from '@/components/tanstack-router-app' // Disabled due to React conflicts
import '../styles/globals.css'
import '@/lib/electron-font-fix'
import '@/lib/debug-logger'

// TanStack Router replaces Next.js routing for better Electron compatibility
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

// =================== PHASE 4: ERROR BOUNDARY INTEGRATION ===================
// console.log('🚀 [APP] Loading OpenCut app with Electron error boundary and font fix...');

const inter = Inter({ subsets: ['latin'] })

export default function App({ Component, pageProps }: AppProps) {
  // PHASE 4: Error boundary handler
  const handleError = (error: Error, errorInfo: any) => {
    console.error('🔥 [APP] React error in Electron app:', error, errorInfo);
    
    // Add Electron-specific error context
    if (typeof window !== 'undefined' && window.electronAPI) {
      console.log('🔧 [APP] Error occurred in Electron environment');
    }
  };

  // Use same rendering for both Electron and web to avoid conflicts
  // TanStack Router disabled due to React reconciliation errors

  // Simplified rendering to avoid React conflicts
  return (
    <div className={`${inter.className} font-sans antialiased`}>
      <ThemeProvider
        attribute="class"
        forcedTheme="dark"
      >
        <TooltipProvider>
          <UrlValidationProvider>
            <StorageProvider>
              <Component {...pageProps} />
              <Toaster />
              <DevelopmentDebug />
            </StorageProvider>
          </UrlValidationProvider>
        </TooltipProvider>
      </ThemeProvider>
    </div>
  )
}

// =================== VERIFICATION PRINTS ===================
// console.log('🎯 [APP] App configuration:');
// console.log('- Error boundary: ENABLED');
// console.log('- Electron hydration fix: ENABLED');
// console.log('- Theme provider: ENABLED');
// console.log('- Storage provider: ENABLED');
// console.log('🚀 [APP] All providers and error boundaries configured');