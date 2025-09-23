import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Download, DownloadCloud, X, ChevronLeft, ChevronRight, CheckCircle, ArrowLeft, FileArchive, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import JSZip from 'jszip'
import TermsModal from './TermsModal'

// Componente de imagem otimizado
const OptimizedImage = React.memo(({ image, isSelected, onImageClick, isSelectMode, onDownloadSingle }) => {
  const [imageError, setImageError] = useState(false)
  
  return (
    <div
      className={`relative group cursor-pointer overflow-hidden rounded-lg shadow-lg ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => onImageClick(image)}
    >
      {!imageError ? (
        <img
          src={image.src}
          alt={image.name}
          className="w-full aspect-[4/3] object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            console.error(`Erro ao carregar imagem: ${image.name} - ${image.src}`, e)
            setImageError(true)
          }}
          style={{
            imageRendering: 'pixelated',
            imageQuality: 'low'
          }}
        />
      ) : (
        <div className="w-full aspect-[4/3] bg-gray-200 flex items-center justify-center">
          <Camera className="w-12 h-12 text-gray-400" />
        </div>
      )}
      
      {/* Overlay com controles */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200">
        {!isSelectMode && (
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDownloadSingle(image)
              }}
              className="bg-white/95 hover:bg-white text-gray-900 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {isSelectMode && (
          <div className="absolute top-2 right-2">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white/90 border-gray-300'
            }`}>
              {isSelected && <CheckCircle size={16} className="text-white" />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

// Função para converter ID do cliente de volta para nome da pasta real
function getRealFolderName(clientId) {
  // Agora os IDs já são os nomes das pastas
  return clientId
}

// Função para descobrir imagens do cliente de forma eficiente
async function getClientImagesEfficiently(clientName) {
  const images = []
  console.log(`Buscando imagens na pasta: ${clientName}`)
  
  try {
    // Varredura rápida: limita alcance e falhas consecutivas e testa só .jpg
    let consecutiveFails = 0
    const MAX_NUMBER = 300
    const FAIL_LIMIT = 30
    for (let i = 1; i <= MAX_NUMBER; i++) {
      let foundAny = false

      // Padrões mais comuns em .jpg
      const commonPatterns = [
        `IMG_${i.toString().padStart(4, '0')}.jpg`,
        `IMG_${i.toString().padStart(3, '0')}.jpg`,
        `IMG_${i.toString().padStart(2, '0')}.jpg`,
        `IMG_${i}.jpg`,
        `${i.toString().padStart(4, '0')}.jpg`,
        `${i.toString().padStart(2, '0')}.jpg`,
        `${i}.jpg`,
        `RIK-${i.toString().padStart(4, '0')}.jpg`,
        `RIK-${i}.jpg`
      ]
      
      // Testa cada padrão
      for (const name of commonPatterns) {
        try {
          const response = await fetch(`/clientes/${clientName}/${name}`, { method: 'HEAD', cache: 'no-store' })
          if (response.ok) {
            images.push({
              name: name.replace(/\.[^/.]+$/, ''), // Remove extensão
              src: `/clientes/${clientName}/${name}`
            })
            foundAny = true
            break // Só conta uma vez por número
          }
        } catch (error) {
          // Continua tentando
        }
      }
      
      // Se não encontrou nenhuma imagem com esse número, conta como falha
      if (!foundAny) {
        consecutiveFails++
        if (consecutiveFails >= FAIL_LIMIT) break
      } else {
        consecutiveFails = 0
      }
    }
  } catch (error) {
    console.error('Erro ao carregar imagens:', error)
  }
  
  console.log(`Total de imagens encontradas: ${images.length}`)
  return images
}

// Função para descobrir dinamicamente as imagens do cliente (fallback)
async function getClientImagesDirectly(clientName) {
  const images = []
  console.log(`Buscando imagens na pasta: ${clientName}`)
  
  try {
    // Testa TODOS os números possíveis de 1 a 10000
    for (let i = 1; i <= 10000; i++) {
      // Testa TODAS as extensões possíveis
      const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
      
      // Testa TODOS os padrões possíveis
      const possibleNames = [
        `IMG_${i.toString().padStart(4, '0')}`,
        `IMG_${i.toString().padStart(3, '0')}`,
        `IMG_${i.toString().padStart(2, '0')}`,
        `IMG_${i}`,
        `foto${i.toString().padStart(4, '0')}`,
        `foto${i.toString().padStart(3, '0')}`,
        `foto${i.toString().padStart(2, '0')}`,
        `foto${i}`,
        `image${i.toString().padStart(4, '0')}`,
        `image${i.toString().padStart(3, '0')}`,
        `image${i.toString().padStart(2, '0')}`,
        `image${i}`,
        `photo${i.toString().padStart(4, '0')}`,
        `photo${i.toString().padStart(3, '0')}`,
        `photo${i.toString().padStart(2, '0')}`,
        `photo${i}`,
        `${i.toString().padStart(4, '0')}`,
        `${i.toString().padStart(3, '0')}`,
        `${i.toString().padStart(2, '0')}`,
        `${i}`,
        `RIK-${6630 + i}`,
        `RIK-${i.toString().padStart(4, '0')}`,
        `RIK-${i.toString().padStart(3, '0')}`,
        `RIK-${i.toString().padStart(2, '0')}`,
        `RIK-${i}`
      ]
      
      // Para cada nome, testa todas as extensões
      for (const name of possibleNames) {
        for (const ext of extensions) {
          const fullName = name + ext
          try {
            const response = await fetch(`/clientes/${clientName}/${fullName}`, { method: 'HEAD' })
            if (response.ok) {
              images.push({
                name: name, // Remove extensão
                src: `/clientes/${clientName}/${fullName}`
              })
              console.log(`Encontrou imagem: ${fullName}`)
            }
          } catch (error) {
            // Continua tentando
          }
        }
      }
    }
  } catch (error) {
    console.error('Erro ao carregar imagens:', error)
  }
  
  console.log(`Total de imagens encontradas: ${images.length}`)
  return images
}

// Função para baixar uma imagem individual
function downloadImage(imageSrc, imageName) {
  const link = document.createElement('a')
  link.href = imageSrc
  link.download = `${imageName}.jpg`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Função para baixar todas as imagens como ZIP
async function downloadAllImages(images, clientName, onProgress) {
  try {
    if (images.length <= 5) {
      // Para 5 ou menos fotos, baixa individualmente
      for (let i = 0; i < images.length; i++) {
        setTimeout(() => {
          downloadImage(images[i].src, `${clientName}-${i + 1}`)
        }, i * 500) // Delay entre downloads para evitar bloqueio do navegador
      }
      return
    }

    // Para mais de 5 fotos, cria um ZIP
    const zip = new JSZip()
    const folder = zip.folder(clientName)

    for (let i = 0; i < images.length; i++) {
      try {
        onProgress?.(i + 1, images.length)
        
        const response = await fetch(images[i].src)
        const blob = await response.blob()
        const fileName = `${images[i].name}.jpg`
        folder.file(fileName, blob)
      } catch (error) {
        console.error(`Erro ao processar imagem ${i + 1}:`, error)
      }
    }

    // Gera o ZIP
    onProgress?.(images.length, images.length, 'Gerando ZIP...')
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    
    // Faz o download do ZIP
    const link = document.createElement('a')
    link.href = URL.createObjectURL(zipBlob)
    link.download = `${clientName}-fotos.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
    
  } catch (error) {
    console.error('Erro ao baixar imagens:', error)
  }
}

function ClientGallery({ clientName, isDarkMode, onBack }) {
  const navigate = useNavigate()
  
  // Verifica se é admin ANTES de tudo
  const urlParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '')
  const hasAdminParam = urlParams.get('admin') === 'true' || hashParams.get('admin') === 'true'
  const isAdminFromSession = localStorage.getItem('adminAuth') === 'true'
  // Só é admin se estiver autenticado E tiver o parâmetro
  const isAdmin = isAdminFromSession && hasAdminParam
  
  // Debug da URL completa
  console.log('URL completa:', window.location.href)
  console.log('URL search:', window.location.search)
  console.log('URL hash:', window.location.hash)
  console.log('URL params:', Object.fromEntries(urlParams.entries()))
  
  const [images, setImages] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedImages, setSelectedImages] = useState(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0, status: '' })
  const [showDownloadPopup, setShowDownloadPopup] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(isAdmin) // Inicia como true se for admin
  const [clientIdentification, setClientIdentification] = useState('')
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hasMoved, setHasMoved] = useState(false)
  const [clientPassword, setClientPassword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const imagesPerPage = 50
  const galleryTopRef = useRef(null)
  const prevPageRef = useRef(1)

  useEffect(() => {
    // Carrega informações do cliente a partir do manifest e carrega as imagens da pasta
    const loadClientInfo = async () => {
      try {
        // Lê do manifest build-time (sem fetch de arquivos soltos)
        try {
          const { getClientById, getClientImages } = await import('@/lib/clientsManifest.js')
          const entry = getClientById(clientName)
          if (entry) {
            if (entry.password) {
              setClientPassword(entry.password)
              setClientIdentification(entry.password)
            } else {
              setClientPassword('')
              setClientIdentification('')
            }
            const imgs = getClientImages(clientName)
            if (imgs && imgs.length) {
              const mapped = imgs.map(f => ({ name: f.name, src: f.src }))
              setImages(mapped)
              try { sessionStorage.setItem(`imageCount_${clientName}`, String(mapped.length)) } catch (_) {}
              return
            }
          }
        } catch (_) {}

        // Fallback leve (caso não tenha manifest em dev)
        const fallbackImages = await getClientImagesEfficiently(clientName)
        setImages(fallbackImages)
        try { sessionStorage.setItem(`imageCount_${clientName}`, String(fallbackImages.length)) } catch (_) {}
        console.log(`Carregou ${fallbackImages.length} imagens da pasta: ${clientName}`)
        console.log('Imagens carregadas:', fallbackImages.map(img => img.name))
        console.log('Primeiras 10 imagens:', fallbackImages.slice(0, 10).map(img => ({ name: img.name, src: img.src })))
      } catch (error) {
        console.error('Erro ao carregar informações do cliente:', error)
      }
    }
    loadClientInfo()
    // restaura página salva por cliente
    try {
      const saved = parseInt(sessionStorage.getItem(`galleryPage_${clientName}`) || '1', 10)
      if (Number.isFinite(saved) && saved > 0) {
        prevPageRef.current = saved
        setCurrentPage(saved)
      }
    } catch (_) {}
  }, [clientName])

  // salva página e rola para o topo da galeria ao mudar
  useEffect(() => {
    try { sessionStorage.setItem(`galleryPage_${clientName}`, String(currentPage)) } catch (_) {}
    // Só sobe para o topo quando avançar de página; ao voltar, mantém posição
    const prev = prevPageRef.current
    if (currentPage > prev) {
      if (galleryTopRef.current) {
        galleryTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
    prevPageRef.current = currentPage
  }, [currentPage, clientName])

  // Infinite scroll usando IntersectionObserver
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const sentinel = document.getElementById('infinite-sentinel')
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (entry.isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + 24, images.length))
      }
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [images.length])

  // Debug: Log para verificar se está detectando admin
  console.log('isAdmin:', isAdmin, 'hasAdminParam:', hasAdminParam, 'isAdminFromSession:', isAdminFromSession)

  // Busca a senha do cliente para exibir para admins (do manifest)
  useEffect(() => {
    if (!isAdmin) return
    (async () => {
      try {
        const { getClientById } = await import('@/lib/clientsManifest.js')
        const entry = getClientById(clientName)
        setClientPassword(entry?.password || '')
      } catch (_) {}
    })()
  }, [clientName, isAdmin])

  // Verifica autenticação e redireciona se necessário
  useEffect(() => {
    // Se é admin, força acesso total
    if (isAdmin) {
      console.log('Admin detected - bypassing all authentication')
      setHasAcceptedTerms(true)
      sessionStorage.setItem('termsAccepted', 'true')
      sessionStorage.setItem(`client_${clientName}`, 'true')
      return
    }
    
    const clientAuthenticated = sessionStorage.getItem(`client_${clientName}`) === 'true'
    
    // Se não é admin e não está autenticado como cliente, redireciona
    if (!clientAuthenticated) {
      navigate('/clientes')
      return
    }
    
    const termsAccepted = sessionStorage.getItem('termsAccepted') === 'true'
    if (termsAccepted) {
      setHasAcceptedTerms(true)
    }
  }, [clientName, navigate, isAdmin])

  // Garante que admin sempre tenha acesso
  useEffect(() => {
    console.log('useEffect admin check:', isAdmin)
    if (isAdmin) {
      console.log('Setting hasAcceptedTerms to true for admin')
      setHasAcceptedTerms(true)
    }
  }, [isAdmin])


  // Mostra modal de termos se necessário (DESATIVADO TEMPORARIAMENTE)
  useEffect(() => {
    // const isAdmin = sessionStorage.getItem('isAdmin') === 'true'
    // const termsAccepted = sessionStorage.getItem('termsAccepted') === 'true'
    
    // if (!isAdmin && !termsAccepted && images.length > 0 && !showTermsModal) {
    //   setShowTermsModal(true)
    // }
  }, [images.length, showTermsModal])

  const handleImageClick = useCallback((image) => {
    if (isSelectMode) {
      const newSelected = new Set(selectedImages)
      if (newSelected.has(image.name)) {
        newSelected.delete(image.name)
      } else {
        newSelected.add(image.name)
      }
      setSelectedImages(newSelected)
    } else {
      const imageIndex = images.findIndex(img => img.name === image.name)
      setSelectedImageIndex(imageIndex)
      setSelectedImage(image)
    }
  }, [isSelectMode, selectedImages, images])

  const handleDownloadSingle = useCallback((image) => {
    downloadImage(image.src, image.name)
  }, [])

  // Funções de zoom
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 1))
  }

  const resetZoom = () => {
    setZoomLevel(1)
    setImagePosition({ x: 0, y: 0 })
  }

  // Reset zoom e posição quando muda imagem
  useEffect(() => {
    setZoomLevel(1)
    setImagePosition({ x: 0, y: 0 })
  }, [selectedImage])

  // Reset posição quando zoom volta a 100%
  useEffect(() => {
    if (zoomLevel === 1) {
      setImagePosition({ x: 0, y: 0 })
    }
  }, [zoomLevel])

  // Bloqueia scroll da página quando lightbox está aberto
  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [selectedImage])

  // Funções de arrastar
  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
      setHasMoved(false)
      // Salva a posição atual do mouse e da imagem
      setDragStart({ 
        x: e.clientX, 
        y: e.clientY 
      })
    }
  }


  const handleMouseUp = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  // Adiciona event listeners globais para arrastar
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        setHasMoved(true)
        
        // Calcula a diferença do movimento do mouse
        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y
        
        // Aplica fator de sensibilidade (0.5 = metade da velocidade)
        const sensitivity = 0.5
        const adjustedDeltaX = deltaX * sensitivity
        const adjustedDeltaY = deltaY * sensitivity
        
        // Nova posição baseada na posição atual + diferença ajustada
        const newX = imagePosition.x + adjustedDeltaX
        const newY = imagePosition.y + adjustedDeltaY
        
        // Calcula limites baseados no zoom e tamanho da tela
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        
        // Limite baseado no zoom - quanto mais zoom, mais pode arrastar
        const zoomFactor = zoomLevel - 1 // 0 a 1 (100% a 200%)
        const maxMoveX = (viewportWidth * 0.25) * zoomFactor // 25% da tela por nível de zoom
        const maxMoveY = (viewportHeight * 0.25) * zoomFactor
        
        // Aplica limites suavemente
        const limitedX = Math.max(-maxMoveX, Math.min(maxMoveX, newX))
        const limitedY = Math.max(-maxMoveY, Math.min(maxMoveY, newY))
        
        setImagePosition({
          x: limitedX,
          y: limitedY
        })
        
        // Atualiza o ponto de referência para o próximo movimento
        setDragStart({ x: e.clientX, y: e.clientY })
      }

      const handleGlobalMouseUp = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        // Reset hasMoved após um pequeno delay para evitar fechamento acidental
        setTimeout(() => setHasMoved(false), 100)
      }

      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false })
      document.addEventListener('mouseup', handleGlobalMouseUp, { passive: false })

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        document.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isDragging, dragStart.x, dragStart.y, zoomLevel, imagePosition.x, imagePosition.y])

  // Zoom com scroll
  const handleWheel = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoomLevel(prev => Math.max(1, Math.min(2, prev + delta)))
  }


  const handleDownloadSelected = async () => {
    if (selectedImages.size === 0) return
    
    setIsDownloading(true)
    setShowDownloadPopup(true)
    setDownloadProgress({ current: 0, total: 0, status: 'Iniciando download...' })
    
    const selectedImagesList = images.filter(img => selectedImages.has(img.name))
    
    await downloadAllImages(selectedImagesList, clientName, (current, total, status) => {
      setDownloadProgress({ current, total, status: status || `Processando ${current} de ${total} fotos...` })
    })
    
    setIsDownloading(false)
    setShowDownloadPopup(false)
    setSelectedImages(new Set())
    setIsSelectMode(false)
  }

  const handleDownloadAll = async () => {
    setIsDownloading(true)
    setShowDownloadPopup(true)
    setDownloadProgress({ current: 0, total: 0, status: 'Iniciando download...' })
    
    await downloadAllImages(images, clientName, (current, total, status) => {
      setDownloadProgress({ current, total, status: status || `Processando ${current} de ${total} fotos...` })
    })
    
    setIsDownloading(false)
    setShowDownloadPopup(false)
  }

  const handleAcceptTerms = (clientName) => {
    setClientIdentification(clientName)
    setHasAcceptedTerms(true)
    setShowTermsModal(false)
    // Salva a aceitação no sessionStorage para não mostrar novamente nesta sessão
    sessionStorage.setItem('termsAccepted', 'true')
  }

  const handleCloseTerms = () => {
    setShowTermsModal(false)
    // Se o usuário fechar sem aceitar, volta para a página de clientes
    if (!hasAcceptedTerms) {
      navigate('/clientes')
    }
  }

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode)
    setSelectedImages(new Set())
  }

  const formatClientName = (name) => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const handlePreviousImage = () => {
    const prevIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1
    setSelectedImageIndex(prevIndex)
    setSelectedImage(images[prevIndex])
  }

  const handleNextImage = () => {
    const nextIndex = selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0
    setSelectedImageIndex(nextIndex)
    setSelectedImage(images[nextIndex])
  }

  const handleKeyDown = (e) => {
    if (selectedImage) {
      if (e.key === 'ArrowLeft') handlePreviousImage()
      if (e.key === 'ArrowRight') handleNextImage()
      if (e.key === 'Escape') setSelectedImage(null)
    }
  }

  useEffect(() => {
    if (selectedImage) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedImage, selectedImageIndex])



  if (images.length === 0) {
    return (
      <div className={`min-h-screen pt-20 pb-12 transition-colors duration-300 ${isDarkMode ? '' : 'bg-white'}`} 
           style={isDarkMode ? { backgroundColor: '#0F1217' } : {}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <h1 className={`font-serif text-4xl md:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {formatClientName(clientName)}
            </h1>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Nenhuma foto encontrada para este cliente.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen pt-20 pb-12 transition-colors duration-300 ${isDarkMode ? '' : 'bg-white'}`} 
         style={isDarkMode ? { backgroundColor: '#0F1217' } : {}}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          {onBack && (
            <div className="flex justify-start mb-4">
              <Button
                onClick={onBack}
                variant="outline"
                className={`${isDarkMode 
                  ? 'border-gray-400 text-gray-100 hover:bg-gray-600 hover:border-gray-300 bg-gray-800/50' 
                  : 'border-gray-400 text-gray-800 hover:bg-gray-100 hover:border-gray-500 bg-white'
                } shadow-lg hover:shadow-xl transition-all duration-200 font-medium`}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
          )}
          <h1 className={`font-serif text-4xl md:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {formatClientName(clientName)}
          </h1>
          
          
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {images.length} {images.length === 1 ? 'foto disponível' : 'fotos disponíveis'}
          </p>
        </div>

        {/* Controles */}
        <div className="flex flex-wrap justify-center gap-4 mb-8 relative">
          <Button
            onClick={toggleSelectMode}
            variant={isSelectMode ? "default" : "outline"}
            className={`${isSelectMode 
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl' 
              : isDarkMode 
                ? 'border-blue-400 text-blue-200 hover:bg-blue-900/30 hover:border-blue-300 bg-blue-900/20' 
                : 'border-blue-500 text-blue-700 hover:bg-blue-50 hover:border-blue-600 bg-blue-50/50'
            } transition-all duration-200 shadow-lg hover:shadow-xl font-medium`}
          >
            {isSelectMode ? 'Cancelar Seleção' : 'Selecionar Fotos'}
          </Button>



          {isSelectMode && selectedImages.size > 0 && (
            <Button
              onClick={handleDownloadSelected}
              disabled={isDownloading}
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Selecionadas ({selectedImages.size})
            </Button>
          )}

          <Button
            onClick={handleDownloadAll}
            disabled={isDownloading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <DownloadCloud className="h-4 w-4 mr-2" />
            {isDownloading ? 'Baixando...' : 'Baixar Todas'}
          </Button>

          {/* Código de acesso para admins - posicionado no canto superior direito */}
          {isAdmin && clientPassword && (
            <div className={`absolute top-0 right-0 px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
              <span className="font-mono">{clientPassword}</span>
            </div>
          )}
        </div>


        {/* Galeria de Imagens */}
        {images.length > 0 && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* âncora do topo da página da galeria */}
            <div ref={galleryTopRef} className="h-0" />
            {images
              .slice((currentPage - 1) * imagesPerPage, currentPage * imagesPerPage)
              .map((image, index) => {
                console.log(`Renderizando imagem ${index + 1}:`, image.name, image.src)
                return (
                  <OptimizedImage
                    key={image.name}
                    image={image}
                    isSelected={selectedImages.has(image.name)}
                    onImageClick={handleImageClick}
                    isSelectMode={isSelectMode}
                    onDownloadSingle={handleDownloadSingle}
                  />
                )
              })}
          </div>
        )}

        {/* Paginação */}
        {images.length > imagesPerPage && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
              Página {currentPage} de {Math.ceil(images.length / imagesPerPage)}
            </span>
            <Button
              variant="outline"
              disabled={currentPage >= Math.ceil(images.length / imagesPerPage)}
              onClick={() => setCurrentPage((p) => Math.min(Math.ceil(images.length / imagesPerPage), p + 1))}
            >
              Próxima
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Botão Flutuante de Download - Aparece quando há imagens selecionadas */}
        {isSelectMode && selectedImages.size > 0 && (
          <motion.div
            initial={{ 
              scale: 0, 
              opacity: 0,
              y: 50
            }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              y: 0
            }}
            exit={{ 
              scale: 0, 
              opacity: 0,
              y: 50
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              duration: 0.4
            }}
            className="fixed bottom-6 right-1/2 transform translate-x-1/2 md:right-[23%] md:transform-none md:translate-x-0 z-40"
          >
            <motion.div
              whileHover={{ 
                scale: 1.02,
                y: -2
              }}
              whileTap={{ 
                scale: 0.98,
                y: 0
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25
              }}
            >
              <Button
                onClick={handleDownloadSelected}
                disabled={isDownloading}
                className="bg-green-600 hover:bg-green-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-full px-8 py-4 flex items-center justify-center group relative overflow-hidden min-w-[240px] text-base border-2 border-white/20 hover:border-white/40"
              >
                <motion.div
                  animate={{ 
                    rotate: isDownloading ? 360 : 0 
                  }}
                  transition={{ 
                    duration: 1, 
                    repeat: isDownloading ? Infinity : 0,
                    ease: "linear"
                  }}
                  className="mr-2"
                >
                  <Download className="h-5 w-5" />
                </motion.div>
                
                <span className="font-medium text-sm">
                  {isDownloading ? 'Baixando...' : `Baixar ${selectedImages.size} foto${selectedImages.size > 1 ? 's' : ''}`}
                </span>
                
                {/* Efeito de pulso quando está baixando */}
                {isDownloading && (
                  <motion.div
                    className="absolute inset-0 bg-green-400 rounded-full"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.3, 0, 0.3]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}
        


        {/* Botão Carregar Mais - Removido para teste */}

        {/* Popup de Download */}
        <AnimatePresence>
          {showDownloadPopup && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-6 right-6 z-50"
            >
              <div className={`p-4 rounded-xl shadow-2xl max-w-sm ${
                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {images.length > 5 ? (
                      <FileArchive className={`h-6 w-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    ) : (
                      <DownloadCloud className={`h-6 w-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {images.length > 5 ? 'Criando arquivo ZIP...' : 'Baixando fotos...'}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      {downloadProgress.status}
                    </p>
                    {downloadProgress.total > 0 && (
                      <div className="mt-2">
                        <div className={`w-full rounded-full h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isDarkMode ? 'bg-indigo-500' : 'bg-indigo-600'
                            }`}
                            style={{ 
                              width: `${(downloadProgress.current / downloadProgress.total) * 100}%` 
                            }}
                          />
                        </div>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {downloadProgress.current} de {downloadProgress.total} fotos
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lightbox */}
        <AnimatePresence>
          {selectedImage && !isSelectMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                onClick={(e) => {
                 // Fecha se clicar no background, não estiver arrastando e não houve movimento
                 if (e.target === e.currentTarget && !isDragging && !hasMoved) {
                   setSelectedImage(null)
                   setZoomLevel(1)
                   setImagePosition({ x: 0, y: 0 })
                 }
               }}
              onWheel={handleWheel}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                 className="lightbox-container relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center overflow-hidden"
                 onWheel={handleWheel}
                 onMouseDown={(e) => {
                   // Previne fechamento quando clica no container
                   e.stopPropagation()
                 }}
                 onClick={(e) => {
                   // Só fecha se clicar no container (não na imagem), não estiver arrastando e não houve movimento
                   if (e.target.classList.contains('lightbox-container') && !isDragging && !hasMoved) {
                     setSelectedImage(null)
                     setZoomLevel(1)
                     setImagePosition({ x: 0, y: 0 })
                   }
                 }}
              >
                <img
                  src={selectedImage.src}
                  alt={selectedImage.name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
                  style={{ 
                    maxWidth: '90vw', 
                    maxHeight: '90vh',
                    width: 'auto',
                    height: 'auto',
                    imageRendering: 'high-quality',
                    transform: `scale(${zoomLevel}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                    transformOrigin: 'center center',
                    cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                  }}
                  onMouseDown={handleMouseDown}
                  draggable={false}
                />
                
                {/* Controles de navegação com setas arredondadas */}
                {images.length > 1 && (
                  <>
                    <Button
                      onClick={handlePreviousImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/95 hover:bg-gray-300 text-gray-900 shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-12 h-12 border-2 border-transparent hover:border-gray-500"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/95 hover:bg-gray-300 text-gray-900 shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-12 h-12 border-2 border-transparent hover:border-gray-500"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
                
                {/* Controles de zoom */}
                <div className="absolute top-4 left-4 flex space-x-2">
                  <Button
                    onClick={handleZoomOut}
                    className="bg-white/95 hover:bg-gray-300 text-gray-900 shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-10 h-10 border-2 border-transparent hover:border-gray-500"
                  >
                    -
                  </Button>
                  <Button
                    onClick={resetZoom}
                    className="bg-white/95 hover:bg-gray-300 text-gray-900 shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-10 h-10 text-xs border-2 border-transparent hover:border-gray-500"
                  >
                    {Math.round(zoomLevel * 100)}%
                  </Button>
                  <Button
                    onClick={handleZoomIn}
                    className="bg-white/95 hover:bg-gray-300 text-gray-900 shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-10 h-10 border-2 border-transparent hover:border-gray-500"
                  >
                    +
                  </Button>
                </div>
                
                {/* Contador de imagens */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {selectedImageIndex + 1} / {images.length}
                </div>
                
                {/* Controles superiores */}
                <div className="absolute top-4 right-4 flex space-x-2">
                  <Button
                    onClick={() => handleDownloadSingle(selectedImage)}
                    className="bg-white/95 hover:bg-gray-200 text-gray-900 hover:text-green-700 shadow-lg hover:shadow-green-400/60 transition-all duration-200 rounded-full border-2 border-transparent hover:border-green-600 hover:ring-2 hover:ring-green-400/50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedImage(null)
                      setZoomLevel(1)
                      setImagePosition({ x: 0, y: 0 })
                    }}
                    className="bg-white/95 hover:bg-gray-300 text-gray-900 shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-10 h-10 border-2 border-transparent hover:border-gray-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay para bloquear interação quando modal de termos estiver aberto */}
        {showTermsModal && (
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        )}

        {/* Modal de Termos de Serviço */}
        <TermsModal
          isOpen={showTermsModal}
          onAccept={handleAcceptTerms}
          onClose={handleCloseTerms}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  )
}

export default ClientGallery

