import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Folder, Upload, Eye, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import AdminLogin from './AdminLogin.jsx'
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

// Obsoleto com manifest
async function checkAndAddClientFromFolder() {}

// Função auxiliar para adicionar cliente com informações do clientes.txt
async function checkAndAddClientFromInfo(clientFolder, clientName, password, clients) {
  try {
    // Verifica se já foi adicionado
    const clientId = clientFolder.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    
    if (clients.find(c => c.id === clientId)) return
    
    // NUNCA escanear aqui para não travar /admin. Usa cache, se existir.
    const cached = getCachedImageCount(clientFolder)
    const imageCount = Number.isFinite(cached) ? cached : 0
    
    clients.push({
      id: clientId,
      name: clientName,
      clientName: clientName,
      imageCount: imageCount,
      thumbnail: `/clientes/${clientFolder}/IMG_0001.jpg`,
      createdAt: new Date().toISOString().split('T')[0],
      hasPassword: password.length > 0,
      password: password,
      realFolderName: clientFolder
    })
  } catch (error) {
    // Ignora erros silenciosamente
  }
}

// Função auxiliar para adicionar cliente lendo arquivo individual X.txt
async function checkAndAddClientFromFile(clientFile, clients) {
  try {
    const response = await fetch(`/clientes/${clientFile}`)
    if (!response.ok) return

    const fileText = await response.text()
    const lines = fileText.split('\n').map(line => line.trim()).filter(Boolean)

    let clientName = ''
    let password = ''
    let clientFolder = ''

    for (const line of lines) {
      if (line.startsWith('Nome:')) clientName = line.substring(5).trim()
      else if (line.startsWith('Senha:')) password = line.substring(6).trim()
      else if (line.startsWith('Pasta:')) clientFolder = line.substring(6).trim()
    }

    if (!clientFolder && clientName) {
      clientFolder = clientName.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
    }

    if (clientName && password && clientFolder) {
      await checkAndAddClientFromInfo(clientFolder, clientName, password, clients)
    }
  } catch (_) {
    // silencioso
  }
}

// Função auxiliar para verificar e adicionar cliente (fallback)
async function checkAndAddClient(clientFolder, clients) {
  try {
    // Testa apenas algumas imagens comuns para verificar se a pasta existe
    const testImages = ['IMG_0001.jpg', 'IMG_001.jpg', 'IMG_002.jpg', 'IMG_003.jpg']
    
    let folderExists = false
    for (const img of testImages) {
      try {
        const response = await fetch(`/clientes/${clientFolder}/${img}`, { method: 'HEAD' })
        if (response.ok) {
          folderExists = true
          break
        }
      } catch (error) {
        // Continua tentando
      }
    }
    
    if (!folderExists) return
    
    // Verifica se já foi adicionado
    const clientId = clientFolder.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    
    if (clients.find(c => c.id === clientId)) return
    
    // Conta as imagens de forma mais eficiente
    let imageCount = 0
    try {
      // Testa apenas algumas imagens comuns para detectar padrão
      const testImages = [
        'IMG_0001.jpg', 'IMG_001.jpg', 'IMG_002.jpg', 'IMG_003.jpg', 'IMG_004.jpg',
        'foto1.jpg', 'foto2.jpg', 'foto3.jpg', 'foto4.jpg',
        'image1.jpg', 'image2.jpg', 'image3.jpg', 'image4.jpg'
      ]
      
      let foundImages = 0
      for (const img of testImages) {
        try {
          const response = await fetch(`/clientes/${clientFolder}/${img}`, { method: 'HEAD' })
          if (response.ok) {
            foundImages++
          }
        } catch (error) {
          // Continua tentando
        }
      }
      
      // Se encontrou imagens, faz uma estimativa mais inteligente
      if (foundImages > 0) {
        // Se encontrou muitas imagens numeradas, estima um total maior
        if (foundImages >= 4) {
          imageCount = foundImages * 8 // Estimativa para álbuns grandes
        } else {
          imageCount = foundImages * 3 // Estimativa conservadora
        }
      }
    } catch (error) {
      // Se der erro, deixa 0
    }
    
    // Verifica se tem arquivo de informações e carrega o conteúdo
    let clientTitle = clientFolder
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    let clientName = clientFolder
    let hasPassword = false
    let password = ''
    
    try {
      const infoResponse = await fetch(`/clientes/${clientFolder}/info.txt`)
      if (infoResponse.ok) {
        const infoText = await infoResponse.text()
        const lines = infoText.split('\n').map(line => line.trim()).filter(line => line)
        
        // Procura por título, nome do cliente e senha
        for (const line of lines) {
          if (line.toLowerCase().startsWith('titulo:')) {
            clientTitle = line.substring(7).trim()
          } else if (line.toLowerCase().startsWith('nome:')) {
            clientName = line.substring(5).trim()
          } else if (line.toLowerCase().startsWith('senha:')) {
            hasPassword = true
            password = line.substring(6).trim()
          }
        }
      }
    } catch (error) {
      // Se não conseguir carregar as informações, usa o nome da pasta
    }
    
    // Criar nome de exibição bonito
    const displayName = clientTitle
    
    // Pega a primeira imagem real como miniatura
    const thumbnails = {
      'carometro-08-2025': '/clientes/carometro-08-2025/RIK-6630.jpg',
      'aniversario-noah-nath': '/clientes/aniversario-noah-nath/IMG_0337.jpg',
      'niver-gi-pedro': '/clientes/niver-gi-pedro/RIK-6512.jpg'
    }
    
    const thumbnail = thumbnails[clientFolder] || `/clientes/${clientFolder}/IMG_0001.jpg`
    
    clients.push({
      id: clientId,
      name: displayName,
      clientName: clientName,
      imageCount: imageCount,
      thumbnail: thumbnail,
      createdAt: new Date().toISOString().split('T')[0],
      hasPassword: hasPassword,
      password: password,
      realFolderName: clientFolder
    })
  } catch (error) {
    // Ignora erros silenciosamente
  }
}

