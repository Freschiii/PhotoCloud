import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'

// Função para buscar a senha do arquivo senha.txt
async function getClientPassword(clientName) {
  try {
    const response = await fetch(`/clientes/${clientName}/senha.txt`)
    if (response.ok) {
      const password = await response.text()
      return password.trim()
    }
    return null
  } catch (error) {
    console.error('Erro ao buscar senha:', error)
    return null
  }
}

function ClientLogin({ clientName, isDarkMode, onLogin, onBack }) {
  const [code, setCode] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [error, setError] = useState('')
  const [correctPassword, setCorrectPassword] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPassword = async () => {
      const password = await getClientPassword(clientName)
      if (password) {
        setCorrectPassword(password)
      } else {
        setError('Arquivo de senha não encontrado. Entre em contato com o fotógrafo.')
      }
      setLoading(false)
    }
    loadPassword()
  }, [clientName])

  const formatClientName = (name) => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (code.trim() === '') {
      setError('Por favor, digite o código de acesso')
      return
    }

    if (code.trim() === correctPassword) {
      setError('')
      onLogin(true)
    } else {
      setError('Código de acesso incorreto')
    }
  }

  return (
    <div className={`min-h-screen pt-20 pb-12 transition-colors duration-300 ${isDarkMode ? '' : 'bg-white'}`} 
         style={isDarkMode ? { backgroundColor: '#0F1217' } : {}}>
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
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
          
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
            isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'
          }`}>
            <Lock className={`h-10 w-10 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
          </div>
          
          <h1 className={`font-serif text-3xl md:text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Acesso Restrito
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {formatClientName(clientName)}
          </p>
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Digite o código de acesso fornecido para visualizar suas fotos
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
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Carregando...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Código de Acesso
              </label>
              <div className="relative">
                <input
                  type={showCode ? 'text' : 'password'}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Digite o código de acesso"
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 ${
                    isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {showCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              )}
            </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium py-3"
              >
                <Lock className="h-4 w-4 mr-2" />
                Acessar Fotos
              </Button>
            </form>
          )}

          {/* Dica */}
          <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <strong>Dica:</strong> O código de acesso foi fornecido junto com o convite para visualizar suas fotos.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ClientLogin
