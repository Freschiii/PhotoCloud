import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Folder, Upload, Eye, Settings, LogOut, Copy, Check, Share2, Plus, UploadCloud, X, Database, Film, Trash2, Video, AlertTriangle, RotateCcw, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import AdminLogin from './AdminLogin.jsx'
import { getAllClients } from '@/lib/clientsManifest.js'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

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

// Função para descobrir clientes automaticamente (Local + Supabase)
async function discoverClients() {
  const clients = []
  const currentDate = new Date().toISOString().split('T')[0] // Cache da data

  // 1. Tentar buscar clientes do banco do Supabase se estiver configurado
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: dbClients, error } = await supabase
        .from('clients')
        .select('*, photos(*)')

      if (!error && dbClients) {
        for (const c of dbClients) {
          const photosList = c.photos || []
          clients.push({
            id: c.slug || c.id,
            dbId: c.id,
            name: c.name,
            clientName: c.name,
            imageCount: photosList.length,
            thumbnail: photosList[0]?.url || '',
            createdAt: c.created_at ? c.created_at.split('T')[0] : currentDate,
            hasPassword: !!c.password,
            password: c.password || '',
            realFolderName: `[Supabase] ${c.slug}`,
            isSupabase: true
          })
        }
      }
    } catch (err) {
      console.warn('Não foi possível carregar clientes do Supabase:', err)
    }
  }

  // 2. Manifest local (build-time import)
  const manifestClients = getAllClients()
  for (const entry of manifestClients) {
    if (!clients.some((c) => c.id === entry.id)) {
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
        isSupabase: false
      })
    }
  }

  return clients
}

