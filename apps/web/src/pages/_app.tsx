import type { AppProps } from 'next/app'
import { Inter } from 'next/font/google'
import { metadata } from '../lib/metadata'
import { ThemeProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import { UrlValidationProvider } from '@/components/url-validation-provider'
import { StorageProvider } from '@/components/storage-provider'
import { Toaster } from '@/components/ui/sonner'
import { DevelopmentDebug } from '@/components/development-debug'
import { ElectronRouter } from '@/lib/electron-router'
import '../styles/globals.css'
import '@/lib/electron-font-fix'
import '@/lib/debug-logger'

// TanStack Router replaces Next.js routing for better Electron compatibility
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

// =================== PHASE 4: ERROR BOUNDARY INTEGRATION ===================
// console.log('🚀 [APP] Loading OpenCut app with Electron error boundary and font fix...');

const inter = Inter({ subsets: ['latin'] })

export default function App({ Component, pageProps }: AppProps) {
  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI

  if (isElectron) {
    // Electron: Use Hash Router
    return (
      <div className={`${inter.className} font-sans antialiased`}>
        <ThemeProvider attribute="class" forcedTheme="dark">
          <TooltipProvider>
            <UrlValidationProvider>
              <StorageProvider>
                <ElectronRouter>
                  <Toaster />
                  <DevelopmentDebug />
                </ElectronRouter>
              </StorageProvider>
            </UrlValidationProvider>
          </TooltipProvider>
        </ThemeProvider>
      </div>
    )
  }

  // Web: Keep existing structure unchanged
  return (
    <div className={`${inter.className} font-sans antialiased`}>
      <ThemeProvider attribute="class" forcedTheme="dark">
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