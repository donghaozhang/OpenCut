import NextLink from 'next/link'

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
  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI

  if (isElectron) {
    // Use direct navigation in Electron
    return (
      <div
        className={className}
        style={{ ...style, cursor: 'pointer' }}
        onClick={(e) => {
          e.preventDefault()
          
          // Simple client-side navigation
          window.history.pushState({}, '', href)
          window.location.reload()
          
          if (onClick) onClick(e)
        }}
      >
        {children}
      </div>
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