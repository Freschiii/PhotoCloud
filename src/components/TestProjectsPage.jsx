import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

// --- Canvas Matrix Rain Ampliado ---
function MatrixCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth
      canvas.height = 560
    }
    resize()
    window.addEventListener('resize', resize)

    const chars = '0123456789ABCDEF<>/{};=+$#@!%&'
    const fontSize = 16
    const columns = Math.floor(canvas.width / fontSize)
    const drops = Array(columns).fill(1)

    const draw = () => {
      ctx.fillStyle = 'rgba(8, 12, 16, 0.15)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#00FF66'
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)]
        const x = i * fontSize
        const y = drops[i] * fontSize

        ctx.fillText(text, x, y)

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="relative border border-green-900/50 bg-[#0C1118] rounded overflow-hidden shadow-2xl">
      <div className="p-3 border-b border-green-900/40 text-xs text-green-700 flex justify-between items-center select-none">
        <span>// exp_01: matrix_rain.canvas</span>
        <span className="text-green-500 animate-pulse">RUNNING [60 FPS]</span>
      </div>
      <canvas ref={canvasRef} className="w-full h-[560px] block" />
    </div>
  )
}

// --- Componente Principal ---
export default function TestProjectsPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080C10', fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace" }}>

      {/* Header estilo Terminal */}
      <div className="border-b border-green-900/50 sticky top-0 z-40" style={{ backgroundColor: 'rgba(8,12,16,0.97)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button onClick={() => navigate('/admin')} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors" title="Voltar ao Admin" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-green-400 text-xs">~/laboratorio.dev</span>
            <span className="text-green-600 text-xs animate-pulse">_</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-green-800">
            <span>MODO: DEV</span>
            <span>|</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Cabeçalho */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-green-700 text-xs mb-2">// AMBIENTE DE EXPERIMENTAÇÃO DE CÓDIGO</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            <span className="text-green-400">_</span>laboratorio<span className="text-green-400">.dev</span>
          </h1>
          <p className="text-green-800 text-sm">Espaço exclusivo para testes de lógica, scripts e experimentos web.</p>
        </motion.div>

        {/* EXPERIMENTO MATRIX (AMPLIADO) */}
        <div className="mb-12">
          <MatrixCanvas />
        </div>

        {/* Rodapé */}
        <div className="pt-6 border-t border-green-900/30 flex items-center justify-between text-xs text-green-900">
          <span>// laboratorio — ambiente interno</span>
          <button onClick={() => navigate('/admin')} className="text-green-800 hover:text-green-400 transition-colors">
            &lt;- voltar ao admin
          </button>
        </div>
      </div>
    </div>
  )
}
