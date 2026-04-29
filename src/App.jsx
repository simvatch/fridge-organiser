import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className='title'> Fridge Organiser </div>
      <button className='add'> Add Item</button>
      <div className='items'> Items:</div>
    </>
  )
}

export default App
