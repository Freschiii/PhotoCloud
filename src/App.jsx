import { useState, useEffect, useRef } from 'react'
import { HashRouter as Router, Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Camera, Mail, Phone, Instagram, Sun, Moon, ChevronLeft, ChevronRight, Aperture, ArrowLeft, Folder, Plus, Film, Trash2, AlertTriangle, RotateCcw, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import ClientGallery from './components/ClientGallery.jsx'
import Resume from './components/Resume.jsx'
import ClientList from './components/ClientList.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import TestProjectsPage from './components/TestProjectsPage.jsx'
import { getClientById } from './lib/clientsManifest.js'
import { supabase, isSupabaseConfigured } from './lib/supabase.js'
import './App.css'

// Componente para controlar a rolagem da página
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

// Import da imagem hero
import heroImage from './assets/IMG_9998.jpg'

// Função para importar dinamicamente todas as imagens da pasta assets
function importAllImages() {
  const images = {}
  
  // Importa todas as imagens JPG da pasta assets
  const imageModules = import.meta.glob('./assets/*.jpg', { eager: true })
  
  Object.keys(imageModules).forEach((path) => {
    const imageName = path.replace('./assets/', '').replace('.jpg', '')
    images[imageName] = imageModules[path].default
  })
  
  return images
}

// Função para importar imagens de fundo
function importBackgroundImages() {
  const backgrounds = []
  const backgroundModules = import.meta.glob('./assets/backgrounds/*.{jpg,jpeg,png}', { eager: true })
  Object.keys(backgroundModules).forEach((path) => {
    backgrounds.push(backgroundModules[path].default)
  })
  return backgrounds
}

// Função para importar fotos da biografia
function importBiographyImages() {
  const biographyImages = []
  const biographyModules = import.meta.glob('./assets/biography/*.{jpg,jpeg,png}', { eager: true })
  Object.keys(biographyModules).forEach((path) => {
    biographyImages.push(biographyModules[path].default)
  })
  return biographyImages
}

// Carrega arquivos .txt de projetos e transforma em objetos de projeto
function parseProjectTxt(rawText, filePath) {
  // Parse simples baseado em linhas chave: valor
  const lines = rawText.split(/\r?\n/)
  const data = { title: '', description: '', youtube: '', videoFile: '', role: '', year: '', id: filePath }
  let collectingDescription = false
  let descriptionBuffer = []

  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-zÀ-ÿ_ ]+)\s*:\s*(.*)$/)
    if (match) {
      const key = match[1].trim().toLowerCase()
      const value = match[2].trim()
      collectingDescription = false
      if (key === 'título' || key === 'titulo' || key === 'title') data.title = value
      else if (key === 'descrição' || key === 'descricao' || key === 'description') {
        collectingDescription = true
        descriptionBuffer = value ? [value] : []
      } else if (key === 'youtube' || key === 'link' || key === 'url' || key === 'tiktok') data.youtube = value
      else if (key === 'videofile' || key === 'arquivo' || key === 'arquivo de vídeo' || key === 'arquivo de video') data.videoFile = value
      else if (key === 'função' || key === 'funcao' || key === 'role') data.role = value
      else if (key === 'ano' || key === 'year') data.year = value
    } else if (collectingDescription) {
      descriptionBuffer.push(line)
    }
  }
  if (descriptionBuffer.length) data.description = descriptionBuffer.join('\n').trim()
  return data
}

function importProjectTexts() {
  // Lê todos .txt em assets/projects
  const projectTxtModules = import.meta.glob('./assets/projects/**/*.txt', { eager: true, query: '?raw', import: 'default' })
  const projects = []
  Object.entries(projectTxtModules).forEach(([path, raw]) => {
    try {
      const parsed = parseProjectTxt(raw, path)
      // Só adiciona se tiver título válido
      if (parsed.title && parsed.title.trim() !== '') {
        projects.push({
          id: parsed.id,
          title: parsed.title,
          description: parsed.description || '',
          videoUrl: parsed.youtube || '',
          videoFile: parsed.videoFile || '',
          role: parsed.role || '',
          year: parsed.year || ''
        })
      }
    } catch (e) {
      // Em caso de erro de parsing, ignora arquivo
    }
  })
  return projects
}

// Função para categorizar imagens baseado no nome
function categorizeImage(imageName) {
  // Imagens que começam com IMG_ são geralmente retratos
  if (imageName.startsWith('IMG_')) {
    return 'retratos'
  }
  
  // Imagens que começam com RIK- são categorizadas por número
  if (imageName.startsWith('RIK-')) {
    const number = parseInt(imageName.split('-')[1])
    
    // Eventos: números específicos
    if ([4487, 4501, 4504, 4508, 6640, 6663, 6672, 6682, 6715].includes(number)) {
      return 'eventos'
    }
    
    // Grupos: números específicos
    if ([4512, 4513, 4515].includes(number)) {
      return 'grupos'
    }
    
    // Paisagens: números específicos
    if ([3694, 6631, 6696].includes(number)) {
      return 'paisagens'
    }
    
    // Novas imagens (6452, 6478, 6479, 6744) - categorizar como retratos por padrão
    if ([6452, 6478, 6479, 6744].includes(number)) {
      return 'retratos'
    }
    
    // Demais imagens RIK- são retratos por padrão
    return 'retratos'
  }
  
  // Padrão: retratos
  return 'retratos'
}

// Função para gerar alt text baseado na categoria
function generateAltText(category, imageName) {
  const altTexts = {
    'retratos': 'Retrato profissional',
    'eventos': 'Fotografia de evento',
    'grupos': 'Fotografia de grupo',
    'paisagens': 'Fotografia de paisagem'
  }
  
  return altTexts[category] || 'Fotografia profissional'
}

