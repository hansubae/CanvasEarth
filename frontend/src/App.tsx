import { InfiniteCanvas } from './components/InfiniteCanvas'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-200">
      <InfiniteCanvas />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 2000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  )
}

export default App
