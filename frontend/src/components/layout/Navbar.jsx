import { Link } from 'react-router'
import { Search, Plus, MonitorPlay, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'

export function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth()

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6 gap-4">
        {/* Logo/Brand */}
        <div className="flex items-center gap-4 min-w-0 pr-4">
          <Link to="/" className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1 -ml-1">
            <div className="bg-primary p-1.5 rounded-lg">
              <MonitorPlay className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden sm:inline-block font-display font-bold text-lg tracking-tight">HexaNodes</span>
          </Link>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-2xl mx-auto flex items-center justify-center px-2">
          <form className="w-full max-w-[600px] relative hidden sm:flex" action="/">
            <div className="relative w-full flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <Input 
                name="q"
                type="search" 
                placeholder="Search videos..." 
                className="w-full pl-9 bg-muted/50 border-transparent hover:border-border focus:border-border rounded-full h-10 shadow-none transition-colors"
                autoComplete="off"
              />
            </div>
          </form>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 md:gap-4 shrink-0">
          <Button variant="ghost" size="icon" className="sm:hidden text-muted-foreground hover:text-foreground">
            <Search className="h-5 w-5" />
          </Button>

          {user ? (
            <>
              <Link to="/upload" className="hidden sm:block">
                <Button size="sm" className="gap-2 h-9 rounded-full">
                  <Plus className="h-4 w-4" /> Upload
                </Button>
              </Link>
              
              <Link to="/upload" className="sm:hidden">
                <Button variant="ghost" size="icon">
                  <Plus className="h-5 w-5" />
                </Button>
              </Link>

              <div className="group relative">
                <button className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full">
                  <Avatar alt={user.username} className="h-8 w-8 cursor-pointer ring-2 ring-transparent transition-all group-hover:ring-border" />
                </button>
                <div className="absolute right-0 top-[calc(100%+0.5rem)] w-56 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                  <div className="p-3 border-b border-border">
                    <p className="font-medium text-sm truncate">{user.fullName || user.username}</p>
                    <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                  </div>
                  <div className="p-1">
                    <Link to={`/channel/${user.username}`} className="block px-3 py-2 text-sm rounded-md hover:bg-muted font-medium transition-colors">Your Channel</Link>
                    <Link to="/dashboard" className="block px-3 py-2 text-sm rounded-md hover:bg-muted font-medium transition-colors">Dashboard</Link>
                  </div>
                  <div className="p-1 border-t border-border">
                    <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-destructive rounded-md hover:bg-destructive/10 font-medium flex items-center gap-2 transition-colors">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex rounded-full">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="rounded-full shadow-sm">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
