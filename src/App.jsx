import { useState } from 'react'

import Navbar from './Navbar'
import './App.css'
import Movies from './Movies'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <Navbar />
     <Movies />
    </>
  )
}

export default App
