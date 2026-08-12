import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Mail, Phone, Instagram, Check, Copy, PhoneCall, User, CameraIcon, Palette, Video, Image, Music, Mic, Globe, Radio } from 'lucide-react'

export default function Resume({ isDarkMode = true, biographyImages = [], currentBiographyIndex = 0 }) {
  const [resumeData, setResumeData] = useState(null)
  const [emailCopied, setEmailCopied] = useState(false)

  useEffect(() => {
    import('../data/resume.json')
      .then((mod) => setResumeData(mod.default || mod))
      .catch(() => setResumeData(null))
  }, [])

  const themedBgStyle = isDarkMode 
    ? { background: 'linear-gradient(135deg, #0F1217 0%, #1a1d24 50%, #0F1217 100%)' }
    : { background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)' }

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(resumeData?.email || 'ricardodias2004@gmail.com')
      setEmailCopied(true)
      setTimeout(() => setEmailCopied(false), 2000)
    } catch {}
  }

  const handleCall = () => {
    window.open('tel:+5511957798732', '_self')
  }

  const renderBulletItem = (it) => {
    const colonIndex = it.indexOf(':')
    if (colonIndex !== -1) {
      const title = it.substring(0, colonIndex + 1)
      const rest = it.substring(colonIndex + 1)
      return (
        <span>
          <strong className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{title}</strong>
          {rest}
        </span>
      )
    }
    return it
  }

  return (
    <div className={`min-h-screen py-20 px-4 transition-colors duration-300`} style={themedBgStyle}>
      <div className="max-w-4xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Currículo
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Conheça minha trajetória profissional
          </p>
        </motion.div>

        <div className={`rounded-2xl p-8 shadow-2xl backdrop-blur-sm ${isDarkMode ? 'bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-gray-900/80 border border-gray-700/50' : 'bg-gradient-to-br from-white/90 via-gray-50/80 to-white/90 border border-gray-200/50'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <motion.h2 
                  className={`text-3xl font-bold mb-4 bg-gradient-to-r ${isDarkMode ? 'from-white via-gray-200 to-white bg-clip-text text-transparent' : 'from-gray-800 via-gray-600 to-gray-800 bg-clip-text text-transparent'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                  >
                    {(resumeData?.name || 'RICARDO FRESCHI').split(' ')[0]}
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    className="ml-2"
                  >
                    {(resumeData?.name || 'RICARDO FRESCHI').split(' ').slice(1).join(' ')}
                  </motion.span>
                </motion.h2>
                <p className={`text-lg font-semibold tracking-wide uppercase mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {resumeData?.title || 'FOTÓGRAFO, DESIGNER, EDITOR E VIDEOMAKER'}
                </p>
                <div className="space-y-2.5">
                  <motion.div 
                    className={`flex items-center justify-between ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div 
                      className="flex items-center cursor-pointer"
                      onClick={handleCopyEmail}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Mail className="w-4 h-4 mr-2 text-blue-400 shrink-0" />
                      <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} hover:text-blue-400 transition-colors duration-200 text-sm`}>
                        {resumeData?.email || 'ricardodias2004@gmail.com'}
                      </span>
                    </motion.div>
                    <button
                      onClick={handleCopyEmail}
                      className={`ml-2 p-1 rounded transition-colors duration-200 ${emailCopied ? 'text-green-400' : isDarkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-500'}`}
                      title={emailCopied ? 'Email copiado!' : 'Copiar email'}
                    >
                      {emailCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </motion.div>
                  <div className={`flex items-center justify-between ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-2 text-green-400 shrink-0" />
                      {(resumeData?.phone || '(11) 95779-8732')}
                    </div>
                    <motion.button
                      onClick={handleCall}
                      className={`ml-2 p-1 rounded transition-colors duration-200 md:hidden ${isDarkMode ? 'text-gray-400 hover:text-green-400' : 'text-gray-500 hover:text-green-500'}`}
                      title="Ligar"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <PhoneCall className="w-4 h-4" />
                    </motion.button>
                  </div>
                  <p className={`flex items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span className="w-4 h-4 mr-2 text-red-400 shrink-0 flex items-center justify-center">📍</span>
                    {resumeData?.address || 'Rua Barão de Tatuí, 594 - Vila Buarque'}
                  </p>
                  {resumeData?.website && (
                    <a
                      href={`https://${resumeData.website.replace(/^https?:\/\//, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center text-sm transition-colors duration-200 hover:text-blue-400 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                    >
                      <Globe className="w-4 h-4 mr-2 text-indigo-400 shrink-0" />
                      {resumeData.website}
                    </a>
                  )}
                  <div className={`flex items-center gap-2 flex-wrap pt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <div className="flex items-center shrink-0">
                      <Instagram className="w-4 h-4 mr-2 text-pink-400" />
                      <span className="text-xs font-medium">Redes Sociais</span>
                    </div>
                    <div className="flex gap-2 flex-1 min-w-0 justify-start sm:justify-end flex-wrap">
                      <motion.a 
                        href="https://instagram.com/freschi.raw" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`px-2 py-1 sm:px-3 rounded-full text-xs font-medium transition-all duration-300 hover:scale-105 flex items-center gap-1.5 whitespace-nowrap ${isDarkMode ? 'bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-orange-500/20 text-pink-300 border border-pink-500/30 hover:from-pink-500/30 hover:via-purple-500/30 hover:to-orange-500/30 hover:border-pink-400/50' : 'bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-orange-500/20 text-pink-700 border border-pink-500/30 hover:from-pink-500/30 hover:via-purple-500/30 hover:to-orange-500/30 hover:border-pink-400/50'}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        title="Fotografias"
                      >
                        <CameraIcon className="w-3.5 h-3.5" />
                        <span className="font-semibold">@freschi.raw</span>
                      </motion.a>
                      <motion.a 
                        href="https://instagram.com/freschi.jpg" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`px-2 py-1 sm:px-3 rounded-full text-xs font-medium transition-all duration-300 hover:scale-105 flex items-center gap-1.5 whitespace-nowrap ${isDarkMode ? 'bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-orange-500/20 text-pink-300 border border-pink-500/30 hover:from-pink-500/30 hover:via-purple-500/30 hover:to-orange-500/30 hover:border-pink-400/50' : 'bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-orange-500/20 text-pink-700 border border-pink-500/30 hover:from-pink-500/30 hover:via-purple-500/30 hover:to-orange-500/30 hover:border-pink-400/50'}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        title="Pessoal"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span className="font-semibold">@freschi.jpg</span>
                      </motion.a>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Resumo Profissional
                </h3>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed text-sm sm:text-base`}>
                  {resumeData?.summary}
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex justify-center lg:justify-end"
            >
              <div className="relative group">
                <div className={`w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 group-hover:shadow-3xl group-hover:scale-105 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  {biographyImages && biographyImages.length > 0 ? (
                    <AnimatePresence mode="wait">
                      <motion.img 
                        key={currentBiographyIndex}
                        src={biographyImages[currentBiographyIndex]} 
                        alt="Ricardo Freschi" 
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        loading="lazy" />
                    </AnimatePresence>
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Camera className="w-16 h-16" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-pink-500/20 to-transparent mb-8"></div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <h3 className={`text-xl font-bold mb-4 bg-gradient-to-r ${isDarkMode ? 'from-white via-gray-300 to-white bg-clip-text text-transparent' : 'from-gray-800 via-gray-600 to-gray-800 bg-clip-text text-transparent'}`}>
              Experiência Profissional
            </h3>
            <div className="space-y-6">
              {(resumeData?.experience || []).map((exp, idx) => (
                <div key={idx} className={`p-5 rounded-xl transition-all duration-300 hover:shadow-lg ${isDarkMode ? 'bg-gray-800/50 hover:bg-gray-800/70 border border-gray-700/40' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200/60'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                    <h4 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {exp.company}
                    </h4>
                    <span className={`text-sm font-medium px-3 py-1 rounded-full self-start sm:self-auto mt-1 sm:mt-0 ${isDarkMode ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/40' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                      {exp.period}
                    </span>
                  </div>
                  <p className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    {exp.role}
                  </p>

                  {exp.description && (
                    <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                      {exp.description}
                    </p>
                  )}

                  {exp.items && exp.items.length > 0 && (
                    <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {exp.items.map((it, i) => (
                        <li key={i} className="flex items-start">
                          <span className="mr-2 text-indigo-400 font-bold">•</span>
                          <span className="leading-relaxed">{renderBulletItem(it)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent mb-8"></div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-8"
          >
            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Habilidades Técnicas
            </h3>
            <div className="space-y-6">
              <div>
                <h4 className={`text-base font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Programas & Ferramentas
                </h4>
                <div className="flex flex-wrap gap-2.5">
                  {(resumeData?.skillsPrograms || []).map((name, index) => {
                    const iconMap = { 
                      'Adobe Photoshop': Palette, 
                      'Adobe Premiere Pro': Video, 
                      'Adobe Illustrator': Image, 
                      'Adobe Lightroom': Image,
                      'Adobe Lightroom Classic': Image, 
                      'REAPER': Music, 
                      'OBS Studio': Radio, 
                      'Audacity': Mic
                    }
                    const IconCmp = iconMap[name] || Palette
                    return (
                      <span
                        key={index}
                        className={`px-3.5 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-md ${isDarkMode ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 hover:from-indigo-500/30 hover:to-purple-500/30' : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200 hover:from-indigo-100 hover:to-purple-100'}`}
                      >
                        <IconCmp className="w-4 h-4 text-indigo-400 shrink-0" />
                        {name}
                      </span>
                    )
                  })}
                </div>
              </div>

              <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent my-4"></div>

              <div>
                <h4 className={`text-base font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Conhecimentos Específicos
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(resumeData?.skillsSpecific || []).map((s, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800/40 border-gray-700/40' : 'bg-gray-50 border-gray-200/60'}`}>
                      <p className={`font-bold text-sm mb-1.5 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {s.title}
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                        {s.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent mb-8"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Formação Acadêmica
              </h3>
              <div className="space-y-3">
                {(resumeData?.education || []).map((ed, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/40' : 'bg-gray-50 border-gray-200/60'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {ed.institution}
                      </h4>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${isDarkMode ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/40' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'}`}>
                        {ed.year}
                      </span>
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {ed.course}
                    </p>
                    {ed.desc && (
                      <p className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {ed.desc}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Idiomas
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(resumeData?.languages || []).map((lang, i) => (
                  <div key={i} className={`p-4 rounded-xl border text-center transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-gray-800/50 border-gray-700/40' : 'bg-gray-50 border-gray-200/60'}`}>
                    <h4 className={`font-bold text-base mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {lang.name}
                    </h4>
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                      {lang.level}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent mb-8"></div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center"
          >
            <button
              onClick={() => {
                const link = document.createElement('a')
                link.href = './curriculo-ricardo-freschi.pdf'
                link.download = 'Curriculo-Ricardo-Freschi-2025.pdf'
                link.target = '_blank'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }}
              className={`inline-flex items-center px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden group ${isDarkMode ? 'bg-gradient-to-r from-white to-gray-200 hover:from-gray-200 hover:to-white text-gray-900' : 'bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white'}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <Camera className="w-5 h-5 mr-2" />
              Baixar Currículo PDF
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
