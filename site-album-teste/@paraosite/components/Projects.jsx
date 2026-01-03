import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'

// Seção de "Outros Projetos" com filtros, skeleton e hover
// Espera: textos em src/assets/projects/**/*.txt (query '?raw'), imagem Friday Night em src/assets/projects/friday-night-club/Friday-BG.jpg

function parseProject(raw) {
  // Formato simples: primeira linha título, segunda descrição, terceira URL (opcional)
  const lines = raw.split(/\r?\n/)
  const title = lines[0]?.trim() || 'Projeto'
  const description = lines[1]?.trim() || ''
  const url = lines[2]?.trim() || ''
  return { title, description, url }
}

export default function Projects({ isDarkMode = true }) {
  const [activeFilter, setActiveFilter] = useState('todos')
  const [isLoading, setIsLoading] = useState(false)

  const projectEntries = useMemo(() => {
    const modules = import.meta.glob('../../src/assets/projects/**/*.txt', { eager: true, query: '?raw', import: 'default' })
    return Object.entries(modules).map(([path, raw]) => {
      const data = parseProject(raw)
      const slug = path.split('/').pop().replace(/\.txt$/, '')
      let cover = ''
      if (path.includes('friday-night-club')) {
        const imgs = import.meta.glob('../../src/assets/projects/friday-night-club/*.{jpg,jpeg,png}', { eager: true })
        const first = Object.values(imgs)[0]
        // @ts-ignore
        cover = first?.default || ''
      }
      return { ...data, slug, cover }
    })
  }, [])

  const filtered = useMemo(() => {
    if (activeFilter === 'todos') return projectEntries
    return projectEntries.filter((p) => p.slug.includes(activeFilter))
  }, [activeFilter, projectEntries])

  const filters = ['todos', 'tiktok', 'outros']

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => { setIsLoading(true); setActiveFilter(f); setTimeout(() => setIsLoading(false), 250) }}
            className={`px-3 py-1 rounded-full text-sm border ${activeFilter === f ? 'bg-white/10 border-white/40' : 'border-white/20 hover:bg-white/5'} ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            aria-pressed={activeFilter === f}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-white/10 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <motion.a
              key={p.slug}
              href={p.url || undefined}
              target={p.url ? '_blank' : undefined}
              rel={p.url ? 'noopener noreferrer' : undefined}
              className="group rounded-xl overflow-hidden border border-white/10 bg-white/[0.02] focus:outline-none focus:ring-2 focus:ring-white/40"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="h-40 relative">
                {p.cover ? (
                  <img src={p.cover} alt="capa" className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40">sem imagem</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              <div className="p-3">
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{p.title}</h3>
                {p.description && (
                  <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{p.description}</p>
                )}
                {p.url && (
                  <div className="mt-3">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border border-white/20 hover:border-white/40"
                    >
                      Abrir
                    </a>
                  </div>
                )}
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </div>
  )
}


