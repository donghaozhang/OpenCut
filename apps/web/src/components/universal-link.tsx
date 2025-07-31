import NextLink from 'next/link'
import { Link as ReactRouterLink } from 'react-router-dom'

interface UniversalLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: (e: React.MouseEvent) => void
  prefetch?: boolean
}

export function UniversalLink({ 
  href, 
  children, 
  className, 
  style, 
  onClick, 
  prefetch = false 
}: UniversalLinkProps) {
  // SSR-safe Electron detection with multiple checks
  const isElectron = typeof window !== 'undefined' && (
    (window as any).electronAPI || 
    (window as any).electron ||
    (typeof navigator !== 'undefined' && navigator?.userAgent?.includes('Electron'))
  )

  // Remove debug logging
  // Only log in browser environment
  // if (typeof window !== 'undefined') {
  //   console.log('🔄 UniversalLink render:', { 
  //     href, 
  //     isElectron, 
  //     hasElectronAPI: !!(window as any)?.electronAPI,
  //     hasElectron: !!(window as any)?.electron,
  //     userAgent: typeof navigator !== 'undefined' ? navigator?.userAgent?.includes('Electron') : false
  //   })
  // }

  if (isElectron) {
    // Remove debug logging
    // if (typeof window !== 'undefined') {
    //   console.log('✅ UniversalLink: Using manual hash navigation for href:', href)
    // }
    // Use manual hash navigation for Electron (more reliable than ReactRouterLink)
    return (
      <button
        className={className}
        style={{
          ...style,
          background: 'transparent',
          border: 'none',
          padding: 0,
          margin: 0,
          outline: 'none',
          cursor: 'pointer'
        }}
        onClick={(e) => {
          e.preventDefault()
          // Remove debug logging
          // console.log('🔥 Manual hash navigation to:', href)
          if (typeof window !== 'undefined') {
            window.location.hash = href
          }
          if (onClick) onClick(e)
        }}
      >
        {children}
      </button>
    )
  }
  // Use Next.js Link in web
  return (
    <NextLink
      href={href}
      className={className}
      style={style}
      onClick={onClick}
      prefetch={prefetch}
    >
      {children}
    </NextLink>
  )
}