'use client'

interface CustomerCardProps {
  name: string
  phone: string
  balance: number
  onClick: () => void
}

export default function CustomerCard({ name, phone, balance, onClick }: CustomerCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
    >
      <h3 className="font-semibold text-lg">{name}</h3>
      <p className="text-gray-600">{phone}</p>
      <div className="mt-2">
        <span className="text-sm text-gray-500">Balance:</span>
        <span className={`ml-2 font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
          ₹{Math.abs(balance).toFixed(2)}
        </span>
      </div>
    </div>
  )
} 