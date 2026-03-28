import { Outlet } from 'react-router'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

export function Layout() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground transition-colors">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar className="hidden md:flex" />
        <main className="flex-1 overflow-y-auto w-full p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