// Função para buscar projetos cadastrados no Supabase
async function discoverProjects() {
  const projects = []

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: dbProjects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && dbProjects) {
        for (const p of dbProjects) {
          projects.push({
            id: p.id,
            title: p.title || p.name,
            description: p.description || '',
            role: p.role || '',
            year: p.year || '',
            videoUrl: p.video_url || '',
            coverUrl: p.cover_url || '',
            createdAt: p.created_at ? p.created_at.split('T')[0] : '',
            isSupabase: true,
          })
        }
      }
    } catch (err) {
      console.warn('Erro ao buscar projetos do Supabase:', err)
    }
  }

  return projects
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
const ClientCard = memo(({ client, isDarkMode, copiedCode, sharedClient, onCopyCode, onShareClient, onDeleteClient, onAddPhotos, index }) => {
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
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {client.name}
          </h3>
          {client.isSupabase && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onAddPhotos(client)}
                className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40 rounded-lg transition-colors"
                title="Adicionar fotos a este álbum"
              >
                <UploadCloud className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteClient(client)}
                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors"
                title="Excluir álbum"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
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

const ProjectCard = memo(({ project, isDarkMode, onDeleteProject }) => {
  return (
    <div
      className={`rounded-xl overflow-hidden shadow-xl transition-all duration-200 ${
        isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50' : 'bg-white border border-gray-200'
      } hover:shadow-2xl`}
    >
      <div className="aspect-video bg-black relative overflow-hidden flex items-center justify-center">
        {project.coverUrl ? (
          <img src={project.coverUrl} alt={project.title} className="w-full h-full object-cover" />
        ) : (
          <Film className="w-12 h-12 text-gray-500" />
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {project.title}
          </h3>
          {project.isSupabase && (
            <button
              onClick={() => onDeleteProject(project)}
              className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-950/40 transition-colors"
              title="Excluir Projeto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-1 mb-3 text-xs">
          {project.role && (
            <p className={isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}>
              🎬 {project.role} {project.year ? `(${project.year})` : ''}
            </p>
          )}
          {project.description && (
            <p className={`line-clamp-2 whitespace-pre-line break-words ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {project.description}
            </p>
          )}
        </div>

        {project.videoUrl && (
          <a
            href={project.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:underline"
          >
            <Video className="w-3.5 h-3.5" />
            Ver Link / Vídeo
          </a>
        )}
      </div>
    </div>
  )
})
ProjectCard.displayName = 'ProjectCard'

export default function AdminPanel({ isDarkMode = true }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState(null)
  const [sharedClient, setSharedClient] = useState(null)
  const [activeTab, setActiveTab] = useState('clients') // 'clients' | 'projects'

  // Modal para criação de cliente no Supabase
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPassword, setNewClientPassword] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')

  // Estado dos Projetos
  const [projects, setProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [projectTitle, setProjectTitle] = useState('')
  const [projectRole, setProjectRole] = useState('')
  const [projectYear, setProjectYear] = useState('')
  const [projectVideoUrl, setProjectVideoUrl] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [projectCoverFile, setProjectCoverFile] = useState(null)
  const [isUploadingProject, setIsUploadingProject] = useState(false)
  const [projectError, setProjectError] = useState('')
  const [projectSuccess, setProjectSuccess] = useState('')

  // Confirmação de Exclusão
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    type: null, // 'client' | 'project'
    item: null,
  })

  // Toast de Desfazer (Undo)
  const [undoToast, setUndoToast] = useState({
    show: false,
    type: null,
    item: null,
    secondsLeft: 6,
  })
  const undoTimeoutRef = useRef(null)
  const undoIntervalRef = useRef(null)

  // Modal para adicionar fotos a um álbum existente
  const [addPhotosModal, setAddPhotosModal] = useState({ isOpen: false, client: null })
  const [addPhotosFiles, setAddPhotosFiles] = useState([])
  const [isAddingPhotos, setIsAddingPhotos] = useState(false)
  const [addPhotosError, setAddPhotosError] = useState('')
  const [addPhotosSuccess, setAddPhotosSuccess] = useState('')

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
      loadProjects()
    }
  }, [isAuthenticated])

  const loadProjects = async () => {
    setLoadingProjects(true)
    try {
      const discoveredProjects = await discoverProjects()
      setProjects(discoveredProjects)
    } catch (e) {
      console.error('Erro ao carregar projetos:', e)
    } finally {
      setLoadingProjects(false)
    }
  }

  // Inicia pedido de exclusão com aviso
  const handleRequestDelete = (type, item) => {
    setDeleteConfirmation({ isOpen: true, type, item })
  }

  // Confirma exclusão: esconde visualmente e inicia timer para Undo
  const confirmDeletion = () => {
    const { type, item } = deleteConfirmation
    setDeleteConfirmation({ isOpen: false, type: null, item: null })

    if (!item) return

    // Se já existia um undo pendente, executa a exclusão permanente do item anterior imediatamente
    if (undoToast.show && undoToast.item) {
      executePermanentDeletion(undoToast.type, undoToast.item)
    }

    // Remove temporariamente da UI (soft-delete)
    if (type === 'client') {
      setClients((prev) => prev.filter((c) => c.id !== item.id))
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== item.id))
    }

    let secondsLeft = 6
    setUndoToast({ show: true, type, item, secondsLeft })

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
      executePermanentDeletion(type, item)
      setUndoToast({ show: false, type: null, item: null, secondsLeft: 6 })
      if (undoIntervalRef.current) clearInterval(undoIntervalRef.current)
    }, 6000)
  }

  // Cancela a exclusão e restaura o item (UNDO)
  const handleUndo = () => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current)

    const { type, item } = undoToast
    if (item) {
      if (type === 'client') {
        setClients((prev) => [item, ...prev])
      } else {
        setProjects((prev) => [item, ...prev])
      }
    }

    setUndoToast({ show: false, type: null, item: null, secondsLeft: 6 })
  }

  // Exclusão permanente no Supabase
  const executePermanentDeletion = async (type, item) => {
    try {
      if (type === 'client') {
        if (item.dbId) {
          await supabase.from('clients').delete().eq('id', item.dbId)
        }
      } else if (type === 'project') {
        if (item.id) {
          await supabase.from('projects').delete().eq('id', item.id)
        }
      }
    } catch (err) {
      console.error('Erro ao efetuar exclusão permanente no Supabase:', err)
    }
  }

  const handleCreateProjectSupabase = async (e) => {
    e.preventDefault()
    if (!projectTitle.trim()) return

    setIsUploadingProject(true)
    setProjectError('')
    setProjectSuccess('')

    try {
      let coverUrl = ''

      if (projectCoverFile) {
        const filePath = `covers/${Date.now()}_${projectCoverFile.name}`
        const { error: uploadErr } = await supabase.storage
          .from('client-photos')
          .upload(filePath, projectCoverFile)

        if (!uploadErr) {
          const { data: publicUrlData } = supabase.storage
            .from('client-photos')
            .getPublicUrl(filePath)
          coverUrl = publicUrlData?.publicUrl || ''
        }
      }

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

      setProjectSuccess('Projeto cadastrado com sucesso no Supabase!')
      setProjectTitle('')
      setProjectRole('')
      setProjectYear('')
      setProjectVideoUrl('')
      setProjectDriveUrl('')
      setProjectDescription('')
      setProjectCoverFile(null)

      setTimeout(() => {
        setIsProjectModalOpen(false)
        setProjectSuccess('')
        loadProjects()
      }, 1500)
    } catch (err) {
      setProjectError(err.message || 'Erro ao cadastrar projeto.')
    } finally {
      setIsUploadingProject(false)
    }
  }

  const handleDeleteProjectSupabase = async (projectId) => {
    if (!window.confirm('Tem certeza que deseja excluir este projeto?')) return
    try {
      await supabase.from('projects').delete().eq('id', projectId)
      loadProjects()
    } catch (e) {
      console.error('Erro ao excluir projeto:', e)
    }
  }

  const loadClients = async () => {
    setLoading(true)
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      )
      
      const clientsPromise = discoverClients()
      const discoveredClients = await Promise.race([clientsPromise, timeoutPromise])
      setClients(discoveredClients)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut()
    }
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

  const handleUploadPhotosToExistingClient = async (e) => {
    e.preventDefault()
    const client = addPhotosModal.client
    if (!client || addPhotosFiles.length === 0) return

    setIsAddingPhotos(true)
    setAddPhotosError('')
    setAddPhotosSuccess('')

    try {
      const slug = client.id || client.realFolderName
      let count = 0
      let lastErr = ''

      for (const file of addPhotosFiles) {
        const filePath = `${slug}/${Date.now()}_${file.name}`
        const { error: uploadErr } = await supabase.storage
          .from('client-photos')
          .upload(filePath, file)

        if (uploadErr) {
          console.error(`Erro ao enviar ${file.name}:`, uploadErr)
          lastErr = uploadErr.message
          continue
        }

        const { data: publicUrlData } = supabase.storage
          .from('client-photos')
          .getPublicUrl(filePath)

        const photoUrl = publicUrlData?.publicUrl
        if (photoUrl) {
          await supabase.from('photos').insert([
            {
              client_id: client.dbId,
              filename: file.name.replace(/\.[^/.]+$/, ''),
              url: photoUrl,
            },
          ])
          count++
        }
      }

      if (count === 0 && addPhotosFiles.length > 0) {
        throw new Error(
          `Falha no upload (${lastErr || 'Bucket client-photos indisponível'}). Verifique se você criou o bucket 'client-photos' e marcou como público no Supabase Storage.`
        )
      }

      setAddPhotosSuccess(`${count} foto(s) adicionada(s) com sucesso ao álbum!`)
      setAddPhotosFiles([])
      setTimeout(() => {
        setAddPhotosModal({ isOpen: false, client: null })
        setAddPhotosSuccess('')
        loadClients()
      }, 1500)
    } catch (err) {
      setAddPhotosError(err.message || 'Erro ao adicionar fotos.')
    } finally {
      setIsAddingPhotos(false)
    }
  }

  const handleCreateClientSupabase = async (e) => {
    e.preventDefault()
    if (!newClientName.trim()) return

    setIsUploading(true)
    setUploadError('')
    setUploadSuccess('')

    try {
      const slug = newClientName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

      // 1. Criar o registro do cliente na tabela 'clients'
      const { data: insertedClient, error: clientErr } = await supabase
        .from('clients')
        .insert([{ name: newClientName, slug, password: newClientPassword || null }])
        .select()
        .single()

      if (clientErr) throw new Error(`Erro ao criar cliente: ${clientErr.message}`)

      const clientId = insertedClient.id
      let uploadedCount = 0
      let lastErr = ''

      // 2. Fazer upload das fotos se houver
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const filePath = `${slug}/${Date.now()}_${file.name}`

          const { error: uploadErr } = await supabase.storage
            .from('client-photos')
            .upload(filePath, file)

          if (uploadErr) {
            console.error(`Erro ao fazer upload de ${file.name}:`, uploadErr)
            lastErr = uploadErr.message
            continue
          }

          // Obter URL pública da foto
          const { data: publicUrlData } = supabase.storage
            .from('client-photos')
            .getPublicUrl(filePath)

          const photoUrl = publicUrlData?.publicUrl

          if (photoUrl) {
            await supabase.from('photos').insert([
              {
                client_id: clientId,
                filename: file.name.replace(/\.[^/.]+$/, ''),
                url: photoUrl,
              },
            ])
            uploadedCount++
          }
        }
      }

      if (selectedFiles.length > 0 && uploadedCount === 0) {
        setUploadError(
          `O cliente foi criado, mas as fotos não puderam ser enviadas para o Storage (${lastErr || 'Bucket indisponível'}). Lembre-se de criar o bucket 'client-photos' e marcá-lo como público no menu Storage do Supabase.`
        )
        loadClients()
        return
      }

      setUploadSuccess(`Cliente cadastrado com sucesso com ${uploadedCount} foto(s)!`)
      setNewClientName('')
      setNewClientPassword('')
      setSelectedFiles([])
      setTimeout(() => {
        setIsModalOpen(false)
        setUploadSuccess('')
        loadClients()
      }, 1500)
    } catch (err) {
      setUploadError(err.message || 'Ocorreu um erro no cadastro.')
    } finally {
      setIsUploading(false)
    }
  }

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
          className="flex justify-between items-center mb-6 flex-wrap gap-4"
        >
          <div>
            <h1 className={`text-4xl font-bold bg-gradient-to-r ${isDarkMode ? 'from-white via-gray-200 to-white bg-clip-text text-transparent' : 'from-gray-800 via-gray-600 to-gray-800 bg-clip-text text-transparent'}`}>
              Painel Administrativo
            </h1>
            <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Gerencie seus álbuns de fotos e visualizações
            </p>
          </div>
          <div className="flex items-center space-x-3">
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
          </div>
        </motion.div>

        {/* CONTEÚDO DA ABA CLIENTES */}
        {activeTab === 'clients' && (
          <>
            {/* Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              <div className={`p-6 rounded-xl shadow-lg transition-all duration-200 ${isDarkMode ? 'bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/20' : 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200'}`}>
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <Folder className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total de Clientes</p>
                    <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{clients.length}</p>
                  </div>
                </div>
              </div>
              
              <div className={`p-6 rounded-xl shadow-lg transition-all duration-200 ${isDarkMode ? 'bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-500/20' : 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200'}`}>
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
                    <Upload className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total de Fotos</p>
                    <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalPhotos}</p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-xl shadow-lg transition-all duration-200 ${isDarkMode ? 'bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-500/20' : 'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200'}`}>
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                    <Settings className={`w-8 h-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Com Senha</p>
                    <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{clientsWithPassword}</p>
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
                    onDeleteClient={(item) => handleRequestDelete('client', item)}
                    onAddPhotos={(item) => setAddPhotosModal({ isOpen: true, client: item })}
                    index={index}
                  />
                ))}
              </motion.div>
            )}

            {!loading && clients.length === 0 && (
              <div className="text-center py-12">
                <Folder className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Nenhum cliente encontrado</h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Adicione pastas em <code className="px-2 py-1 bg-gray-200 rounded text-sm">src/assets/clientes/</code> ou crie via Supabase!
                </p>
              </div>
            )}
          </>
        )}

        {/* CONTEÚDO DA ABA PROJETOS */}
        {activeTab === 'projects' && (
          <>
            {loadingProjects ? (
              <div className="flex justify-center items-center py-12">
                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-white' : 'border-gray-900'}`}></div>
              </div>
            ) : (
              <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isDarkMode={isDarkMode}
                    onDeleteProject={(item) => handleRequestDelete('project', item)}
                  />
                ))}
              </motion.div>
            )}

            {!loadingProjects && projects.length === 0 && (
              <div className="text-center py-12">
                <Film className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Nenhum projeto cadastrado no Supabase</h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Clique em <strong>"Novo Projeto (Supabase)"</strong> para adicionar seu primeiro trabalho/vídeo ao portfólio!
                </p>
              </div>
            )}
          </>
        )}

        {/* Botão Lab */}
        <div className="mt-16 pt-8 border-t border-gray-700/40 flex justify-center">
          <button
            onClick={() => window.location.href = '/#/lab'}
            className="group flex items-center gap-3 px-6 py-3 border border-green-900 hover:border-green-500 transition-all duration-300"
            style={{ backgroundColor: '#080C10', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-700 group-hover:text-green-400 text-sm transition-colors">~/laboratorio.dev</span>
            <span className="text-green-900 group-hover:text-green-600 text-xs transition-colors">→</span>
          </button>
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
                Tem certeza que deseja excluir o {deleteConfirmation.type === 'client' ? 'álbum' : 'projeto'}{' '}
                <strong>"{deleteConfirmation.item?.name || deleteConfirmation.item?.title}"</strong>?
                <span className="block mt-2 text-xs text-red-400 font-medium">
                  Você terá 6 segundos para desfazer essa exclusão antes que seja apagado do Supabase.
                </span>
              </p>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteConfirmation({ isOpen: false, type: null, item: null })}
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
                    {undoToast.type === 'client' ? 'Álbum' : 'Projeto'} "{undoToast.item?.name || undoToast.item?.title}" removido
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

        {/* Modal para adicionar fotos a um álbum existente */}
        {addPhotosModal.isOpen && addPhotosModal.client && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`w-full max-w-lg p-6 rounded-2xl shadow-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700 text-white' : 'bg-white text-gray-900'}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-indigo-500" />
                  Adicionar Fotos ao Álbum "{addPhotosModal.client.name}"
                </h3>
                <button
                  onClick={() => setAddPhotosModal({ isOpen: false, client: null })}
                  className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUploadPhotosToExistingClient} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Selecione as Fotos</label>
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center ${isDarkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-50'}`}>
                    <UploadCloud className="w-10 h-10 mx-auto mb-2 text-indigo-400" />
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setAddPhotosFiles(Array.from(e.target.files || []))}
                      className="hidden"
                      id="existing-album-photos-upload"
                    />
                    <label htmlFor="existing-album-photos-upload" className="cursor-pointer text-sm text-indigo-400 hover:underline">
                      Clique aqui para escolher as fotos
                    </label>
                    {addPhotosFiles.length > 0 && (
                      <p className="mt-2 text-xs font-semibold text-green-400">
                        {addPhotosFiles.length} foto(s) pronta(s) para enviar
                      </p>
                    )}
                  </div>
                </div>

                {addPhotosError && <p className="text-xs text-red-400 bg-red-950/50 p-2 rounded border border-red-800">{addPhotosError}</p>}
                {addPhotosSuccess && <p className="text-xs text-green-400 bg-green-950/50 p-2 rounded border border-green-800">{addPhotosSuccess}</p>}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                  <Button type="button" variant="outline" onClick={() => setAddPhotosModal({ isOpen: false, client: null })} disabled={isAddingPhotos}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isAddingPhotos || addPhotosFiles.length === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {isAddingPhotos ? 'Enviando...' : 'Enviar Fotos'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
