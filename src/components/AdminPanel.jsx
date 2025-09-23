import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Folder, Upload, Eye, Settings, LogOut } from 'lucide-react'
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
      const discoveredClients = await discoverClients()
      setClients(discoveredClients)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
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

  if (!isAuthenticated) {
    return <AdminLogin onAuthSuccess={handleAuthSuccess} isDarkMode={isDarkMode} />
  }

  return (
    <div className={`min-h-screen pt-20 pb-12 transition-colors duration-300 ${isDarkMode ? '' : 'bg-white'}`} style={isDarkMode ? { backgroundColor: '#0F1217' } : {}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Painel Administrativo
            </h1>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Gerencie os álbuns de fotos dos clientes
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className={`${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center">
              <Folder className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Total de Clientes
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {clients.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center">
              <Upload className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Total de Fotos
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {clients.reduce((total, client) => total + client.imageCount, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center">
              <Settings className={`w-8 h-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Com Senha
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {clients.filter(client => client.hasPassword).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Clientes List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-white' : 'border-gray-900'}`}></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client, index) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`rounded-lg overflow-hidden shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
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
                  {client.hasPassword && (
                    <div className="absolute top-2 right-2">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${isDarkMode ? 'bg-yellow-600 text-yellow-100' : 'bg-yellow-100 text-yellow-800'}`}>
                        Protegido
                      </div>
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

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => window.open(`/#/cliente/${client.id}`, '_blank')}
                      className="flex-1"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Galeria
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
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
