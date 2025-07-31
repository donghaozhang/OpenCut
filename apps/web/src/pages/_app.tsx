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
import { useState, useEffect } from 'react'
import '@/lib/electron-debug-trace'
import '../styles/globals.css'
import '@/lib/electron-font-fix'
import '@/lib/debug-logger'
import '@/lib/electron-runtime-patch'

// =================== PHASE 4: ERROR BOUNDARY INTEGRATION ===================
// console.log('🚀 [APP] Loading OpenCut app with Electron error boundary and font fix...');

const inter = Inter({ subsets: ['latin'] })

export default function App({ Component, pageProps }: AppProps) {
  // Use runtime detection instead of build-time detection
  const [isElectron, setIsElectron] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This runs in the browser after hydration
    const debugLog = (window as any).__electronDebugLog || console.log;
    debugLog('APP_USEEFFECT_START');
    
    setIsClient(true);
    const electronDetected = typeof window !== 'undefined' && !!(window as any).electronAPI;
    setIsElectron(electronDetected);
    
    const detectionData = {
      isClient: true,
      electronAPI: (window as any).electronAPI,
      isElectron: electronDetected,
      href: window.location.href,
      hash: window.location.hash,
      userAgent: navigator.userAgent
    };
    
    console.log('🔧 [APP] Runtime detection:', detectionData);
    debugLog('APP_RUNTIME_DETECTION', detectionData);
  }, []);

  // For static export builds, we need to render immediately to allow hydration
  // The loading state prevents React hydration from completing
  const shouldShowLoading = typeof window === 'undefined'; // Only show loading during SSR
  
  if (shouldShowLoading) {
    return (
      <div className={`${inter.className} font-sans antialiased`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading OpenCut...</p>
          </div>
        </div>
      </div>
    );
  }

  const debugLog = (window as any).__electronDebugLog || console.log;
  
  if (isElectron) {
    console.log('🚀 [APP] Loading Electron version with HashRouter');
    debugLog('APP_RENDERING_ELECTRON', { isElectron, isClient });
    
    // Electron: Use Hash Router
    return (
      <div className={`${inter.className} font-sans antialiased`}>
        <div style={{position: 'fixed', top: '10px', right: '10px', background: 'red', color: 'white', padding: '5px', zIndex: 99999}}>
          ELECTRON MODE
        </div>
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

  console.log('🌐 [APP] Loading Web version with Next.js routing');
  debugLog('APP_RENDERING_WEB', { isElectron, isClient });
  
  // Web: Keep existing structure unchanged
  return (
    <div className={`${inter.className} font-sans antialiased`}>
      <div style={{position: 'fixed', top: '10px', right: '10px', background: 'blue', color: 'white', padding: '5px', zIndex: 99999}}>
        WEB MODE
      </div>
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