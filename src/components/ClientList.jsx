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

// Função para descobrir automaticamente todas as pastas de clientes (manifest only)
async function getAllClientsWithPasswords() {
  const clients = []
  const manifestClients = getAllClients()
  for (const entry of manifestClients) {
    clients.push({
      id: entry.id,
      name: entry.name || entry.folder,
      password: entry.password || '',
      hasPassword: !!entry.password,
      realFolderName: entry.folder,
      imageCount: entry.imageCount || 0,
    })
  }
  return clients
}

// Obsoleto com manifest: mantido vazio por compatibilidade
async function checkAndAddClientFromFolder() {}

// Obsoleto com manifest: mantido vazio por compatibilidade
async function checkAndAddClientFromFile() {}

// Função auxiliar para adicionar cliente com informações do clientes.txt
async function checkAndAddClientFromInfo(clientFolder, clientName, password, clients) {
  try {
    // Verifica se já foi adicionado
    const clientId = clientFolder.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    
    if (clients.find(c => c.id === clientId)) return
    
    // NUNCA escanear aqui para não travar /clientes. Usa cache, se existir.
    const cached = getCachedImageCount(clientFolder)
    const imageCount = Number.isFinite(cached) ? cached : 0
    
    clients.push({
      id: clientId,
      name: clientName,
      password: password,
      hasPassword: password.length > 0,
      realFolderName: clientFolder,
      imageCount: imageCount
    })
  } catch (error) {
    // Ignora erros silenciosamente
  }
}

// Função auxiliar para verificar e adicionar cliente
async function checkAndAddClient(clientFolder, clients) {
  try {
    // Verifica se já foi adicionado
    const clientId = clientFolder.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    
    if (clients.find(c => c.id === clientId)) return
    
    // Tenta buscar as informações no arquivo info.txt
    let clientTitle = clientFolder
    let clientName = clientFolder
    let password = ''
    let hasPassword = false
    
    try {
      const infoResponse = await fetch(`/clientes/${clientFolder}/info.txt`)
      if (infoResponse.ok) {
        const infoText = await infoResponse.text()
        const lines = infoText.split('\n').map(line => line.trim()).filter(line => line)
        
        // Procura por título, nome e senha
        for (const line of lines) {
          if (line.toLowerCase().startsWith('titulo:')) {
            clientTitle = line.substring(7).trim()
          } else if (line.toLowerCase().startsWith('nome:')) {
            clientName = line.substring(5).trim()
          } else if (line.toLowerCase().startsWith('senha:')) {
            password = line.substring(6).trim()
            hasPassword = password.length > 0
          }
        }
      }
    } catch (error) {
      // Se não conseguir carregar as informações, usa o nome da pasta
    }
    
    // Conta as imagens de forma simples
    let imageCount = 0
    try {
      const testImages = ['IMG_0001.jpg', 'IMG_001.jpg', 'foto1.jpg', 'image1.jpg']
      
      for (const img of testImages) {
        try {
          const response = await fetch(`/clientes/${clientFolder}/${img}`, { method: 'HEAD' })
          if (response.ok) {
            imageCount++
          }
        } catch (error) {
          // Continua tentando
        }
      }
      
      // Estimativa baseada nas imagens encontradas
      if (imageCount > 0) {
        imageCount = imageCount * 5 // Estimativa conservadora
      }
    } catch (error) {
      // Se der erro, deixa 0
    }
    
    clients.push({
      id: clientId,
      name: clientTitle,
      clientName: clientName,
      password: password,
      hasPassword: hasPassword,
      realFolderName: clientFolder,
      imageCount: imageCount
    })
  } catch (error) {
    // Ignora erros silenciosamente
  }
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
      const clientsWithPasswords = await getAllClientsWithPasswords()
      setClients(clientsWithPasswords)
      setLoading(false)
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
      // Procura o cliente com a senha correspondente (apenas clientes com senha)
      const matchingClient = clients.find(client => 
        client.hasPassword && client.password.toLowerCase() === accessCode.trim().toLowerCase()
      )
      
      if (matchingClient) {
        // Salva a autenticação do cliente no sessionStorage
        sessionStorage.setItem(`client_${matchingClient.id}`, 'true')
        // Senha correta, navega para a galeria do cliente
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