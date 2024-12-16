'use client'

import { Fragment, useState, useRef, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, PlusCircleIcon, DocumentIcon, PhotoIcon, MicrophoneIcon, PaperClipIcon } from '@heroicons/react/24/outline'
import { useCustomers } from '@/context/CustomerContext'
import NewCustomerModal from './NewCustomerModal'
import Toast from './Toast'
import LoadingSpinner from './LoadingSpinner'
import { Customer, Transaction } from '@/types'

interface NewTransactionModalProps {
  isOpen: boolean
  onClose: () => void
}

type TransactionType = 'credit' | 'payment' | 'cash' | 'carry-forward' | 'hybrid'

interface Attachment {
  type: 'file' | 'image' | 'audio'
  file: File
  preview?: string
}

interface AudioVisualizerProps {
  audioUrl: string
  duration: number
}

function AudioVisualizer({ audioUrl, duration }: AudioVisualizerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    audio.addEventListener('timeupdate', updateTime)
    return () => audio.removeEventListener('timeupdate', updateTime)
  }, [])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
      <button
        onClick={togglePlay}
        className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
      >
        {isPlaying ? (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="h-4 w-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <div className="flex-grow relative h-8">
        <div className="absolute inset-0 flex items-center">
          <div className="h-1 w-full bg-gray-200 rounded">
            <div 
              className="h-full bg-blue-600 rounded transition-all duration-100"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      </div>

      <div className="flex-shrink-0 text-sm text-gray-500">
        {Math.floor(currentTime)}/{Math.floor(duration)}s
      </div>

      <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
    </div>
  )
}

const initialFormState = {
  type: 'credit' as TransactionType,
  amount: '',
  depositAmount: '',
  creditAmount: '',
  details: ''
}

