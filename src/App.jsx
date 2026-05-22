import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './Login'
import Signup from './Signup'
import './App.css'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true'
  })

  const [items, setItems] = useState(['rice', 'pasta', 'milk'])
  const [standard, setstandard] = useState(['flour', 'sugar', 'salt', 'black pepper', 'olive oil', 'vegetable oil', 'rice', 'pasta', 'eggs', 'milk', 'butter', 'bread', 'garlic', 'onions', 'potatoes', 'canned tomatoes', 'canned beans', 'chicken stock', 'tea', 'coffee', 'oats', 'paprika', 'cumin', 'chili flakes', 'soy sauce', 'honey', 'peanut butter'])
  const [needToBuy, setNeedToBuy] = useState([])
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState({})
  const [imageLoading, setImageLoading] = useState({})

  useEffect(() => {
    checkItems()
  }, [items])

  const addItems = () => {
    const newItem = prompt('Enter a new item:')
    if (newItem) { setItems([...items, newItem]) }
  }

  const checkItems = () => {
    const lowerItems = items.map(item => item.toLowerCase())
    const missing = standard.filter(item => !lowerItems.includes(item.toLowerCase()))
    setNeedToBuy(missing)
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
                    {items.map((item, index) => (
                      <li key={index} className="item-row">{item}</li>
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