// Função para embaralhar array usando Fisher-Yates shuffle
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Gera a galeria dinamicamente
function generateGalleryImages() {
  const allImages = importAllImages()
  const galleryImages = []
  
  Object.keys(allImages).forEach((imageName) => {
    // Pula a imagem hero
    if (imageName === 'IMG_9998') return
    
    const category = categorizeImage(imageName)
    const altText = generateAltText(category, imageName)
    
    galleryImages.push({
      src: allImages[imageName],
      category: category,
      alt: altText,
      name: imageName
    })
  })
  
  // Embaralha as imagens para ordem aleatória
  return shuffleArray(galleryImages)
}

// Gera a galeria dinamicamente
const galleryImages = generateGalleryImages()

// Wrapper para ClientGallery com React Router
function ClientGalleryWrapper({ isDarkMode }) {
  const { clientId } = useParams()
  const navigate = useNavigate()
  
  // Busca as informações do cliente pelo ID
  const clientInfo = getClientById(clientId)
  const displayName = clientInfo ? clientInfo.name : clientId
  
  return (
    <ClientGallery 
      clientName={clientId} 
      displayName={displayName}
      isDarkMode={isDarkMode} 
      onBack={() => navigate('/clientes')} 
    />
  )
}

function Navigation({ isDarkMode, toggleDarkMode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  
  const getCurrentPage = () => {
    if (location.pathname === '/') return 'home'
    if (location.pathname === '/galeria') return 'galeria'
    if (location.pathname === '/clientes') return 'clientes'
    if (location.pathname.startsWith('/cliente/')) return 'cliente'
    if (location.pathname === '/projetos') return 'projetos'
    if (location.pathname === '/curriculo') return 'curriculo'
    if (location.pathname === '/contato') return 'contato'
    if (location.pathname === '/admin') return 'admin'
    return 'home'
  }
  
  const currentPage = getCurrentPage()
  
  const handlePageChange = (page) => {
    switch (page) {
      case 'home':
        navigate('/')
        break
      case 'galeria':
        navigate('/galeria')
        break
      case 'clientes':
        navigate('/clientes')
        break
      case 'projetos':
        navigate('/projetos')
        break
      case 'curriculo':
        navigate('/curriculo')
        break
      case 'contato':
        navigate('/contato')
        break
      case 'admin':
        navigate('/admin')
        break
      default:
        navigate('/')
    }
    setIsMenuOpen(false)
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
      isDarkMode 
        ? 'border-gray-700' 
        : 'bg-white/90 border-gray-200'
    }`} style={isDarkMode ? { backgroundColor: 'rgba(7, 9, 13, 0.9)' } : {}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 relative">
          {/* Left group: Área do Cliente */}
          <div className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => handlePageChange('clientes')}
              className={`font-medium transition-colors duration-200 ${
                currentPage === 'clientes'
                  ? `${isDarkMode ? 'text-blue-400' : 'text-blue-600'} font-semibold`
                  : `${isDarkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-500 hover:text-blue-600'} text-sm`
              }`}
            >
              Área do Cliente
            </button>
          </div>

          {/* Center icon */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
            <button
              onClick={() => handlePageChange('home')}
              className="p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Ir para Home"
            >
              <Aperture className={`h-7 w-7 ${isDarkMode ? 'text-white' : 'text-gray-800'}`} />
            </button>
          </div>

          {/* Right group: home/galeria/projetos/contato + dark toggle (desktop) */}
          <div className="hidden md:flex items-center space-x-8">
            {['home', 'galeria', 'projetos', 'contato', 'curriculo'].map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`capitalize font-medium transition-colors duration-200 ${
                  currentPage === page 
                    ? `${isDarkMode ? 'text-white border-white' : 'text-gray-800 border-gray-800'} border-b-2` 
                    : `${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`
                }`}
              >
                {page === 'curriculo' ? 'currículo' : page}
              </button>
            ))}
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Controls */}
          {/* Left: Dark Mode Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
          
          {/* Right: Hamburger */}
          <div className="md:hidden flex items-center ml-auto">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? 
                <X className={`h-6 w-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`} /> : 
                <Menu className={`h-6 w-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`} />
              }
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`md:hidden absolute top-full left-0 right-0 z-50 mx-4 mt-2 rounded-xl shadow-2xl border backdrop-blur-lg ${
                isDarkMode 
                  ? 'border-gray-700 bg-gray-900/95' 
                  : 'border-gray-200 bg-white/95'
              }`}
            >
              <div className="py-2">
                {['home', 'galeria', 'clientes', 'contato', 'projetos', 'curriculo'].map((page, index) => (
                  <motion.button
                    key={page}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => {
                      handlePageChange(page)
                    }}
                    className={`w-full text-left px-6 py-4 mx-2 my-1 rounded-lg capitalize font-medium transition-all duration-200 ${
                      page === 'projetos'
                        ? (
                            currentPage === page
                              ? `${isDarkMode ? 'text-gray-200 bg-gray-800/60' : 'text-gray-700 bg-gray-100/70'} text-base`
                              : `${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800/40' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/60'} text-sm`
                          )
                        : (
                            currentPage === page 
                              ? `${isDarkMode 
                                  ? 'text-white bg-gray-700 shadow-lg' 
                                  : 'text-white bg-gray-800 shadow-lg'}` 
                              : `${isDarkMode 
                                  ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' 
                                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'}`
                          )
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        currentPage === page 
                          ? 'bg-white' 
                          : isDarkMode ? 'bg-gray-500' : 'bg-gray-400'
                      }`} />
                      <span className={`${page === 'projetos' ? 'tracking-wide' : ''} ${currentPage === page && page === 'projetos' ? 'opacity-90' : ''}`}>
                        {page === 'projetos' ? 'outros projetos' : (page === 'curriculo' ? 'currículo' : page)}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}

function HomePage({ isDarkMode, onImageClick, backgroundImages, currentBackgroundIndex }) {
  const navigate = useNavigate()

  const getRandomImages = () => {
    const shuffled = [...galleryImages].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, 6)
  }

  const [randomImages] = useState(() => getRandomImages())

  const handleImageClick = (image) => {
    onImageClick(image)
    navigate('/galeria')
  }

  const bg = isDarkMode ? '#0F1217' : '#FAFAFA'
  const card = isDarkMode ? 'bg-[#141821] border border-white/5' : 'bg-white border border-gray-100'
  const headingColor = isDarkMode ? 'text-white' : 'text-gray-900'
  const subColor = isDarkMode ? 'text-gray-400' : 'text-gray-500'

  const sections = [
    {
      id: 'galeria',
      label: 'Galeria',
      description: 'Explore o portfólio completo com retratos, eventos e paisagens',
      icon: (<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>),
      gradient: 'from-violet-500 to-purple-700',
      path: '/galeria'
    },
    {
      id: 'projetos',
      label: 'Projetos',
      description: 'Vídeos, clipes musicais e colaborações audiovisuais',
      icon: (<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>),
      gradient: 'from-indigo-500 to-blue-700',
      path: '/projetos'
    },
    {
      id: 'clientes',
      label: 'Área do Cliente',
      description: 'Acesse seu álbum privado com segurança e praticidade',
      icon: (<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>),
      gradient: 'from-emerald-500 to-teal-700',
      path: '/clientes'
    },
    {
      id: 'curriculo',
      label: 'Currículo',
      description: 'Formação, experiências e habilidades profissionais',
      icon: (<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>),
      gradient: 'from-amber-500 to-orange-600',
      path: '/curriculo'
    },
    {
      id: 'contato',
      label: 'Contato',
      description: 'Agende um ensaio ou tire dúvidas sobre valores',
      icon: (<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>),
      gradient: 'from-rose-500 to-pink-700',
      path: '/contato'
    },
  ]

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: bg }}>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          {backgroundImages.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.img
                key={currentBackgroundIndex}
                src={backgroundImages[currentBackgroundIndex]}
                alt="Ricardo Freschi Photography"
                className="w-full h-full object-cover"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, ease: 'easeInOut' }}
              />
            </AnimatePresence>
          ) : (
            <img src={heroImage} alt="Ricardo Freschi Photography" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />
        </div>

        {/* Pílula "Fotógrafo Profissional" — topo da hero */}
        <motion.div
          className="absolute top-24 left-0 right-0 z-10 flex justify-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-sm text-white/80">
            <Camera className="w-4 h-4" />
            Fotógrafo Profissional
          </div>
        </motion.div>

        {/* Título, subtítulo e botões — parte inferior */}
        <motion.div
          className="absolute bottom-10 left-0 right-0 z-10 text-center text-white px-4"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.3, ease: 'easeOut' }}
        >
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold mb-4 tracking-tight drop-shadow-lg">
            Ricardo Freschi
          </h1>
          <p className="text-lg md:text-2xl font-light text-white/80 mb-10 max-w-xl mx-auto">
            Transformando momentos em memórias eternas
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/galeria')}
              className="px-8 py-3.5 rounded-full bg-white text-gray-900 font-semibold text-base hover:bg-white/90 transition-all duration-200 hover:scale-105 shadow-xl"
            >
              Ver Portfólio
            </button>
            <button
              onClick={() => navigate('/contato')}
              className="px-8 py-3.5 rounded-full bg-white/10 backdrop-blur border border-white/30 text-white font-semibold text-base hover:bg-white/20 transition-all duration-200 hover:scale-105"
            >
              Entrar em Contato
            </button>
          </div>
        </motion.div>

      </section>

      {/* Gallery Preview */}
      <section className="py-24 px-4" style={{ backgroundColor: isDarkMode ? '#141821' : '#F3F4F6' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <span className={`text-xs font-semibold tracking-[0.25em] uppercase mb-3 block ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
              Portfólio
            </span>
            <h2 className={`font-serif text-4xl md:text-5xl font-bold mb-4 ${headingColor}`}>
              Meus Trabalhos
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${subColor}`}>
              Uma seleção de retratos, eventos e momentos únicos capturados com paixão
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {randomImages.map((image, index) => (
              <motion.div
                key={index}
                className="relative group cursor-pointer overflow-hidden rounded-xl shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                viewport={{ once: true }}
                onClick={() => handleImageClick(image)}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-48 md:h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => navigate('/galeria')}
              className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-base transition-all duration-200 hover:scale-105 ${
                isDarkMode ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              <Camera className="w-4 h-4" />
              Ver Galeria Completa
            </button>
          </div>
        </div>
      </section>

      {/* Seções das outras páginas */}
      <section className="py-24 px-4" style={{ backgroundColor: bg }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <span className={`text-xs font-semibold tracking-[0.25em] uppercase mb-3 block ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
              Explore
            </span>
            <h2 className={`font-serif text-4xl md:text-5xl font-bold mb-4 ${headingColor}`}>
              O que você encontra aqui
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${subColor}`}>
              Navegue pelo portfólio, projetos audiovisuais, currículo e muito mais
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sections.map((s, i) => (
              <motion.button
                key={s.id}
                onClick={() => navigate(s.path)}
                className={`group text-left w-full p-6 rounded-2xl ${card} hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${s.gradient} text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {s.icon}
                </div>
                <h3 className={`text-xl font-bold mb-2 ${headingColor} group-hover:opacity-80 transition-opacity`}>
                  {s.label}
                </h3>
                <p className={`text-sm leading-relaxed ${subColor}`}>
                  {s.description}
                </p>
                <div className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold bg-gradient-to-r ${s.gradient} bg-clip-text text-transparent`}>
                  Acessar
                  <svg className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Especialidades */}
      <section className="py-24 px-4" style={{ backgroundColor: isDarkMode ? '#141821' : '#F3F4F6' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <span className={`text-xs font-semibold tracking-[0.25em] uppercase mb-3 block ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
              Especialidades
            </span>
            <h2 className={`font-serif text-4xl md:text-5xl font-bold mb-4 ${headingColor}`}>
              Capturando Momentos Únicos
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${subColor}`}>
              Especializado em retratos profissionais, fotografia de eventos e paisagens.
              Cada clique é uma história que merece ser contada.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🎭', title: 'Retratos', desc: 'Capturando a personalidade e essência única de cada pessoa com luz e composição impecáveis.', gradBg: isDarkMode ? 'bg-violet-900/30 border-violet-500/20' : 'bg-violet-50 border-violet-200' },
              { icon: '🎉', title: 'Eventos', desc: 'Documentando seus momentos mais especiais: festas, corporativos e celebrações inesquecíveis.', gradBg: isDarkMode ? 'bg-indigo-900/30 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200' },
              { icon: '🌄', title: 'Paisagens', desc: 'Revelando a beleza do mundo natural e urbano através de perspectivas únicas e cativantes.', gradBg: isDarkMode ? 'bg-emerald-900/30 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className={`p-8 rounded-2xl border text-center ${item.gradBg}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                viewport={{ once: true }}
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className={`text-xl font-bold mb-3 ${headingColor}`}>{item.title}</h3>
                <p className={`text-sm leading-relaxed ${subColor}`}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4 relative overflow-hidden" style={{ backgroundColor: bg }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 ${isDarkMode ? 'bg-purple-600' : 'bg-purple-300'}`} />
          <div className={`absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 ${isDarkMode ? 'bg-indigo-600' : 'bg-indigo-300'}`} />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className={`font-serif text-4xl md:text-5xl font-bold mb-6 ${headingColor}`}>
              Vamos criar algo incrível juntos?
            </h2>
            <p className={`text-lg mb-10 ${subColor}`}>
              Seja um ensaio fotográfico, cobertura de evento ou projeto audiovisual. Estou pronto para transformar a sua ideia em imagem.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/contato')}
                className="px-10 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-base transition-all duration-200 hover:scale-105 shadow-xl"
              >
                Entrar em Contato
              </button>
              <button
                onClick={() => navigate('/clientes')}
                className={`px-10 py-4 rounded-full font-semibold text-base transition-all duration-200 hover:scale-105 ${
                  isDarkMode ? 'bg-white/10 hover:bg-white/15 text-white border border-white/20' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200'
                }`}
              >
                Área do Cliente
              </button>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  )
}

