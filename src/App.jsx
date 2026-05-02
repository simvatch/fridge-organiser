import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [items, setItems] = useState(['rice', 'pasta', 'milk'])
  const [standard, setstandard] = useState(['flour', 'sugar', 'salt', 'black pepper', 'olive oil', 'vegetable oil', 'rice', 'pasta', 'eggs', 'milk', 'butter', 'bread', 'garlic', 'onions', 'potatoes', 'canned tomatoes', 'canned beans', 'chicken stock', 'tea', 'coffee', 'oats', 'paprika', 'cumin', 'chili flakes', 'soy sauce', 'honey', 'peanut butter'])
  const [needToBuy, setNeedToBuy] = useState([])

  useEffect(() => {
    checkItems()
  }, [items])

  const addItems = () => {
    const newItem = prompt('Enter a new item:')
    if (newItem) {
      setItems([...items, newItem])
    }
  }

  const checkItems = () => {
    const lowerItems = items.map(item => item.toLowerCase())
    const missing = standard.filter(item => !lowerItems.includes(item.toLowerCase()))
    setNeedToBuy(missing)
  }

  return (
    <>
      <div className='app'>
        <div className='title'> Fridge Organiser </div>
        <button onClick={addItems} className='add'> Add Item</button>
        <div className='items'> 
          <div className="list-header">Current Stock:</div>
          <ul>
            {items.map((item,index) => (
              <li key={index} className="item-row">{item}</li>
            ))}
          </ul>
        </div>
        <div className='items'>
          <div className="list-header">Need to Buy:</div>
          <ul>
            {needToBuy.map((item, index) => (
              <li key={index} className="item-row">{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}

export default App
