import React from 'react'
import FilmEntryForm from './components/FilmEntryForm'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            FilmStory
          </h1>
          <p className="text-gray-500">당신의 필름 라이프를 기록하세요</p>
        </header>
        <main>
          <FilmEntryForm />
        </main>
      </div>
    </div>
  )
}

export default App
