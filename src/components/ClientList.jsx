import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Lock, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { getAllClients } from '@/lib/clientsManifest.js'

// Verifica se um arquivo de imagem realmente existe (evita fallback do dev server para index.html)
async function imageExists(imagePath) {
  try {
    const res = await fetch(imagePath, { method: 'GET', cache: 'no-store' })
    if (!res.ok) return false
    const ct = res.headers.get('content-type') || ''
    return ct.startsWith('image/')
  } catch (_) {
    return false
  }
}

// Cache de contagem por pasta (persistido por sessão)
function getCachedImageCount(folder) {
  try {
    const v = sessionStorage.getItem(`imageCount_${folder}`)
    return v ? parseInt(v, 10) : null
  } catch (_) { return null }
}

function setCachedImageCount(folder, count) {
  try { sessionStorage.setItem(`imageCount_${folder}`, String(count)) } catch (_) {}
}

// Função para buscar todas as senhas dos clientes
async function getAllClientsWithPasswords() {
  const manifestClients = getAllClients()
  const clients = []

  for (const entry of manifestClients) {
    const folder = entry.folder
    const clientId = entry.id
    let clientName = entry.name || folder
    let clientTitle = entry.name || folder
    let password = entry.password || ''
    let hasPassword = !!entry.password

    let imageCount = getCachedImageCount(folder)
    if (imageCount === null) {
      imageCount = entry.imageCount || 0
      setCachedImageCount(folder, imageCount)
    }

    clients.push({
      id: clientId,
      name: clientTitle,
      clientName: clientName,
      password: password,
      hasPassword: hasPassword,
      realFolderName: folder,
      imageCount: imageCount
    })
  }

  return clients
}

function ClientList({ isDarkMode }) {
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const loadClients = async () => {
      try {
        const all = await getAllClientsWithPasswords()
        setClients(all)
      } catch (e) {
        console.warn('Erro ao carregar clientes:', e)
      } finally {
        setLoading(false)
      }
    }
    loadClients()
  }, [])

  const handleCodeSubmit = async (e) => {
    e.preventDefault()
    
    if (accessCode.trim() === '') {
      setError('Por favor, digite o código de acesso')
      return
    }

    setIsValidating(true)
    setError('')

    try {
      const inputCode = accessCode.trim().toLowerCase()

      // Procura o cliente por senha, por ID ou por Slug
      const matchingClient = clients.find(client => {
        if (client.password && client.password.toLowerCase() === inputCode) return true
        if (client.id && client.id.toLowerCase() === inputCode) return true
        if (client.slug && client.slug.toLowerCase() === inputCode) return true
        return false
      })
      
      if (matchingClient) {
        // Salva a autenticação do cliente no sessionStorage
        sessionStorage.setItem(`client_${matchingClient.id}`, 'true')
        // Código correto, navega para a galeria do cliente
        navigate(`/cliente/${matchingClient.id}`)
      } else {
        setError('Código de acesso incorreto')
      }
    } catch (error) {
      setError('Erro ao validar código. Tente novamente.')
    } finally {
      setIsValidating(false)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen pt-20 pb-12 transition-colors duration-300 ${isDarkMode ? '' : 'bg-white'}`} 
           style={isDarkMode ? { backgroundColor: '#0F1217' } : {}}>
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Carregando...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen pt-20 pb-12 transition-colors duration-300 ${isDarkMode ? '' : 'bg-white'}`} 
         style={isDarkMode ? { backgroundColor: '#0F1217' } : {}}>
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
            isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'
          }`}>
            <Lock className={`h-10 w-10 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
          </div>
          
          <h1 className={`font-serif text-3xl md:text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Acesso às Fotos
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Digite o código de acesso fornecido
          </p>
        </div>

        {/* Formulário de Login */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`p-8 rounded-xl shadow-xl ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
        >
          <form onSubmit={handleCodeSubmit} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Código de Acesso
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Digite o código de acesso"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isValidating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium py-3"
            >
              {isValidating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Validando...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Acessar Fotos
                </>
              )}
            </Button>
          </form>

          {/* Dica */}
          <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              O código de acesso foi fornecido junto com o convite para visualizar suas fotos.
            </p>
          </div>
        </motion.div>

        {/* Botão de Admin no canto inferior direito */}
        <div className="fixed bottom-4 right-4 z-40">
          <Button
            onClick={() => navigate('/admin')}
            variant="outline"
            style={{
              borderColor: 'transparent',
              color: '#0F1217',
              backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
              opacity: 0.6
            }}
            className={`text-xs hover:opacity-100 transition-all duration-200 hover:!border-yellow-400`}
          >
            <Settings className="h-3 w-3 mr-1" />
            Admin
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ClientList