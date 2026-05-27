import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './Login'
import Signup from './Signup'
import './App.css'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true'
  })

  const [items, setItems] = useState([])
  const [history, setHistory] = useState([])
  const [needToBuy, setNeedToBuy] = useState([])
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState({})
  const [imageLoading, setImageLoading] = useState({})

  useEffect(() => {
    fetchItems()
    fetchHistory()
  }, [])
  useEffect(() => {
    checkItems()
  }, [items])

  const fetchItems = async () => {
    try {
      const response = await fetch(
        "https://fridge-organiser.onrender.com/items/1"
      )

      const data = await response.json()

      setItems(data.items)
    } catch (error) {
      console.error("Fetch items error:", error)
    }
  }

  const fetchHistory = async () => {
    try {
      const response = await fetch(
        "https://fridge-organiser.onrender.com/items/history/1"
      )

      const data = await response.json()

      setHistory(data.history || [])
    } catch (error) {
      console.error("History fetch error:", error)
    }
  }

  const addItems = async () => {
    const newItem = prompt('Enter a new item:')
    if (!newItem) return
    
    try {
      const response = await fetch(
        'https://fridge-organiser.onrender.com/items/add',
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user_id: 1,
            name: newItem
          })
        }
      )

      const data = await response.json()

      console.log(data)

      fetchItems()
      fetchHistory()
    } catch (error) {
      console.error("Add item error:", error)
    }
  }

  const checkItems = () => {
    const lowerItems = items.map(item => item.name.toLowerCase())
    const missing = history.filter(
      item => !lowerItems.includes(item.toLowerCase())
    )
    setNeedToBuy(missing)
  }

  const deleteItem = async (itemId) => {
    try {
      const response = await fetch(
        `https://fridge-organiser.onrender.com/items/${itemId}`,
        {
          method: "DELETE"
        }
      )

      const data = await response.json()

      console.log(data)

      fetchItems()
    } catch (error) {
      console.error("Delete item error:", error)
    }
  }
  const generateRecipes = async () => {
    setLoading(true)
    try {
      const response = await fetch('https://fridge-organiser.onrender.com/recipes', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: items })
      })
      const data = await response.json()

      console.log(data.content)

      let cleaned = data.content.trim()

      if (cleaned.startsWith("```json")) {
        cleaned = cleaned
          .replace(/```json/g, "")
          .replace(/```/g, "")
      }

      const parsed = JSON.parse(cleaned)

      setRecipes(parsed.recipes || [])

    } catch (error) {
      console.error('Error parsing AI response:', error)
      alert("Recipe generation failed")
    }
  
    setLoading(false)
  }

  const generateImage = async (recipe, index) => {
    setImageLoading(prev => ({ ...prev, [index]: true }))
    try {
      const res = await fetch('https://fridge-organiser.onrender.com/image', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({prompt: recipe.imagePrompt})
      })
      const data = await res.json()
      const imageUrl = data?.image || data?.data?.[0]?.url || data?.output?.[0]?.image || null
      setImages(prev => ({ ...prev, [index]: imageUrl }))
    } catch (err) {
      console.error(err)
    }
    setImageLoading(prev => ({ ...prev, [index]: false }))
  }

  const loginUser = () => {
    setIsAuthenticated(true)
    localStorage.setItem('isLoggedIn', 'true')
  }

  const logoutUser = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('isLoggedIn')
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login onLogin={loginUser} /> : <Navigate to="/" />} 
        />

        <Route 
          path='/signup'
          element={!isAuthenticated ? <Signup /> : <Navigate to="/" />}
        />
        
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <div className='app'>
                <button onClick={logoutUser} className='add' style={{ alignSelf: 'flex-end', background: '#d9534f' }}>
                  Logout
                </button>

                <div className='title'> Fridge Organiser </div>

                <button onClick={addItems} className='add'> Add Item</button>

                <div className='items'> 
                  <div className="list-header">Current Stock:</div>
                  <ul>
                    {items.map((item) => (
                      <li key={item.id} className="item-row">

                        <span>{item.name}</span>

                        <button
                          onClick={() => deleteItem(item.id)}
                          className='delete-btn'
                        > 
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox='0 0 24 24'
                            fill="none"
                            stroke="#d9534f"
                            strokeWidth="2"
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          >
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <button onClick={generateRecipes} className='add' disabled={loading}>
                  {loading ? 'Generating...' : 'Generate Recipes'}
                </button>

                <div className='recipes-container'>
                  {recipes.map((recipe, index) => (
                    <div className='recipe-card' key={index}>
                      <h2> {recipe.name}</h2>
                      <div className='image-container'>
                        {images[index] ? (
                          <img src={images[index]} alt={recipe.name} />
                        ) : imageLoading[index] ? (
                          <button className='add' disabled>Generating image...</button>
                        ) : (
                          <button onClick={() => generateImage(recipe, index)} className='add'>
                            Generate Preview
                          </button>
                        )}
                      </div>
                      <p>{recipe.description}</p>
                      <div className='recipe-meta'>
                        <span>👪 Serves: {recipe.servings || 'Not specified'}</span>
                      </div>
                      <div className='section'>
                        <h3>🍽️ Steps</h3>
                        <ol>
                          {(recipe.steps || []).map((step, stepIndex) => (
                            <li key={stepIndex}>{step}</li>
                          ))}
                        </ol>
                      </div>
                      {(recipe.missingIngredients || []).length > 0 && (
                        <div className='section'>
                          <h3>🛒 Missing Ingredients</h3>
                          <ul>
                            {recipe.missingIngredients.map((ingredient, index) => (
                              <li key={index}>{ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="cook-time">
                        <span>⏲️ Cook Time: {recipe.cookTime || 'Not specified'}</span>
                      </div>
                    </div>
                  ))}
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
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
      </Routes>
    </BrowserRouter>
  )
}