// Função para formatar nome do cliente
function formatClientName(name) {
  return name.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

function AdminPanel({ isDarkMode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verifica se o usuário já está autenticado (persistência na sessão)
    const authStatus = sessionStorage.getItem('adminAuthenticated')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    }
    
    const loadClients = async () => {
      const discoveredClients = await discoverClients()
      setClients(discoveredClients)
      setLoading(false)
    }
    loadClients()
  }, [])

  const handleLogin = (success) => {
    if (success) {
      setIsAuthenticated(true)
      sessionStorage.setItem('adminAuthenticated', 'true')
      sessionStorage.setItem('isAdmin', 'true')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('adminAuthenticated')
    sessionStorage.removeItem('isAdmin')
  }


  const handleViewClient = (clientId) => {
    window.open(`/cliente/${clientId}`, '_blank')
  }


  // Se não estiver autenticado, mostra a tela de login
  if (!isAuthenticated) {
    return <AdminLogin isDarkMode={isDarkMode} onLogin={handleLogin} />
  }

  if (loading) {
    return (
      <div className={`min-h-screen pt-20 pb-12 transition-colors duration-300 ${isDarkMode ? '' : 'bg-white'}`} 
           style={isDarkMode ? { backgroundColor: '#0F1217' } : {}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Carregando painel administrativo...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen pt-20 pb-12 transition-colors duration-300 ${isDarkMode ? '' : 'bg-white'}`} 
         style={isDarkMode ? { backgroundColor: '#0F1217' } : {}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`font-serif text-4xl md:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Painel Administrativo
            </h1>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Gerencie seus clientes e galerias
            </p>
          </div>
          
          <div className="flex space-x-3">
            
            <Button
              onClick={handleLogout}
              variant="outline"
              className={`${isDarkMode 
                ? 'border-red-400 text-red-100 hover:bg-red-800/50 hover:border-red-300 bg-red-900/20' 
                : 'border-red-500 text-red-700 hover:bg-red-50 hover:border-red-600 bg-red-50/50'
              } shadow-lg hover:shadow-xl transition-all duration-200 font-medium`}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>


        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center">
              <Folder className={`h-8 w-8 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                  Total de Clientes
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {clients.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center">
              <Upload className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                  Total de Fotos
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {clients.reduce((total, client) => total + client.imageCount, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center">
              <Settings className={`h-8 w-8 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                  Status
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Ativo
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="space-y-4">
          <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Clientes
          </h2>
          
          {clients.length === 0 ? (
            <div className={`text-center py-12 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl`}>
              <Folder className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Nenhum cliente encontrado
              </h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Crie seu primeiro cliente para começar
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {clients.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative group overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 w-full max-w-sm ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 overflow-hidden">
                    {client.thumbnail ? (
                      <img
                        src={client.thumbnail}
                        alt={formatClientName(client.name)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <Folder className={`h-12 w-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      </div>
                    )}
                  </div>

                  {/* Informações do Cliente */}
                  <div className="p-6">
                    <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {formatClientName(client.name)}
                    </h3>
                    
                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                        {client.imageCount} {client.imageCount === 1 ? 'foto' : 'fotos'}
                      </span>
                      
                      {/* Código de acesso centralizado */}
                      {client.password && (
                        <span className={`px-2 py-1 rounded text-xs font-mono ${isDarkMode ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                          {client.password}
                        </span>
                      )}
                      
                      <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        {client.createdAt}
                      </span>
                    </div>

                    {/* Ações */}
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleViewClient(client.id)}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white w-full shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Galeria
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Instruções */}
        <div className={`mt-16 p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Painel Administrativo
          </h3>
          <div className={`text-sm space-y-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`}>
            <p>• <strong>Como adicionar um cliente (novo fluxo rápido):</strong></p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Crie a pasta em <code className={`px-1 rounded ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'}`}>src/assets/clientes/&lt;nome-da-pasta&gt;/</code></li>
              <li>Coloque as fotos lá dentro (*.jpg, *.jpeg, *.png, *.webp)</li>
              <li>(Opcional) Adicione um arquivo <code className={`px-1 rounded ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'}`}>&lt;nome-da-pasta&gt;.txt</code> com:<br/>Nome: Título da página<br/>Senha: CODIGO</li>
              <li>Rode o projeto normalmente (dev/build). As fotos aparecem automaticamente.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel

