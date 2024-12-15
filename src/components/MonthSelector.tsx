'use client'

import { useState, useEffect } from 'react'
import { ChevronDownIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { format, startOfYear, eachMonthOfInterval, endOfYear } from 'date-fns'

interface MonthSelectorProps {
  selectedDate: Date
  onChange: (date: Date) => void
}

export default function MonthSelector({ selectedDate, onChange }: MonthSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const currentYear = new Date().getFullYear()
  
  const months = eachMonthOfInterval({
    start: startOfYear(new Date(currentYear, 0, 1)),
    end: endOfYear(new Date(currentYear, 11, 31))
  })

  const handleMonthSelect = (date: Date) => {
    onChange(date)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Desktop Version */}
      <div className="hidden md:flex items-center space-x-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-sm font-medium text-gray-700">
            {format(selectedDate, 'MMMM yyyy')}
          </span>
          <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Mobile Version */}
      <div className="md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <CalendarIcon className="h-4 w-4 text-gray-400 mr-1.5" />
          <span className="text-sm font-medium text-gray-700">
            {format(selectedDate, 'MMM yyyy')}
          </span>
          <ChevronDownIcon className="ml-1.5 h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-10 mt-2 w-screen max-w-[200px] px-2 sm:px-0">
          <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="relative bg-white py-2">
              <div className="grid grid-cols-2 gap-1 p-2 max-h-64 overflow-y-auto">
                {months.map((date) => {
                  const isSelected = format(date, 'MMM yyyy') === format(selectedDate, 'MMM yyyy')
                  return (
                    <button
                      key={date.toString()}
                      onClick={() => handleMonthSelect(date)}
                      className={`px-3 py-2 text-sm rounded-md transition-colors
                        ${isSelected 
                          ? 'bg-blue-50 text-blue-600 font-medium' 
                          : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      {format(date, 'MMM')}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 