function GalleryPage({ isDarkMode, selectedImage }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedImageForLightbox, setSelectedImageForLightbox] = useState(null)
  const [slideDirection, setSlideDirection] = useState(0) // 0: initial, 1: right, -1: left
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imagesPerPage = 12 // Número de imagens por página (aumentado de 9 para 12)

  // Calcula o índice inicial e final das imagens para a página atual
  const indexOfLastImage = currentPage * imagesPerPage
  const indexOfFirstImage = indexOfLastImage - imagesPerPage
  const currentImages = galleryImages.slice(indexOfFirstImage, indexOfLastImage)

  // Calcula o número total de páginas
  const totalPages = Math.ceil(galleryImages.length / imagesPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setSlideDirection(-1) // Slide para a esquerda
      setCurrentPage(currentPage - 1)
    }
  }
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setSlideDirection(1) // Slide para a direita
      setCurrentPage(currentPage + 1)
    }
  }

  // Se uma imagem foi selecionada na home, abre ela no lightbox
  useEffect(() => {
    if (selectedImage) {
      openLightbox(selectedImage)
    }
  }, [selectedImage])

  // Reset da direção do slide após a animação
  useEffect(() => {
    if (slideDirection !== 0) {
      const timer = setTimeout(() => {
        setSlideDirection(0)
      }, 500) // Duração da animação ajustada
      return () => clearTimeout(timer)
    }
  }, [slideDirection])

  // Função para abrir lightbox
  const openLightbox = (image) => {
    setSelectedImageForLightbox(image)
    // Bloquear scroll do body
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.height = '100%'
  }

  // Função para fechar o lightbox e limpar o estado
  const closeLightbox = () => {
    setSelectedImageForLightbox(null)
    // Restaurar scroll do body
    document.body.style.overflow = 'auto'
    document.body.style.position = 'static'
    document.body.style.width = 'auto'
    document.body.style.height = 'auto'
  }

  // Função para navegar entre imagens no lightbox
  const navigateLightbox = (direction) => {
    if (!selectedImageForLightbox) return
    
    const currentIndex = galleryImages.findIndex(img => img.src === selectedImageForLightbox.src)
    let newIndex = currentIndex + direction
    
    if (newIndex < 0) newIndex = galleryImages.length - 1
    if (newIndex >= galleryImages.length) newIndex = 0
    
    setSelectedImageForLightbox(galleryImages[newIndex])
  }

  return (
    <div className={`min-h-screen pt-20 pb-12 transition-colors duration-300 ${isDarkMode ? '' : 'bg-white'}`} style={isDarkMode ? { backgroundColor: '#0F1217' } : {}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className={`font-serif text-4xl md:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Galeria
          </h1>
          <p className={`text-lg max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Uma seleção dos meus trabalhos mais recentes e representativos
          </p>
        </motion.div>

        {/* Image Grid */}
        <div className="relative overflow-hidden">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            key={currentPage}
            style={{ willChange: 'transform, opacity' }}
            initial={{ 
              x: slideDirection === 1 ? 200 : slideDirection === -1 ? -200 : 0,
              opacity: 0 
            }}
            animate={{ 
              x: 0, 
              opacity: 1 
            }}
            transition={{ 
              duration: 0.5, 
              ease: [0.25, 0.46, 0.45, 0.94],
              type: "tween"
            }}
          >
            {currentImages.map((image, index) => (
              <motion.div
                key={`${currentPage}-${image.src}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.03,
                  ease: "easeOut" 
                }}
                className="relative group cursor-pointer overflow-hidden rounded-lg shadow-lg"
                onClick={() => openLightbox(image)}
              >
                <img 
                  src={image.src} 
                  alt={image.alt}
                  className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-110"
                  style={{ 
                    imageRendering: '-webkit-optimize-contrast'
                  }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
        </motion.div>
        </div>

        {/* Pagination with Arrows */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-12 space-x-8">
            {/* Previous Arrow */}
              <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                currentPage === 1
                  ? (isDarkMode 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                  : (isDarkMode 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            {/* Page Info */}
            <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Página {currentPage} de {totalPages}
            </div>

            {/* Next Arrow */}
              <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                currentPage === totalPages
                  ? (isDarkMode 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                  : (isDarkMode 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
              }`}
            >
              <span className="hidden sm:inline">Próxima</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Lightbox */}
        <AnimatePresence>
          {selectedImageForLightbox && (
            <div
              className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
              style={{ 
                touchAction: 'none',
                overflow: 'hidden',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
              }}
              onTouchStart={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (e.touches.length === 1) {
                  setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
                  setIsDragging(true)
                }
              }}
              onTouchMove={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onTouchEnd={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (e.touches.length === 0 && isDragging) {
                  const touch = e.changedTouches[0]
                  const deltaX = touch.clientX - dragStart.x
                  const deltaY = touch.clientY - dragStart.y
                  
                  // Se o movimento for horizontal e significativo, navegar
                  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                    if (deltaX > 0) {
                      navigateLightbox(-1) // Swipe right = imagem anterior
                    } else {
                      navigateLightbox(1) // Swipe left = próxima imagem
                    }
                  }
                  
                  setIsDragging(false)
                }
              }}
              onClick={closeLightbox}
            >
              <img
                src={selectedImageForLightbox.src}
                alt={selectedImageForLightbox.alt}
                className="max-w-[95vw] max-h-[95vh] w-auto h-auto object-contain"
                style={{ 
                  imageRendering: '-webkit-optimize-contrast',
                  touchAction: 'none',
                  pointerEvents: 'none'
                }}
                onClick={(e) => e.stopPropagation()}
              />
              
              {/* Botões de navegação */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigateLightbox(-1)
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-black/50 rounded-full p-3 transition-colors duration-200 z-10"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigateLightbox(1)
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-black/50 rounded-full p-3 transition-colors duration-200 z-10"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2 transition-colors duration-200 z-10"
              >
                <X className="h-8 w-8" />
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function ProjectsPage({ isDarkMode }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  const isAdmin = localStorage.getItem('adminAuth') === 'true'

  // Modal e formulário de projetos
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [projectTitle, setProjectTitle] = useState('')
  const [projectRole, setProjectRole] = useState('')
  const [projectYear, setProjectYear] = useState('')
  const [projectVideoUrl, setProjectVideoUrl] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [projectCoverFile, setProjectCoverFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [projectError, setProjectError] = useState('')
  const [projectSuccess, setProjectSuccess] = useState('')

  // Confirmação de exclusão & Undo
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, project: null })
  const [undoToast, setUndoToast] = useState({ show: false, project: null, secondsLeft: 6 })
  const undoTimeoutRef = useRef(null)
  const undoIntervalRef = useRef(null)

  const loadProjects = async () => {
    setLoading(true)
    const staticProjects = importProjectTexts()
    let dbProjects = []

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false })

        if (!error && data) {
          dbProjects = data.map((p) => ({
            id: p.id,
            title: p.title || p.name,
            description: p.description || '',
            videoUrl: p.video_url || '',
            videoFile: p.cover_url || '',
            role: p.role || '',
            year: p.year || '',
            isSupabase: true,
          }))
        }
      } catch (e) {
        console.warn('Erro ao carregar projetos do Supabase:', e)
      }
    }

    setProjects([...dbProjects, ...staticProjects])
    setLoading(false)
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleOpenCreateModal = () => {
    setEditingProject(null)
    setProjectTitle('')
    setProjectRole('')
    setProjectYear('')
    setProjectVideoUrl('')
    setProjectDescription('')
    setProjectCoverFile(null)
    setProjectError('')
    setProjectSuccess('')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (project) => {
    setEditingProject(project)
    setProjectTitle(project.title || '')
    setProjectRole(project.role || '')
    setProjectYear(project.year || '')
    setProjectVideoUrl(project.videoUrl || '')
    setProjectDescription(project.description || '')
    setProjectCoverFile(null)
    setProjectError('')
    setProjectSuccess('')
    setIsModalOpen(true)
  }

  const handleSaveProjectSupabase = async (e) => {
    e.preventDefault()
    if (!projectTitle.trim()) return

    setIsUploading(true)
    setProjectError('')
    setProjectSuccess('')

    try {
      let coverUrl = editingProject ? (editingProject.videoFile || '') : ''

      if (projectCoverFile) {
        const filePath = `covers/${Date.now()}_${projectCoverFile.name}`
        const { error: uploadErr } = await supabase.storage
          .from('client-photos')
          .upload(filePath, projectCoverFile)

        if (!uploadErr) {
          const { data: publicUrlData } = supabase.storage
            .from('client-photos')
            .getPublicUrl(filePath)
          coverUrl = publicUrlData?.publicUrl || coverUrl
        }
      }

      if (editingProject && editingProject.isSupabase) {
        const { error: updateErr } = await supabase
          .from('projects')
          .update({
            title: projectTitle,
            role: projectRole,
            year: projectYear,
            video_url: projectVideoUrl,
            description: projectDescription,
            ...(coverUrl ? { cover_url: coverUrl } : {}),
          })
          .eq('id', editingProject.id)

        if (updateErr) throw new Error(updateErr.message)
        setProjectSuccess('Projeto atualizado com sucesso!')
      } else {
        const { error: insertErr } = await supabase
          .from('projects')
          .insert([
            {
              title: projectTitle,
              role: projectRole,
              year: projectYear,
              video_url: projectVideoUrl,
              description: projectDescription,
              cover_url: coverUrl,
            },
          ])

        if (insertErr) throw new Error(insertErr.message)
        setProjectSuccess('Projeto cadastrado com sucesso!')
      }

      setProjectTitle('')
      setProjectRole('')
      setProjectYear('')
      setProjectVideoUrl('')
      setProjectDescription('')
      setProjectCoverFile(null)
      setEditingProject(null)

      setTimeout(() => {
        setIsModalOpen(false)
        setProjectSuccess('')
        loadProjects()
      }, 1200)
    } catch (err) {
      setProjectError(err.message || 'Erro ao salvar projeto.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRequestDelete = (project) => {
    setDeleteConfirmation({ isOpen: true, project })
  }

  const confirmDeletion = () => {
    const project = deleteConfirmation.project
    setDeleteConfirmation({ isOpen: false, project: null })
    if (!project) return

    if (undoToast.show && undoToast.project) {
      executePermanentDeletion(undoToast.project)
    }

    setProjects((prev) => prev.filter((p) => p.id !== project.id))

    let secondsLeft = 6
    setUndoToast({ show: true, project, secondsLeft })

    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current)
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)

    undoIntervalRef.current = setInterval(() => {
      secondsLeft -= 1
      if (secondsLeft > 0) {
        setUndoToast((prev) => ({ ...prev, secondsLeft }))
      } else {
        clearInterval(undoIntervalRef.current)
      }
    }, 1000)

    undoTimeoutRef.current = setTimeout(() => {
      executePermanentDeletion(project)
      setUndoToast({ show: false, project: null, secondsLeft: 6 })
      if (undoIntervalRef.current) clearInterval(undoIntervalRef.current)
    }, 6000)
  }

  const handleUndo = () => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current)

    if (undoToast.project) {
      setProjects((prev) => [undoToast.project, ...prev])
    }
    setUndoToast({ show: false, project: null, secondsLeft: 6 })
  }

  const executePermanentDeletion = async (project) => {
    try {
      if (project.id && project.isSupabase) {
        await supabase.from('projects').delete().eq('id', project.id)
      }
    } catch (err) {
      console.error('Erro ao excluir projeto do Supabase:', err)
    }
  }
  
  // Extrai o ID do YouTube (suporta youtu.be, youtube.com/watch?v=, e shorts)
  const getYouTubeId = (url) => {
    if (!url) return ''
    try {
      const u = new URL(url)
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1)
      if (u.searchParams.get('v')) return u.searchParams.get('v')
      const parts = u.pathname.split('/')
      const idx = parts.findIndex(p => p === 'shorts' || p === 'embed')
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1]
      return ''
    } catch {
      return ''
    }
  }

  // Detecta se é TikTok
  const isTikTok = (url) => {
    if (!url) return false
    try {
      const u = new URL(url)
      return u.hostname.includes('tiktok.com')
    } catch {
      return false
    }
  }

  const [activeVideo, setActiveVideo] = useState(null) // { title, ytId, url }

  // Cores exclusivas para a página Projetos (mais distintas)
  const themedBgStyle = isDarkMode 
    ? { backgroundColor: '#0A1022' } // navy escuro
    : { backgroundColor: '#EEF2FF' } // indigo-50
  const cardClasses = isDarkMode ? 'bg-[#0F172A] border border-white/5' : 'bg-white border border-indigo-100'
  const accentBtn = isDarkMode ? 'bg-indigo-500 hover:bg-indigo-400 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
  const neutralBtn = isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200'
  const headerText = isDarkMode ? 'text-white' : 'text-indigo-900'
  const subText = isDarkMode ? 'text-indigo-200' : 'text-indigo-700'

  return (
    <div className={`min-h-screen py-20 px-4 transition-colors duration-300`} style={themedBgStyle}>
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-12 flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className={`text-4xl md:text-5xl font-bold ${headerText}`}>
            Outros projetos
          </h1>
          <p className={`text-lg ${subText}`}>
            Conheça alguns dos projetos em que participei
          </p>

          {isAdmin && isSupabaseConfigured && (
            <Button
              onClick={handleOpenCreateModal}
              className="mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Novo Projeto
            </Button>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => {
            const ytId = getYouTubeId(project.videoUrl)
            const hasYouTube = Boolean(ytId)
            const hasTikTok = isTikTok(project.videoUrl)
            const thumbnail = hasYouTube ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : ''

            return (
              <motion.div
                key={project.id || index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`rounded-2xl overflow-hidden shadow-xl ${cardClasses}`}
              >
                {/* Área do Vídeo / Thumbnail */}
                <div className="relative aspect-video bg-black">
                  <button
                    type="button"
                    onClick={() => {
                      if (hasYouTube) setActiveVideo({ title: project.title, ytId, url: project.videoUrl })
                      else if (hasTikTok && project.videoUrl) window.open(project.videoUrl, '_blank')
                      else if (project.videoFile) window.open(project.videoFile, '_blank')
                      else if (project.videoUrl) window.open(project.videoUrl, '_blank')
                    }}
                    className="absolute inset-0 w-full h-full group"
                  >
                    {/* Thumbnail do YouTube, TikTok ou fallback */}
                    {hasYouTube ? (
                      <img
                        src={thumbnail}
                        alt={project.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : project.videoFile ? (
                      <img
                        src={project.videoFile}
                        alt={project.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-700' : 'bg-indigo-200'}`}>
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 5v10l8-5-8-5z"/>
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Overlay + Play */}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${isDarkMode ? 'bg-black/50' : 'bg-black/40'}`}>
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 5v10l8-5-8-5z"/>
                        </svg>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Conteúdo do Projeto */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-xl font-bold ${headerText}`}>
                      {project.title}
                    </h3>
                    {isAdmin && project.isSupabase && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(project)}
                          className="text-indigo-400 hover:text-indigo-300 p-1.5 rounded-lg hover:bg-indigo-950/40 transition-colors"
                          title="Editar Projeto"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestDelete(project)}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-950/40 transition-colors"
                          title="Excluir Projeto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {project.role || project.year ? (
                    <div className="flex items-center gap-3 mb-3">
                      {project.role && (
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${isDarkMode ? 'bg-indigo-500/30 text-indigo-200' : 'bg-indigo-100 text-indigo-700'}`}>
                          {project.role}
                        </span>
                      )}
                      {project.year && (
                        <span className={`text-xs ${subText}`}>
                          {project.year}
                        </span>
                      )}
                    </div>
                  ) : null}

                  <p className={`text-sm leading-relaxed whitespace-pre-line break-words mb-4 ${subText}`}>
                    {project.description}
                  </p>

                  {(project.videoUrl || project.videoFile) && (
                    <div className="mt-4 grid grid-cols-1 gap-2">
                      {hasYouTube && (
                        <button
                          type="button"
                          onClick={() => setActiveVideo({ title: project.title, ytId, url: project.videoUrl })}
                          className={`${accentBtn} rounded-lg py-2 px-3 text-sm font-medium transition-colors`}
                        >
                          Assistir na página
                        </button>
                      )}
                      <a
                        href={project.videoUrl || project.videoFile}
                        target="_blank"
                        rel="noreferrer"
                        className={`${neutralBtn} rounded-lg py-2 px-3 text-sm font-medium text-center transition-colors`}
                      >
                        {hasTikTok ? 'Abrir no TikTok' : 'Abrir no YouTube'}
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Modal de Aviso de Exclusão */}
        {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
              <div className="flex items-center gap-3 mb-4 text-red-500">
                <div className="p-3 rounded-full bg-red-500/10">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Confirmar Exclusão</h3>
              </div>
              
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Tem certeza que deseja excluir o projeto <strong>"{deleteConfirmation.project?.title}"</strong>?
                <span className="block mt-2 text-xs text-red-400 font-medium">
                  Você terá 6 segundos para desfazer essa exclusão antes que seja apagado do Supabase.
                </span>
              </p>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteConfirmation({ isOpen: false, project: null })}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={confirmDeletion}
                  className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
                >
                  Sim, Excluir
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Toast com Botão Temporário de Desfazer (Undo) */}
        <AnimatePresence>
          {undoToast.show && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl bg-gray-900 text-white shadow-2xl border border-gray-700 min-w-[320px] max-w-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <div>
                  <p className="text-sm font-medium">
                    Projeto "{undoToast.project?.title}" removido
                  </p>
                  <p className="text-xs text-gray-400">
                    Excluindo definitivamente em {undoToast.secondsLeft}s...
                  </p>
                </div>
              </div>

              <Button
                onClick={handleUndo}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Desfazer
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal para adicionar/editar projeto no Supabase */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`w-full max-w-lg p-6 rounded-2xl shadow-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700 text-white' : 'bg-white text-gray-900'}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Film className="w-5 h-5 text-indigo-500" />
                  {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProjectSupabase} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Título do Projeto</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Clipes Musicais - Banda XYZ"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Função / Cargo</label>
                    <input
                      type="text"
                      placeholder="Ex: Direção de Fotografia"
                      value={projectRole}
                      onChange={(e) => setProjectRole(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Ano</label>
                    <input
                      type="text"
                      placeholder="Ex: 2025"
                      value={projectYear}
                      onChange={(e) => setProjectYear(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">URL do Vídeo (YouTube, TikTok, Vimeo)</label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={projectVideoUrl}
                    onChange={(e) => setProjectVideoUrl(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <textarea
                    rows={3}
                    placeholder="Resumo do projeto..."
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>

                {projectError && <p className="text-xs text-red-400 bg-red-950/50 p-2 rounded border border-red-800">{projectError}</p>}
                {projectSuccess && <p className="text-xs text-green-400 bg-green-950/50 p-2 rounded border border-green-800">{projectSuccess}</p>}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isUploading}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isUploading || !projectTitle.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {isUploading ? 'Salvando...' : editingProject ? 'Salvar Alterações' : 'Salvar Projeto'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Player */}
        <AnimatePresence>
          {activeVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
              onClick={() => setActiveVideo(null)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="w-full max-w-5xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative" style={{ paddingTop: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube-nocookie.com/embed/${activeVideo.ytId}?rel=0&modestbranding=1`}
                    title={activeVideo.title}
                    frameBorder="0"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                <button
                  onClick={() => setActiveVideo(null)}
                  className="absolute -top-10 right-0 text-white hover:text-gray-300 bg-black/50 rounded-full p-2 transition-colors duration-200"
                >
                  <X className="h-8 w-8" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function ContactPage({ isDarkMode, biographyImages, currentBiographyIndex }) {

  return (
    <div className={`min-h-screen pt-20 pb-12 transition-colors duration-300 ${isDarkMode ? '' : 'bg-white'}`} style={isDarkMode ? { backgroundColor: '#0F1217' } : {}}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className={`font-serif text-4xl md:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Sobre Mim
          </h1>
          <p className={`text-lg max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Conheça um pouco da minha história e paixão pela fotografia
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Informações de Contato - Esquerda */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className={`font-serif text-2xl font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Entre em Contato
            </h2>
            
            <div className="space-y-6">
              <div className={`flex items-center space-x-4 p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} hover:shadow-lg transition-all duration-300`}>
                <div className={`p-3 rounded-full ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                  <Mail className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Email</h3>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>ricardodias2004@gmail.com</p>
                </div>
              </div>

              <div className={`flex items-center space-x-4 p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} hover:shadow-lg transition-all duration-300`}>
                <div className={`p-3 rounded-full ${isDarkMode ? 'bg-green-600/20' : 'bg-green-100'}`}>
                  <Phone className={`h-6 w-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <div>
                  <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Telefone</h3>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>(11) 95779-8732</p>
                </div>
              </div>

              <div className={`flex items-center space-x-4 p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} hover:shadow-lg transition-all duration-300`}>
                <div className={`p-3 rounded-full ${isDarkMode ? 'bg-pink-600/20' : 'bg-pink-100'}`}>
                  <Instagram className={`h-6 w-6 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`} />
                </div>
                <div>
                  <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Instagram</h3>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>@freschi.raw</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Foto e Biografia - Direita */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-8"
          >
            {/* Foto do Ricardo */}
            <div className="relative">
              <div className={`w-full h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                {biographyImages.length > 0 ? (
                  <AnimatePresence mode="wait">
                    <motion.img 
                      key={currentBiographyIndex}
                      src={biographyImages[currentBiographyIndex]} 
                      alt="Ricardo Freschi" 
                      className="w-full h-full object-cover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                    />
                  </AnimatePresence>
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div className="text-center">
                      <Camera className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Suas fotos aparecerão aqui
                      </p>
              </div>
                  </div>
                )}
              </div>
              {/* Decoração de fundo */}
              <div className={`absolute -top-4 -left-4 w-full h-full rounded-2xl border-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} -z-10`}></div>
              
              </div>

            {/* Biografia */}
              <div>
              <h2 className={`font-serif text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Biografia
              </h2>
              
              <div className={`space-y-4 text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <p>
                  Sou Ricardo Freschi, fotógrafo apaixonado por registrar momentos únicos e transformar 
                  sentimentos em imagem. Desde 2023 atuo profissionalmente na fotografia, 
                  sempre buscando transmitir autenticidade e emoção em cada clique.
                </p>
                
                <p>
                  Estudei fotografia pela Cruzeiro do Sul o que me deu uma boa base no audiovisual, 
                  mas foi ao estudar com o fotógrafo Tom Freitas que realmente aprimorei meu olhar e 
                  desenvolvi minha identidade artística. Essa experiência foi fundamental para entender 
                  a fotografia além da técnica como uma forma de expressão capaz de contar histórias e 
                  despertar sensações.
                </p>
                
                <p>
                  Desde então, venho participando de projetos em eventos, retratos e produções 
                  audiovisuais, sempre com a dedicação de capturar não apenas a imagem, mas também 
                  a essência do momento. Para mim, fotografar vai muito além de apertar o botão da 
                  câmera: é viver o instante e transformá-lo em memória.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [selectedImageForGallery, setSelectedImageForGallery] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Verifica se há preferência salva no localStorage
    const savedTheme = localStorage.getItem('darkMode')
    return savedTheme ? JSON.parse(savedTheme) : true // Padrão: modo escuro
  })
  
  // Estado para imagens de fundo rotativas
  const backgroundImages = importBackgroundImages()
  const [currentBackgroundIndex, setCurrentBackgroundIndex] = useState(0)
  
  // Estado para fotos da biografia rotativas
  const biographyImages = importBiographyImages()
  const [currentBiographyIndex, setCurrentBiographyIndex] = useState(0)

  // Salva a preferência no localStorage sempre que o modo escuro muda
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
  }, [isDarkMode])

  // Rotação automática das imagens de fundo
  useEffect(() => {
    if (backgroundImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentBackgroundIndex((prevIndex) => 
          (prevIndex + 1) % backgroundImages.length
        )
      }, 60000) // Muda a cada 1 minuto
      
      return () => clearInterval(interval)
    }
  }, [backgroundImages.length])

  // Rotação automática das fotos da biografia
  useEffect(() => {
    if (biographyImages.length > 0) {
      const interval = setInterval(() => {
        setCurrentBiographyIndex((prevIndex) => 
          (prevIndex + 1) % biographyImages.length
        )
      }, 60000) // Muda a cada 1 minuto
      
      return () => clearInterval(interval)
    }
  }, [biographyImages.length])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }


  return (
    <Router>
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? '' : 'bg-white'}`} style={isDarkMode ? { backgroundColor: '#0F1217' } : {}}>
        <ScrollToTop />
        <Navigation 
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />
        <Routes>
          <Route path="/" element={<HomePage isDarkMode={isDarkMode} onImageClick={(image) => setSelectedImageForGallery(image)} backgroundImages={backgroundImages} currentBackgroundIndex={currentBackgroundIndex} />} />
          <Route path="/galeria" element={<GalleryPage isDarkMode={isDarkMode} selectedImage={selectedImageForGallery} />} />
          <Route path="/clientes" element={<ClientList isDarkMode={isDarkMode} />} />
          <Route path="/cliente/:clientId" element={<ClientGalleryWrapper isDarkMode={isDarkMode} />} />
          <Route path="/admin" element={<AdminPanel isDarkMode={isDarkMode} />} />
          <Route path="/lab" element={<TestProjectsPage />} />
          <Route path="/projetos" element={<ProjectsPage isDarkMode={isDarkMode} />} />
          <Route path="/curriculo" element={<Resume isDarkMode={isDarkMode} biographyImages={biographyImages} currentBiographyIndex={currentBiographyIndex} />} />
          <Route path="/contato" element={<ContactPage isDarkMode={isDarkMode} biographyImages={biographyImages} currentBiographyIndex={currentBiographyIndex} />} />
          <Route path="*" element={<HomePage isDarkMode={isDarkMode} onImageClick={(image) => setSelectedImageForGallery(image)} backgroundImages={backgroundImages} currentBackgroundIndex={currentBackgroundIndex} />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

