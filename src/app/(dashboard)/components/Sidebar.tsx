'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cerrarSesion } from '../actions'

const ITEMS_MENU = [
  { href: '/dashboard', etiqueta: 'Inicio', icono: '🏠' },
  { href: '/prendas/nueva', etiqueta: 'Nueva Prenda', icono: '➕' },
  { href: '/tramites', etiqueta: 'Trámites', icono: '📋' },
  { href: '/impresoras', etiqueta: 'Impresoras', icono: '🖨️' },
]

interface SidebarProps {
  email: string
}

export default function Sidebar({ email }: SidebarProps) {
  const pathname = usePathname()
  const [abierto, setAbierto] = useState(false)

  function estaActivo(href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <span className="text-sm font-semibold text-gray-900">Folio</span>
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        >
          <span className="text-xl leading-none">☰</span>
        </button>
      </div>

      {abierto && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setAbierto(false)} />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#1B4F8A] text-white transition-transform duration-200 lg:translate-x-0',
          abierto ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <span className="text-lg font-semibold">Folio</span>
          <button
            type="button"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar menú"
            className="rounded-lg p-1 text-white/80 hover:bg-white/10 lg:hidden"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {ITEMS_MENU.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setAbierto(false)}
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                estaActivo(item.href)
                  ? 'bg-white/15 text-white'
                  : 'text-white/80 hover:bg-white/10 hover:text-white',
              ].join(' ')}
            >
              <span className="text-lg leading-none">{item.icono}</span>
              {item.etiqueta}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <p className="mb-3 truncate text-xs text-white/70">{email}</p>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-white/90 hover:bg-white/10"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
