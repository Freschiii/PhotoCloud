import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react'
import { motion } from 'framer-motion'
import { Folder, Upload, Eye, Settings, LogOut, Copy, Check, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import AdminLogin from './AdminLogin.jsx'
import { getAllClients } from '@/lib/clientsManifest.js'

// Sistema de fila para otimização de imagens com limite de concorrência
class ImageOptimizationQueue {
  constructor(maxConcurrent = 2) {
    this.queue = []
    this.processing = 0
    this.maxConcurrent = maxConcurrent
    this.cache = new Map()
  }

  async optimize(imageSrc, quality = 0.5) {
    const cacheKey = `${imageSrc}_${quality}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ imageSrc, quality, resolve, reject, cacheKey })
      this.processQueue()
    })
  }

  async processQueue() {
    if (this.processing >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    this.processing++
    const { imageSrc, quality, resolve, reject, cacheKey } = this.queue.shift()

    try {
      const optimizedUrl = await this.optimizeImage(imageSrc, quality)
      this.cache.set(cacheKey, optimizedUrl)
      resolve(optimizedUrl)
    } catch (error) {
      reject(error)
    } finally {
      this.processing--
      this.processQueue()
    }
  }

  async optimizeImage(imageSrc, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          // Reduz resolução para 50% (resulta em 1/4 da área)
          canvas.width = Math.floor(img.width * 0.5)
          canvas.height = Math.floor(img.height * 0.5)
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const optimizedUrl = URL.createObjectURL(blob)
                resolve(optimizedUrl)
              } else {
                reject(new Error('Falha ao criar blob'))
              }
            },
            'image/jpeg',
            quality
          )
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => reject(new Error('Erro ao carregar imagem'))
      img.src = imageSrc
    })
  }
}

const thumbnailOptimizationQueue = new ImageOptimizationQueue(2) // Processa 2 thumbnails por vez

// Gera um blur placeholder da própria imagem (similar ao Next.js Image)
async function generateBlurDataURL(imageSrc) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      try {
        // Cria uma versão muito pequena da imagem (10px de largura)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Calcula altura proporcional mantendo aspect ratio
        const aspectRatio = img.height / img.width
        canvas.width = 10
        canvas.height = Math.floor(10 * aspectRatio)
        
        // Desenha a imagem redimensionada
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // Converte para data URL (JPEG com baixa qualidade para ser pequeno)
        const blurDataURL = canvas.toDataURL('image/jpeg', 0.2)
        resolve(blurDataURL)
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => {
      reject(new Error('Erro ao carregar imagem para blur'))
    }
    
    img.src = imageSrc
  })
}

// Função para descobrir clientes automaticamente
async function discoverClients() {
  const clients = []

  // Manifest only (build-time import)
  const manifestClients = getAllClients()
  const currentDate = new Date().toISOString().split('T')[0] // Cache da data
  
  for (const entry of manifestClients) {
    clients.push({
      id: entry.id,
      name: entry.name || entry.folder,
      clientName: entry.name || entry.folder,
      imageCount: entry.imageCount || 0,
      thumbnail: entry.files && entry.files[0] ? entry.files[0].src : '',
      createdAt: currentDate,
      hasPassword: !!entry.password,
      password: entry.password || '',
      realFolderName: entry.folder,
    })
  }

  return clients
}

// Componente de thumbnail otimizado (similar ao Next.js Image do ClientGallery)
const OptimizedThumbnail = memo(({ thumbnail, alt, isDarkMode, index }) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [optimizedSrc, setOptimizedSrc] = useState(null)
  const [blurDataURL, setBlurDataURL] = useState(null)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [showBlur, setShowBlur] = useState(true)
  const imgRef = useRef(null)
  const containerRef = useRef(null)
  const observerRef = useRef(null)
  const optimizedSrcRef = useRef(null)
  
  // Primeiras 6 thumbnails têm prioridade
  const hasPriority = index < 6
  const isAboveFold = index < 9
  
  // Gera blur placeholder da própria imagem - SEMPRE da própria imagem
  useEffect(() => {
    if (!thumbnail) return
    
    let isMounted = true
    
    // Enquanto o blurDataURL não estiver pronto, usa a imagem original (será borrada via CSS)
    setBlurDataURL(thumbnail)
    
    // Gera o blur placeholder otimizado em background
    generateBlurDataURL(thumbnail)
      .then((blurURL) => {
        if (isMounted) {
          // Substitui pela versão otimizada (menor tamanho)
          setBlurDataURL(blurURL)
        }
      })
      .catch(() => {
        // Se falhar, mantém a imagem original (que será borrada via CSS)
        // Não usamos placeholder cinza - sempre a própria imagem
      })
    
    return () => {
      isMounted = false
    }
  }, [thumbnail])
  
  // IntersectionObserver para lazy loading
  useEffect(() => {
    if (!thumbnail) return
    
    // Se está acima do fold, carrega imediatamente
    if (isAboveFold) {
      setShouldLoad(true)
      return
    }
    
    // Para outras imagens, usa IntersectionObserver
    if (typeof IntersectionObserver === 'undefined' || !containerRef.current) {
      return
    }
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true)
            if (observerRef.current) {
              observerRef.current.disconnect()
            }
          }
        })
      },
      { 
        rootMargin: '100px', // Começa a carregar 100px antes de ficar visível
        threshold: 0.01
      }
    )
    
    observerRef.current.observe(containerRef.current)
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [thumbnail, isAboveFold])
  
  // Otimiza a thumbnail quando deve carregar
  useEffect(() => {
    if (!shouldLoad || !thumbnail) {
      return
    }
    
    let isMounted = true
    
    // Todas as thumbnails são otimizadas antes de mostrar (qualidade reduzida para 1/4)
    thumbnailOptimizationQueue.optimize(thumbnail, 0.5)
      .then((url) => {
        if (isMounted) {
          optimizedSrcRef.current = url
          setOptimizedSrc(url) // Sempre usa versão otimizada (qualidade reduzida)
        } else {
          URL.revokeObjectURL(url)
        }
      })
      .catch((error) => {
        // Em caso de erro na otimização, usa a original como fallback
        if (isMounted) {
          setOptimizedSrc(thumbnail)
        }
      })
    
    return () => {
      isMounted = false
      if (optimizedSrcRef.current && optimizedSrcRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(optimizedSrcRef.current)
      }
    }
  }, [shouldLoad, thumbnail])
  
  // Cleanup do blob URL quando o componente desmonta
  useEffect(() => {
    return () => {
      if (optimizedSrcRef.current && optimizedSrcRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(optimizedSrcRef.current)
      }
    }
  }, [])
  
  // Sempre usa versão otimizada (qualidade reduzida) - não usa original como fallback
  const displaySrc = optimizedSrc
  
  if (!thumbnail) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Folder className={`w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
      </div>
    )
  }
  
  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ aspectRatio: '16/9' }}
    >
      {!imageError ? (
        <>
          {/* Blur placeholder da própria imagem - SEMPRE mostra a imagem borrada */}
          {blurDataURL && showBlur && (
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${blurDataURL})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(20px)',
                transform: imageLoaded ? 'scale(1.1)' : 'scale(1)',
                opacity: imageLoaded ? 0 : 1,
                zIndex: 2,
                pointerEvents: 'none',
                transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), filter 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          )}
          
          {/* Thumbnail otimizada (qualidade reduzida para 1/4) */}
          {shouldLoad && displaySrc && (
            <img
              ref={imgRef}
              src={displaySrc}
              alt={alt}
              className="w-full h-full object-cover"
              loading={hasPriority ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={hasPriority ? "high" : "low"}
              onLoad={() => {
                setImageLoaded(true)
                // Remove blur após transição suave completar
                setTimeout(() => {
                  setShowBlur(false)
                }, 800)
              }}
              onError={(e) => {
                console.error(`Erro ao carregar thumbnail: ${alt}`, e)
                setImageError(true)
                setShowBlur(false)
              }}
              style={{
                imageRendering: 'auto',
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                opacity: imageLoaded ? 1 : 0,
                transform: imageLoaded ? 'scale(1)' : 'scale(0.98)',
                transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          )}
          
          {/* Blur para thumbnails que ainda não devem carregar - SEMPRE a própria imagem borrada */}
          {!shouldLoad && blurDataURL && (
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${blurDataURL})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(20px)',
                transform: 'scale(1.1)',
                zIndex: 1
              }}
            />
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Folder className={`w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
        </div>
      )}
    </div>
  )
})

OptimizedThumbnail.displayName = 'OptimizedThumbnail'

// Componente de card do cliente memoizado para evitar re-renders desnecessários
const ClientCard = memo(({ client, isDarkMode, copiedCode, sharedClient, onCopyCode, onShareClient, index }) => {
  const handleViewGallery = useCallback(() => {
    window.location.href = `/#/cliente/${client.id}?admin=true`
  }, [client.id])

  const handleShare = useCallback(() => {
    onShareClient(client)
  }, [client, onShareClient])

  const handleCopy = useCallback(() => {
    onCopyCode(client.id)
  }, [client.id, onCopyCode])

  const formattedDate = useMemo(() => 
    new Date(client.createdAt).toLocaleDateString('pt-BR'),
    [client.createdAt]
  )

  return (
    <div
      className={`rounded-xl overflow-hidden shadow-xl transition-all duration-200 ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50' : 'bg-white border border-gray-200'} hover:shadow-2xl hover:scale-[1.01]`}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-200 relative overflow-hidden">
        <OptimizedThumbnail
          thumbnail={client.thumbnail}
          alt={client.name}
          isDarkMode={isDarkMode}
          index={index}
        />
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
                onClick={handleCopy}
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
              {formattedDate}
            </span>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={handleViewGallery}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            size="sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Galeria
          </Button>
          
          <Button
            onClick={handleShare}
            className={`${sharedClient === client.id 
              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white' 
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
            } shadow-lg hover:shadow-xl transition-all duration-200`}
            size="sm"
            title={sharedClient === client.id ? 'Copiado!' : 'Compartilhar link e código com o cliente'}
          >
            {sharedClient === client.id ? (
              <Check className="w-4 h-4" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
})

ClientCard.displayName = 'ClientCard'

export default function AdminPanel({ isDarkMode = true }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState(null)
  const [sharedClient, setSharedClient] = useState(null)

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

  const copyCode = useCallback(async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Erro ao copiar código:', err)
    }
  }, [])

  const shareClient = useCallback(async (client) => {
    try {
      const baseUrl = window.location.origin
      const clientUrl = `${baseUrl}/#/cliente/${client.id}`
      
      const shareText = `📸 Seu álbum de fotos está pronto!

🔗 Link: ${clientUrl}
🔑 Código: ${client.id}

Acesse o link acima e use o código para visualizar suas fotos!`

      await navigator.clipboard.writeText(shareText)
      setSharedClient(client.id)
      setTimeout(() => setSharedClient(null), 3000)
    } catch (err) {
      console.error('Erro ao compartilhar:', err)
    }
  }, [])

  // Memoiza cálculos para evitar recálculos a cada render
  const totalPhotos = useMemo(() => 
    clients.reduce((total, client) => total + client.imageCount, 0), 
    [clients]
  )
  
  const clientsWithPassword = useMemo(() => 
    clients.filter(client => client.hasPassword).length, 
    [clients]
  )

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
          <div 
            className={`p-6 rounded-xl shadow-lg transition-all duration-200 ${isDarkMode ? 'bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/20' : 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200'}`}
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
          </div>
          
          <div 
            className={`p-6 rounded-xl shadow-lg transition-all duration-200 ${isDarkMode ? 'bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-500/20' : 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200'}`}
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
                  {totalPhotos}
                </p>
              </div>
            </div>
          </div>

          <div 
            className={`p-6 rounded-xl shadow-lg transition-all duration-200 ${isDarkMode ? 'bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-500/20' : 'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200'}`}
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
                  {clientsWithPassword}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Clientes List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-white' : 'border-gray-900'}`}></div>
          </div>
        ) : (
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client, index) => (
              <ClientCard
                key={client.id}
                client={client}
                isDarkMode={isDarkMode}
                copiedCode={copiedCode}
                sharedClient={sharedClient}
                onCopyCode={copyCode}
                onShareClient={shareClient}
                index={index}
              />
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
