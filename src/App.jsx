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
  const [imageFile, setImageFile] = useState(null)
  const [detectingItems, setDetectingItems] = useState(false)
  const [expandedItem, setExpandedItem] = useState(null)
  const [deleteAmount, setDeleteAmount] = useState({})
  const [newItemName, setNewItemName] = useState("")
  const [activeTab, setActiveTab] = useState("fridge")
  const [detectedItems, setDetectedItems] = useState([])
  const [showDetectedModal, setShowDetectedModal] = useState(false)

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
    const itemToSubmit = newItemName.trim()
    if(!itemToSubmit) return

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
            name: itemToSubmit
          })
        }
      )

      const data = await response.json()

      console.log(data)

      setNewItemName("")
      fetchItems()
      fetchHistory()
    } catch (error) {
      console.error("Add item error:", error)
    }
  }

  const detectItemsFromImage = async () => {
    if(!imageFile) {
      alert("Please select an image first")
      return
    }

    setDetectingItems(true)

    try {
      const formData = new FormData()
      formData.append("file", imageFile)

      const response = await fetch(
        "https://fridge-organiser.onrender.com/detect-items",
        {
          method: "POST",
          body: formData
        }
      )

      console.log("Status:", response.status)
      const data = await response.json()
      console.log(data)

      if (!Array.isArray(data.ingredients)) {
        alert("Failed to detect ingredients")
        return
      }

      const uniqueIngredients = [...new Set(data.ingredients)]

      setDetectedItems(
        uniqueIngredients.map(item => ({
          name: item,
          quantity: 1
        }))
      )
      setShowDetectedModal(true)

      fetchItems()
      fetchHistory()
    }
    catch (error) {
      console.log(error)
      alert("Failed to detect ingredients")
    }
    setDetectingItems(false)
  }

  const addDetectedItems = async () => {
    try {
      const promises = []
      const itemsToAdd = detectedItems.filter(item => Number(item.quantity) > 0)

      for (const item of itemsToAdd) {
        const qty = Number(item.quantity)
        for (let i = 0; i < qty; i++){
          promises.push(
            fetch(
              "https://fridge-organiser.onrender.com/items/add",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  user_id: 1,
                  name: item.name
                })
              }
            )
          )
        }
      }

      await Promise.all(promises)
      setShowDetectedModal(false)
      setDetectedItems([])

      fetchItems()
      fetchHistory()
    } catch (error) {
      console.error(error)
      alert("Failed to add items")
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

  const deleteMultipleItems = async (ids, amount) => {
    try {
      const idsToDelete = ids.slice(0, amount)

      for (const id of idsToDelete) {
        await fetch(
          `https://fridge-organiser.onrender.com/items/${id}`,
          {
            method: "DELETE"
          }
        )
      }
      setExpandedItem(null)
      fetchItems()
    } catch (error) {
      console.error(error)
    }
  }

  const generateRecipes = async () => {
    setLoading(true)
    try {
      const response = await fetch('https://fridge-organiser.onrender.com/recipes', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: items.map(item => item.name) })
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

  const groupedItems = items.reduce((acc, item) => {
    const name = item.name.trim().toLowerCase()

    if (!acc[name]) {
      acc[name] = {
        count: 0,
        ids: [],
        displayName: item.name
      }
    }

    acc[name].count++
    acc[name].ids.push(item.id)

    return acc
  }, {})

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

                <div className="tabs">
                  <button
                    className={activeTab === "fridge" ? "tab active-tab" : "tab"}
                    onClick={() => setActiveTab("fridge")}
                  >Fridge</button>

                  <button 
                    className={activeTab === "recipes" ? "tab active-tab" : "tab"}
                    onClick={() => setActiveTab("recipes")}
                  >Recipes</button>

                  <button 
                    className={activeTab === "shopping" ? "tab active-tab" : "tab"}
                    onClick={() => setActiveTab("shopping")}
                  >Shopping</button>
                  
                </div>

                {activeTab === "fridge" && (
                  <>
                    <form
                      className='add-item-form'
                      onSubmit={(e) => {
                        e.preventDefault();
                        addItems();
                      }}
                    >
                      <input
                        type="text"
                        placeholder='e.g., Milk Eggs, Apples...'
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className='add-item-input'
                      />
                      <button type="submit" className='add'>Add Item</button>
                    </form>

                    <div className='image-upload'>
                      <input
                        type="file"
                        id="fridge-photo-upload"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files[0])}
                        style={{ display: "none" }}
                      />

                      <label htmlFor="fridge-photo-upload" className="file-upload-label">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="32" 
                          height="32" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="#00195f" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          className="upload-icon"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        <span className="upload-text">
                          {imageFile ? ` Selected: ${imageFile.name}` : "Choose a photo of your fridge"}
                        </span>
                      </label>

                      <button
                        onClick={detectItemsFromImage}
                        className='add'
                        disabled={detectingItems}
                      >
                        {detectingItems ? "Scanning Image..." : "Add From Photo"}
                      </button>
                    </div>

                    <div className='items'> 
                      <div className="list-header">Current Stock:</div>
                      <ul>
                        {Object.entries(groupedItems).map(([name, data]) => (
                          <li key={name} className='item-row-wrapper'>
                            <div key={name} className="item-row">

                              <span>
                                {data.displayName}
                                {data.count > 1 && (
                                  <span className="item-count">
                                    x{data.count}
                                  </span>
                                )}
                              </span>

                              <button
                                onClick={() => {
                                  if (data.count === 1) {
                                    deleteItem(data.ids[0])
                                  } else {
                                    setExpandedItem(
                                      expandedItem === name ? null : name
                                    )
                                    setDeleteAmount(prev => ({
                                      ...prev,
                                      [name]: 1
                                    }))
                                  }
                                }}
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
                            </div>
                            
                            {expandedItem === name && (
                              <div className='delete-controls'>

                                <button
                                  onClick={() =>
                                    setDeleteAmount(prev => ({
                                      ...prev,
                                      [name]: Math.max(
                                        1,
                                        (prev[name] || 1) - 1
                                      )
                                    }))
                                  }
                                >-</button>
                                
                                <input 
                                  type="number"
                                  min="1"
                                  max={data.count}
                                  value={deleteAmount[name] || ""}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    setDeleteAmount(prev => ({
                                      ...prev,
                                      [name]: value === "" ? "" : Number(value)
                                    }))
                                  }}
                                />

                                <button
                                  onClick={() => 
                                    setDeleteAmount(prev => ({
                                      ...prev,
                                      [name]: Math.min(
                                        data.count,
                                        (prev[name] || 1) + 1
                                      )
                                    }))
                                  }
                                >+</button>

                                <button
                                  className='confirm-delete'
                                  disabled={
                                    deleteAmount[name] === "" || deleteAmount[name] < 1
                                  }
                                  onClick={() =>
                                    deleteMultipleItems(
                                      data.ids,
                                      deleteAmount[name] || 1
                                    )
                                  }
                                >Delete</button>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {activeTab === "recipes" && (
                  <>

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
                  </>
                )}

                {activeTab === "shopping" && (
                  <>

                    <div className='items'>
                      <div className="list-header">Need to Buy:</div>
                      <ul>
                        {needToBuy.map((item, index) => (
                          <li key={index} className="item-row">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {showDetectedModal && (
                  <div className="modal-overlay">
                    <div className="modal-window">
                      <h2 className='modal-header'>Review or adjust quantities before adding them to your fridge.</h2>
                      <div className='modal-content'>
                        {detectedItems.map((item, index) => (
                          <div 
                            key={index} 
                            className="detected-card"
                            style={{
                                opacity: item.quantity === 0 ? 0.4 : 1,
                                transition: "opacity 0.2s ease",
                                backgroundColor: item.quantity === 0 ? "#f5f5f5" : ""
                              }}
                          >
                            <span className='detected-item-name'>{item.name}</span>

                            <div className="quantity-controls">
                              <button
                                type='button'
                                className='qty-btn'
                                onClick={() => {
                                  const updated = detectedItems.map((curr, idx) => 
                                    idx === index ? { ...curr, quantity: Math.max(0, curr.quantity - 1) } : curr
                                  );
                                  setDetectedItems(updated);
                                }}
                              >-</button>

                              <input
                                type="number"
                                className='qty-input'
                                min="0"
                                value={item.quantity ?? ""}
                                style={{
                                  width: "40px",
                                  textAlign: "center",
                                  border: "1px solid #ccc",
                                  borderRadius: "4px",
                                  margin: "0 5px",
                                }}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const updated = detectedItems.map((curr, idx) =>
                                    idx === index ? { ...curr, quantity: value === "" ? "": Number(value) } : curr
                                  );
                                  setDetectedItems(updated)
                                }}
                              />

                              <button
                                type="button"
                                className='qty-btn'
                                onClick={() => {
                                  const updated = detectedItems.map((curr, idx) => 
                                    idx === index ? { ...curr, quantity: curr.quantity + 1 } : curr
                                  )
                                  setDetectedItems(updated)
                                }}
                              >+</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="modal-footer">
                        <button onClick={() => setShowDetectedModal(false)} className='btn-secondary'>Cancel</button>
                        <button className="btn-primary" onClick={addDetectedItems} disabled={!detectedItems.some(item => item.quantity > 0)}>Add To Fridge</button>
                      </div>
                    </div>
                  </div>
                )}
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