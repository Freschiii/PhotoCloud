import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Folder, Upload, Eye, Settings, LogOut, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import AdminLogin from './AdminLogin.jsx'
import { getAllClients } from '@/lib/clientsManifest.js'

// Função para descobrir clientes automaticamente
async function discoverClients() {
  const clients = []

  // Manifest only (build-time import)
  const manifestClients = getAllClients()
  for (const entry of manifestClients) {
    clients.push({
      id: entry.id,
      name: entry.name || entry.folder,
      clientName: entry.name || entry.folder,
      imageCount: entry.imageCount || 0,
      thumbnail: entry.files && entry.files[0] ? entry.files[0].src : '',
      createdAt: new Date().toISOString().split('T')[0],
      hasPassword: !!entry.password,
      password: entry.password || '',
      realFolderName: entry.folder,
    })
  }

  return clients
}

export default function AdminPanel({ isDarkMode = true }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState(null)

  useEffect(() => {
    // Verifica se já está autenticado
    const authStatus = localStorage.getItem('adminAuth')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadClients()
    }
  }, [isAuthenticated])

  const loadClients = async () => {
    setLoading(true)
    try {
      // Timeout para evitar carregamento infinito
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      )
      
      const clientsPromise = discoverClients()
      const discoveredClients = await Promise.race([clientsPromise, timeoutPromise])
      setClients(discoveredClients)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      setClients([]) // Define array vazio em caso de erro
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminAuth')
    setIsAuthenticated(false)
    setClients([])
  }

  const handleAuthSuccess = () => {
    setIsAuthenticated(true)
  }

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Erro ao copiar código:', err)
    }
  }

  if (!isAuthenticated) {
    return <AdminLogin onAuthSuccess={handleAuthSuccess} isDarkMode={isDarkMode} />
  }

  return (
    <div className={`min-h-screen pt-20 pb-12 transition-colors duration-300 ${isDarkMode ? '' : 'bg-white'}`} style={isDarkMode ? { backgroundColor: '#0F1217' } : {}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className={`text-4xl font-bold bg-gradient-to-r ${isDarkMode ? 'from-white via-gray-200 to-white bg-clip-text text-transparent' : 'from-gray-800 via-gray-600 to-gray-800 bg-clip-text text-transparent'}`}>
              Painel Administrativo
            </h1>
            <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Gerencie os álbuns de fotos dos clientes
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleLogout}
              variant="outline"
              className={`${isDarkMode ? 'border-red-500/50 text-red-300 hover:bg-red-900/30 hover:border-red-400 bg-red-900/10' : 'border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400'}`}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            className={`p-6 rounded-xl shadow-lg transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/20' : 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200'}`}
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <Folder className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Total de Clientes
                </p>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {clients.length}
                </p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            className={`p-6 rounded-xl shadow-lg transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-500/20' : 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200'}`}
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
                <Upload className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Total de Fotos
                </p>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {clients.reduce((total, client) => total + client.imageCount, 0)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            className={`p-6 rounded-xl shadow-lg transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-500/20' : 'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200'}`}
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                <Settings className={`w-8 h-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Com Senha
                </p>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {clients.filter(client => client.hasPassword).length}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Clientes List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-white' : 'border-gray-900'}`}></div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {clients.map((client, index) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className={`rounded-xl overflow-hidden shadow-xl transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50' : 'bg-white border border-gray-200'} hover:shadow-2xl`}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-200 relative overflow-hidden">
                  {client.thumbnail ? (
                    <img
                      src={client.thumbnail}
                      alt={client.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Folder className={`w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {client.name}
                  </h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm">
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mr-2`}>Pasta:</span>
                      <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-mono text-xs`}>
                        {client.realFolderName}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mr-2`}>Código:</span>
                      <div className="flex items-center space-x-2">
                        <span className={`${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'} font-mono text-xs bg-gray-800 px-2 py-1 rounded`}>
                          {client.id}
                        </span>
                        <button
                          onClick={() => copyCode(client.id)}
                          className={`p-1 rounded transition-colors duration-200 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                          title="Copiar código"
                        >
                          {copiedCode === client.id ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mr-2`}>Fotos:</span>
                      <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {client.imageCount}
                      </span>
                    </div>

                    <div className="flex items-center text-sm">
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mr-2`}>Criado:</span>
                      <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex space-x-2"
                  >
                      <Button
                        onClick={() => window.location.href = `/#/cliente/${client.id}?admin=true`}
                        className={`flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300`}
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Galeria
                      </Button>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && clients.length === 0 && (
          <div className="text-center py-12">
            <Folder className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Nenhum cliente encontrado
            </h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Adicione pastas de clientes na pasta <code className="px-2 py-1 bg-gray-200 rounded text-sm">src/assets/clientes/</code>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
