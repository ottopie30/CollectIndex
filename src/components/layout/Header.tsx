'use client'

import { useState } from 'react'
import { Search, Bell, User, Moon, Sun } from 'lucide-react'

export function Header() {
    const [searchQuery, setSearchQuery] = useState('')

    return (
        <header className="h-16 bg-black/20 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6">
            {/* Search bar */}
            <div className="flex-1 max-w-xl">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                        type="text"
                        placeholder="Rechercher une carte (ex: Charizard, Pikachu...)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-4 ml-6">
                {/* Notifications */}
                <button className="relative p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                {/* User menu */}
                <button className="flex items-center gap-3 p-2 pr-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-white">Mon compte</span>
                </button>
            </div>
        </header>
    )
}
