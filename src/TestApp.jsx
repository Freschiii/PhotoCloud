import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X, Camera, Mail, Phone, Instagram, Sun, Moon, Aperture } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import ClientGallery from './components/ClientGallery.jsx'
import ClientList from './components/ClientList.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import './App.css'

// Componente de teste simples
function TestPage({ title, isDarkMode }) {
  return (
    <div className={`min-h-screen pt-20 pb-12 transition-colors duration-300 ${isDarkMode ? '' : 'bg-white'}`} 
         style={isDarkMode ? { backgroundColor: '#0F1217' } : {}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className={`font-serif text-4xl md:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {title}
        </h1>
        <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Esta é a página: {title}
        </p>
      </div>
    </div>
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
          {/* Left group */}
          <div className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => handlePageChange('projetos')}
              className={`capitalize font-medium transition-colors duration-200 ${
                currentPage === 'projetos'
                  ? `${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'} opacity-90`
                  : `${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'} text-sm`
              }`}
            >
              outros projetos
            </button>
            <button
              onClick={() => handlePageChange('admin')}
              className={`capitalize font-medium transition-colors duration-200 ${
                currentPage === 'admin'
                  ? `${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'} opacity-90`
                  : `${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'} text-sm`
              }`}
            >
              admin
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

          {/* Right group */}
          <div className="hidden md:flex items-center space-x-8">
            {['home', 'galeria', 'clientes', 'contato'].map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`capitalize font-medium transition-colors duration-200 ${
                  currentPage === page 
                    ? `${isDarkMode ? 'text-white border-white' : 'text-gray-800 border-gray-800'} border-b-2` 
                    : `${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`
                }`}
              >
                {page}
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
        {isMenuOpen && (
          <div className={`md:hidden absolute top-full left-0 right-0 z-50 mx-4 mt-2 rounded-xl shadow-2xl border backdrop-blur-lg ${
            isDarkMode 
              ? 'border-gray-700 bg-gray-900/95' 
              : 'border-gray-200 bg-white/95'
          }`}>
            <div className="py-2">
              {['home', 'galeria', 'clientes', 'contato', 'projetos', 'admin'].map((page, index) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-full text-left px-6 py-4 mx-2 my-1 rounded-lg capitalize font-medium transition-all duration-200 ${
                    currentPage === page 
                      ? `${isDarkMode ? 'text-white bg-gray-700 shadow-lg' : 'text-white bg-gray-800 shadow-lg'}` 
                      : `${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'}`
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

// Wrapper para ClientGallery com React Router
function ClientGalleryWrapper({ isDarkMode }) {
  const { clientId } = useParams()
  const navigate = useNavigate()
  
  return (
    <ClientGallery 
      clientName={clientId} 
      isDarkMode={isDarkMode} 
      onBack={() => navigate('/clientes')} 
    />
  )
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('darkMode')
    return savedTheme ? JSON.parse(savedTheme) : false
  })

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
  }, [isDarkMode])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <Router>
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? '' : 'bg-white'}`} style={isDarkMode ? { backgroundColor: '#0F1217' } : {}}>
        <Navigation 
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />
        <Routes>
          <Route path="/" element={<TestPage title="Home" isDarkMode={isDarkMode} />} />
          <Route path="/galeria" element={<TestPage title="Galeria" isDarkMode={isDarkMode} />} />
          <Route path="/clientes" element={<ClientList isDarkMode={isDarkMode} />} />
          <Route path="/cliente/:clientId" element={<ClientGalleryWrapper isDarkMode={isDarkMode} />} />
          <Route path="/admin" element={<AdminPanel isDarkMode={isDarkMode} />} />
          <Route path="/projetos" element={<TestPage title="Projetos" isDarkMode={isDarkMode} />} />
          <Route path="/contato" element={<TestPage title="Contato" isDarkMode={isDarkMode} />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
