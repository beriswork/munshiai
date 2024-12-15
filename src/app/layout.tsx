import './globals.css'
import { Inter } from 'next/font/google'
import Sidebar from '@/components/Sidebar'
import { CustomerProvider } from '@/context/CustomerContext'
import MongoDBStatus from '@/components/MongoDBStatus'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Credit Management System',
  description: 'Manage your business credits and transactions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <CustomerProvider>
          <MongoDBStatus />
          <div className="min-h-full">
            <Sidebar />
            <main className="pt-16 md:pt-0 md:pl-64">
              <div className="flex-1 flex flex-col min-h-screen">
                <div className="flex-1 pb-24 md:pb-8">
                  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {children}
                  </div>
                </div>
              </div>
            </main>
          </div>
        </CustomerProvider>
      </body>
    </html>
  )
}
