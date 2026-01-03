import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'

// Componente de Currículo desacoplado do app
// Espera: src/data/resume.json e imagens em src/assets/biography/*

export default function Resume({ isDarkMode = true }) {
  const [resume, setResume] = useState(null)

  useEffect(() => {
    async function load() {
      const mod = await import('../../src/data/resume.json')
      setResume(mod.default || mod)
    }
    load()
  }, [])

  const biographyImages = useMemo(() => {
    const modules = import.meta.glob('../../src/assets/biography/*.{jpg,jpeg,png}', { eager: true })
    return Object.values(modules).map((m) => m.default)
  }, [])

  if (!resume) return null

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className={`grid md:grid-cols-2 gap-8 items-start`}>
        <div className="space-y-6 order-2 md:order-1">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{resume.personal.name}</h1>
          <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{resume.summary}</p>

          <section>
            <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Habilidades Técnicas</h2>
            <ul className="grid sm:grid-cols-2 gap-2">
              {resume.skills.technical.map((skill) => (
                <li key={skill} className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{skill}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Educação</h2>
            <ul className="space-y-2">
              {resume.education.map((edu, idx) => (
                <li key={idx} className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="font-medium">{edu.course}</span> — {edu.institution}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="order-1 md:order-2">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative">
            {biographyImages[0] && (
              <img src={biographyImages[0]} alt="Foto" className="w-full h-auto rounded-xl shadow-2xl object-cover" />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}