export default function NewTransactionModal({ isOpen, onClose }: NewTransactionModalProps) {
  const { customers, addTransaction } = useCustomers()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)
  const [formData, setFormData] = useState(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const audioRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (!isOpen) {
      console.log('🔄 Resetting transaction modal state')
      setSearchTerm('')
      setSelectedCustomer(null)
      setFormData(initialFormState)
      setShowDropdown(false)
      setShowNewCustomerModal(false)
      setAttachment(null)
    }
  }, [isOpen])

  const filteredCustomers = searchTerm
    ? customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
      )
    : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return

    setIsSubmitting(true)
    try {
      if (formData.type === 'hybrid') {
        if (parseFloat(formData.creditAmount) > 0) {
          await addTransaction(selectedCustomer.id, {
            customerId: selectedCustomer.id,
            date: new Date(),
            type: 'credit',
            amount: parseFloat(formData.creditAmount),
            description: `${formData.details} (Credit portion)`
          })
        }

        if (parseFloat(formData.depositAmount) > 0) {
          await addTransaction(selectedCustomer.id, {
            customerId: selectedCustomer.id,
            date: new Date(),
            type: 'payment',
            amount: parseFloat(formData.depositAmount),
            description: `${formData.details} (Deposit portion)`
          })
        }
      } else {
        await addTransaction(selectedCustomer.id, {
          customerId: selectedCustomer.id,
          date: new Date(),
          type: formData.type,
          amount: parseFloat(formData.amount),
          description: formData.details
        })
      }

      onClose()
    } catch (error) {
      console.error('Failed to add transaction:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNewCustomerClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🔄 Opening new customer modal from search')
    setShowNewCustomerModal(true)
    setShowDropdown(false) // Hide dropdown when opening new customer modal
  }

  const handleNewCustomerCreated = (customer: Customer) => {
    console.log('✅ New customer created from transaction modal:', customer)
    setSelectedCustomer(customer)
    setSearchTerm(customer.name)
    setShowNewCustomerModal(false)
    setShowDropdown(false)
  }

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setSearchTerm(customer.name)
    setShowDropdown(false)
  }

  const shouldShowDropdown = searchTerm && !selectedCustomer && showDropdown

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size should be less than 5MB')
      return
    }

    const type = file.type.startsWith('image/') ? 'image' : 'file'
    
    setAttachment({
      type,
      file,
      preview: type === 'image' ? URL.createObjectURL(file) : undefined
    })
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      
      recorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' })
        const audioFile = new File([audioBlob], 'voice-note.mp3', { type: 'audio/mp3' })
        
        setAttachment({
          type: 'audio',
          file: audioFile
        })
        
        audioChunksRef.current = []
      }

      recorder.start()
      audioRecorderRef.current = recorder
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone')
    }
  }

  const stopRecording = () => {
    audioRecorderRef.current?.stop()
    setIsRecording(false)
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50" 
        onClose={(open) => {
          if (!showNewCustomerModal) {
            onClose()
          }
        }}
        static
      >
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="relative transform overflow-visible rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 mx-4 w-full md:mx-auto">
              <div className="absolute right-0 top-0 pr-4 pt-4">
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                  onClick={onClose}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Customer Search with Fixed Styling */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Customer
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setSelectedCustomer(null)
                        setShowDropdown(true)
                      }}
                      onFocus={() => setShowDropdown(true)}
                      className="input-field"
                      placeholder="Search by name or phone..."
                    />
                    
                    {shouldShowDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1">
                        <div className="relative z-50 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                          {filteredCustomers.length > 0 ? (
                            <div className="py-1">
                              {filteredCustomers.map((customer) => (
                                <button
                                  key={customer.id}
                                  type="button"
                                  onClick={() => handleCustomerSelect(customer)}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                >
                                  <div className="font-medium">{customer.name}</div>
                                  <div className="text-sm text-gray-600">{customer.phone}</div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleNewCustomerClick}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-blue-600"
                            >
                              <PlusCircleIcon className="h-5 w-5 mr-2" />
                              Add "{searchTerm}" as new customer
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Customer Info */}
                {selectedCustomer && (
                  <>
                    <div className="bg-blue-50 p-4 rounded-md">
                      <div className="font-medium">{selectedCustomer.name}</div>
                      <div className="text-sm text-gray-600">{selectedCustomer.phone}</div>
                      <div className="mt-1 text-sm">
                        Balance: 
                        <span className={`ml-2 font-medium ${
                          selectedCustomer.balance > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          ₹{Math.abs(selectedCustomer.balance).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Transaction Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transaction Type
                      </label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {(['cash', 'credit', 'payment', 'hybrid'] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, type }))}
                            className={`px-3 py-2 text-sm font-medium rounded-md border
                              ${formData.type === type
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              } capitalize`}
                          >
                            {type === 'payment' ? 'Deposit' : type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Amount Fields */}
                    {formData.type === 'hybrid' ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Credit Amount (₹)
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={formData.creditAmount}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              creditAmount: e.target.value 
                            }))}
                            className="input-field"
                            placeholder="Enter credit amount"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Deposit Amount (₹)
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={formData.depositAmount}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              depositAmount: e.target.value 
                            }))}
                            className="input-field"
                            placeholder="Enter deposit amount"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Amount (₹)
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={formData.amount}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            amount: e.target.value 
                          }))}
                          className="input-field"
                          placeholder="Enter amount"
                        />
                      </div>
                    )}

                    {/* Details */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Details
                      </label>
                      <div className="relative">
                        <textarea
                          value={formData.details}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            details: e.target.value 
                          }))}
                          rows={3}
                          className="input-field pr-20"
                          placeholder="Add any notes about this transaction"
                        />
                        <div className="absolute right-2 bottom-2 flex items-center space-x-2">
                          <label className="cursor-pointer p-1.5 rounded-full hover:bg-gray-100">
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={handleFileSelect}
                            />
                            <PaperClipIcon className="h-5 w-5 text-gray-400" />
                          </label>
                          <button
                            type="button"
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            onMouseLeave={stopRecording}
                            className={`p-1.5 rounded-full relative ${
                              isRecording 
                                ? 'bg-red-50 text-red-600 animate-pulse' 
                                : 'hover:bg-gray-100 text-gray-400'
                            }`}
                          >
                            <MicrophoneIcon className="h-5 w-5" />
                            {isRecording && (
                              <span className="absolute -inset-0.5 border-2 border-red-600 rounded-full animate-ping" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Audio Preview */}
                      {attachment?.type === 'audio' && (
                        <div className="mt-2">
                          <div className="text-sm font-medium text-gray-700 mb-1">Voice Note</div>
                          <AudioVisualizer 
                            audioUrl={URL.createObjectURL(attachment.file)}
                            duration={3} // You'll need to get actual duration
                          />
                        </div>
                      )}

                      {/* File Preview */}
                      {attachment?.type === 'file' && (
                        <div className="mt-2 flex items-center space-x-2 bg-gray-50 p-2 rounded">
                          <DocumentIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-600">{attachment.file.name}</span>
                          <button
                            type="button"
                            onClick={() => setAttachment(null)}
                            className="ml-auto p-1 hover:bg-gray-200 rounded-full"
                          >
                            <XMarkIcon className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      )}

                      {/* Image Preview */}
                      {attachment?.type === 'image' && (
                        <div className="mt-2 relative inline-block">
                          <img 
                            src={attachment.preview} 
                            alt="Preview" 
                            className="h-20 w-20 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => setAttachment(null)}
                            className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow"
                          >
                            <XMarkIcon className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-5">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full btn-primary relative"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center justify-center">
                            <LoadingSpinner size="sm" />
                            <span className="ml-2">Processing...</span>
                          </div>
                        ) : (
                          'Record Transaction'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </Dialog.Panel>
          </div>
        </div>

        {/* New Customer Modal */}
        {showNewCustomerModal && (
          <div className="relative z-[70]" onClick={e => e.stopPropagation()}>
            <NewCustomerModal
              isOpen={showNewCustomerModal}
              onClose={() => {
                console.log('🔄 Closing new customer modal')
                setShowNewCustomerModal(false)
              }}
              prefillName={searchTerm}
              onCustomerCreated={(newCustomer) => {
                console.log('✅ New customer created from transaction modal:', newCustomer)
                handleNewCustomerCreated(newCustomer)
              }}
            />
          </div>
        )}

        {/* Toast notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </Dialog>
    </Transition.Root>
  )
} 