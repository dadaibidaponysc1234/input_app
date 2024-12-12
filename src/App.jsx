import { useState } from 'react'
import './App.css'
import HandwritingCanvas from './components/HandwritingCanvas'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className='App'>
        <HandwritingCanvas/>
    </div>
  )
}

export default App
