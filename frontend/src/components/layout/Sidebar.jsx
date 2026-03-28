import { NavLink } from 'react-router'
import { motion } from 'motion/react'
import { Home, Compass, Radio, LayoutDashboard, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { name: 'Home', to: '/', icon: Home, end: true },
  { type: 'divider' },
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Settings', to: '/settings', icon: Settings },
]

export function Sidebar({ className }) {
  return (
    <aside className={cn("flex flex-col w-64 border-r border-border bg-background py-4 flex-shrink-0", className)}>
      <nav className="flex-1 space-y-1.5 px-3">
        {links.map((link, i) => {
          if (link.type === 'divider') {
            return <div key={i} className="my-4 h-px bg-border" />
          }
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-lg bg-muted border border-border/50"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-3">
                    <link.icon className={cn("h-4 w-4", isActive ? 'text-primary' : 'text-muted-foreground')} />
                    {link.name}
                  </div>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
      
      <div className="px-6 py-4 mt-auto">
        <p className="text-xs text-muted-foreground">© 2026 HexaNodes.</p>
      </div>
    </aside>
  )
}
