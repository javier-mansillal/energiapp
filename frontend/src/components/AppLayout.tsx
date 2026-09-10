import { useState } from 'react'
import type { ReactNode } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'

// Layout compartido para las páginas autenticadas:
// Navbar fijo arriba, Sidebar a la izquierda (fijo en desktop, drawer en móvil),
// contenido al centro y Footer abajo.
export default function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar onMenuToggle={() => setSidebarOpen(true)} />
      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {/* En desktop el sidebar ocupa 64 (16rem) a la izquierda */}
        <div className="flex flex-1 flex-col lg:ml-64 pt-16">
          <main className="flex-1 px-6 py-8">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  )
}