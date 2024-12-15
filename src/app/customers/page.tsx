'use client'

import { useState } from 'react'
import { useCustomers } from '@/context/CustomerContext'
import NewCustomerModal from '@/components/NewCustomerModal'
import CustomerDetailsModal from '@/components/CustomerDetailsModal'
import { 
  UserIcon,
  UserCircleIcon,
  PhoneIcon, 
  TrashIcon,
  PencilIcon,
  TableCellsIcon,
  Squares2X2Icon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/solid'
import { 
  DragDropContext, 
  Droppable, 
  Draggable,
  DropResult 
} from 'react-beautiful-dnd'
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'
import Toast from '@/components/Toast'

export default function CustomersPage() {
  const { customers, deleteCustomer } = useCustomers()
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null)
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  )

  const handleDeleteClick = async (customerId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening customer details
    setDeleteCustomerId(customerId)
  }

  const handleConfirmDelete = async () => {
    if (!deleteCustomerId) return

    setIsDeleting(true)
    try {
      await deleteCustomer(deleteCustomerId)
      setShowToast({ message: 'Customer deleted successfully', type: 'success' })
    } catch (error) {
      setShowToast({ 
        message: 'Failed to delete customer', 
        type: 'error' 
      })
    } finally {
      setIsDeleting(false)
      setDeleteCustomerId(null)
    }
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(filteredCustomers)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update your state here if needed
  }

  return (
    <div className="p-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">{customers.length} total customers</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 sm:flex-none sm:min-w-[300px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search customers..."
            />
          </div>
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
            >
              <TableCellsIcon className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
            >
              <Squares2X2Icon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <button
            onClick={() => setIsAddingCustomer(true)}
            className="btn-primary"
          >
            Add Customer
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr 
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer.id)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <UserCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="font-medium text-gray-900">{customer.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-gray-500">
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      {customer.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${customer.balance > 0 ? 'text-red-600' : 'text-green-600'} font-medium`}>
                      ₹{Math.abs(customer.balance).toLocaleString('en-IN', { 
                        maximumFractionDigits: 0 
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => handleDeleteClick(customer.id, e)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => setSelectedCustomer(customer.id)}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-50 p-2.5 rounded-lg">
                      <UserIcon className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="flex items-center text-gray-500 text-sm mt-0.5">
                        <PhoneIcon className="h-3.5 w-3.5 mr-1" />
                        {customer.phone}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // Add delete handler
                    }}
                    className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">Balance</div>
                  <div className={`text-lg font-semibold mt-0.5 ${
                    customer.balance > 0 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    ₹{Math.abs(customer.balance).toLocaleString('en-IN', { 
                      maximumFractionDigits: 0 
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewCustomerModal
        isOpen={isAddingCustomer}
        onClose={() => setIsAddingCustomer(false)}
      />

      {selectedCustomer && (
        <CustomerDetailsModal
          customerId={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}

      {deleteCustomerId && (
        <DeleteConfirmationModal
          isOpen={true}
          onClose={() => setDeleteCustomerId(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Customer"
          message="Are you sure you want to delete this customer? This action cannot be undone."
          isLoading={isDeleting}
        />
      )}

      {showToast && (
        <Toast
          message={showToast.message}
          type={showToast.type}
          onClose={() => setShowToast(null)}
        />
      )}
    </div>
  )
} 