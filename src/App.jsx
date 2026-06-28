import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './Login'
import Signup from './Signup'
import Settings from './Settings'
import { convertStepText } from './conversions'
import './App.css'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null)

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
  const [recipesLoading, setRecipesLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState(null)
  const [cookedRecipe, setCookedRecipe] = useState(null)
  const [cookedIngredients, setCookedIngredients] = useState([])
  const [shoppingList, setShoppingList] = useState([])
  const [newShoppingItem, setNewShoppingItem] = useState("")
  const [dismissedAutoItems, setDismissedAutoItems] = useState([])
  const [confirmDeleteAuto, setConfirmDeleteAuto] = useState(null)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [newShoppingQty, setNewShoppingQty] = useState(1)
  const [expandedShoppingItem, setExpandedShoppingItem] = useState(null)
  const [deleteShoppingAmount, setDeleteShoppingAmount] = useState({})
  const [newItemExpiry, setNewItemExpiry] = useState("")
  const [addingItems, setAddingItems] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    checkItems()
  }, [items])

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings()
    }
  }, [isAuthenticated])

  useEffect (() => {
    if (isAuthenticated && items.length > 0 && !recipesLoading && recipes.length === 0) {
      generateRecipes()
    }
  }, [items, isAuthenticated])

  const checkAuth = async () => {
    try {
      const response = await fetch(
        "https://fridge-organiser.onrender.com/auth/me",
        {
          credentials: "include"
        }
      )

      if (response.ok) {
        setIsAuthenticated(true)
        fetchItems()
        fetchHistory()
        fetchSettings()
        fetchDismissed()
        fetchShoppingList()
      } else {
        setIsAuthenticated(false)
      }
    } catch {
      setIsAuthenticated(false)
    }
  }

  const fetchItems = async () => {
    try {
      const response = await fetch(
        "https://fridge-organiser.onrender.com/items/",
        {
          credentials: "include"
        }
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
        "https://fridge-organiser.onrender.com/items/history",
        {
          credentials: "include"
        }
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
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: itemToSubmit,
            expires_at: newItemExpiry || null
          })
        }
      )

      const data = await response.json()

      console.log(data)

      setNewItemName("")
      setNewItemExpiry("")
      fetchItems()
      fetchHistory()
    } catch (error) {
      console.error("Add item error:", error)
    }
  }

  const getExpiryBadge = (expiresAt) => {
    if (!expiresAt) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [year, month, day] = expiresAt.split("-").map(Number)
    const expiry = new Date(year, month -1, day)
    const diffDays = Math.round((expiry - today) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return <span className="expiry-badge expired">❌ Expired</span>
    if (diffDays === 0) return <span className="expiry-badge expiring-soon">⚠️ Today</span>
    if (diffDays <= 3) return <span className="expiry-badge expiring-soon">⚠️ {diffDays}d</span>
    return null
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
          credentials: "include",
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
        uniqueIngredients.sort((a, b) => a.localeCompare(b)).map(item => ({
          name: item,
          quantity: 1,
          expires_at: ""
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
    setAddingItems(true)

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
                credentials: "include",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  name: item.name,
                  expires_at: item.expires_at || null
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
    setAddingItems(false)
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
          method: "DELETE",
          credentials: "include",
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
            method: "DELETE",
            credentials: "include"
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
    setRecipesLoading(true)
    try {
      const response = await fetch('https://fridge-organiser.onrender.com/recipes', {
        method: 'POST',
        credentials: "include",
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

      const recipeList = parsed.recipes || []
      setRecipes(recipeList)
      preloadImages(recipeList)

    } catch (error) {
      console.error('Error parsing AI response:', error)
      alert("Recipe generation failed")
    }
  
    setRecipesLoading(false)
  }

  const generateImage = async (recipe, index) => {
    setImageLoading(prev => ({ ...prev, [index]: true }))
    try {
      const res = await fetch('https://fridge-organiser.onrender.com/image', {
        method: 'POST',
        credentials: "include",
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

  const preloadImages = async (recipeList) => {

    const batchSize = 2

    for (let start = 0; start < recipeList.length; start += batchSize) {
      const batch = recipeList.slice(start, start + batchSize)
      await Promise.all(
        batch.map(async (recipe, offset) => {
          const i = start + offset
          try {
            const res = await fetch(
              "https://fridge-organiser.onrender.com/image",
              {
                method: "POST",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  prompt: recipe.imagePrompt
                })
              }
            )

            const data = await res.json()

            const imageUrl = data?.image || null

            if (imageUrl) {
              setImages(prev => ({
                ...prev,
                [i]: imageUrl
              }))
            }
          } catch (err) {
            console.error(err)
          }
        })
      )
    }
  }

  const openCookedModal = (recipe) => {
    const matched = recipe.ingredients.map(ing => {
      const fridgeMatch = Object.entries(groupedItems).find(([name]) =>
        name.includes(ing.name.toLowerCase()) || ing.name.toLowerCase().includes(name) 
      )

      return {
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        checked: !!fridgeMatch,
        inFridge: !!fridgeMatch,
        available: fridgeMatch ? fridgeMatch[1].count : 0,
        ids: fridgeMatch ? fridgeMatch[1].ids : [],
        removeCount: fridgeMatch ? Math.min(ing.quantity, fridgeMatch[1].count) : 0
      }
    })
    
    setCookedRecipe(recipe)
    setCookedIngredients(matched)
  }

  const confirmCooked = async () => {
    const toRemove = cookedIngredients.filter(ing => ing.checked && ing.inFridge && ing.removeCount > 0)
    for (const ing of toRemove) {
      await deleteMultipleItems(ing.ids, ing.removeCount)
    }
    setCookedRecipe(null)
    setCookedIngredients([])
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch(
        "https://fridge-organiser.onrender.com/settings",
        {
          credentials: "include"
        }
      )

      if (!res.ok) throw new Error("Failed to fetch settings")

      const data = await res.json()
      setSettings(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchShoppingList = async () => {
    try {
      const res = await fetch(
        "https://fridge-organiser.onrender.com/shopping/", 
        {
          credentials: "include"
        }
      )

      const data = await res.json()
      setShoppingList(data.items || [])
    } catch (error) {
      console.error("Shopping fetch error:", error)
    }
  }

  const addShoppingItem = async () => {
    const name = newShoppingItem.trim()
    
    if (!name) return
    try {
      for (let i = 0; i < newShoppingQty; i++) {
        await fetch(
          "https://fridge-organiser.onrender.com/shopping/add",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ name })
          }
        )
      }

      setNewShoppingItem("")
      setNewShoppingQty(1)
      fetchShoppingList()
    } catch (error) {
      console.error("Shopping add error:", error)
    }
  }

  const deleteShoppingItem = async (id) => {
    try {
      await fetch(
        `https://fridge-organiser.onrender.com/shopping/${id}`, 
        {
          method: "DELETE",
          credentials: "include"
        }
      )
      fetchShoppingList()
    } catch (error) {
      console.error("Shopping delete error:", error)
    }
  }

  const confirmAutoDelete = async () => {
    if (dontShowAgain) {
      try {
        await fetch(
          `https://fridge-organiser.onrender.com/items/history/${encodeURIComponent(confirmDeleteAuto)}`,
          {
            method: "DELETE",
            credentials: "include"
          }
        )

        fetchHistory()
        setDismissedAutoItems(prev => [...prev, confirmDeleteAuto])
      } catch (error) {
        console.error("History delete error:", error)
      }
    } else {
      try {
        await fetch(
          "https://fridge-organiser.onrender.com/items/dismissed",
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: confirmDeleteAuto })
          }
        )
        fetchDismissed()
      } catch (error) {
        console.error("Dismiss error:", error)
      }
    }
    setConfirmDeleteAuto(null)
    setDontShowAgain(false)
  }

  const fetchDismissed = async () => {
    try {
      const res = await fetch(
        "https://fridge-organiser.onrender.com/items/dismissed",
        {
          credentials: "include"
        }
      )
      const data = await res.json()
      setDismissedAutoItems(data.dismissed || [])
    } catch (error) {
      console.error("Fetched dismissed error:", error)
    }
  }

  const loginUser = () => {
    setIsAuthenticated(true)
    fetchItems()
    fetchHistory()
    fetchDismissed()
    fetchShoppingList()
  }

  const logoutUser = async () => {
    await fetch(
      "https://fridge-organiser.onrender.com/auth/logout",
      {
        method: "POST",
        credentials: "include"
      }
    )
    setIsAuthenticated(false)
  }

  const groupedItems = items.reduce((acc, item) => {
    const name = item.name.trim().toLowerCase()

    if (!acc[name]) {
      acc[name] = {
        count: 0,
        ids: [],
        displayName: item.name,
        expires_at: item.expires_at
      }
    } else if (!acc[name].expires_at && item.expires_at) {
      acc[name].expires_at = item.expires_at
    }

    acc[name].count++
    acc[name].ids.push(item.id)

    return acc
  }, {})

  if (isAuthenticated === null) {
    return <div>Loading...</div>
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

                <div className='top-bar'>

                  <button 
                      className='settings-btn'
                      onClick={() => setShowSettings(true)}
                      aria-label='Settings'
                    >
                      <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                  </button>

                  <button onClick={logoutUser} className='logout-btn'>
                    Logout
                  </button>
                </div>

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
                        placeholder='e.g., Milk, Eggs, Apples...'
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className='add-item-input'
                      />
                      <input
                        type="date"
                        value={newItemExpiry}
                        onChange={(e) => setNewItemExpiry(e.target.value)}
                        className='expiry-input'
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
                        {Object.entries(groupedItems).sort(([, a], [, b]) => a.displayName.localeCompare(b.displayName)).map(([name, data]) => (
                          <li key={name} className='item-row-wrapper'>
                            <div key={name} className="item-row">

                              <span>
                                {data.displayName}
                                {data.count > 1 && (
                                  <span className="item-count">
                                    x{data.count}
                                  </span>
                                )}
                                {getExpiryBadge(data.expires_at)}
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
                    <button
                      onClick={generateRecipes}
                      className="add"
                      disabled={recipesLoading}
                    >
                      {recipesLoading
                        ? "Generating New Recipes..."
                        : "Generate New Recipes"}
                    </button>

                    {recipesLoading && recipes.length === 0 ? (
                      <div className='recipes-loading-container'>
                        <div className='loading-spinner'></div>
                        <p>Preparing recipes...</p>
                      </div>
                    ) : (
                      <div className="recipes-container">
                        {recipes.map((recipe, index) => (
                          <div className="recipe-card" key={index}>
                            <h2>{recipe.name}</h2>

                            <div className="image-container">
                              {images[index] ? (
                                <img src={images[index]} alt={recipe.name} />
                              ) : (
                                <div className='image-placeholder'>
                                  <span>Generating preview...</span>
                                </div>
                              )}
                            </div>

                            <p>{recipe.description}</p>

                            <div className="recipe-meta">
                              <span>
                                👪 Serves: {recipe.servings || "Not specified"}
                              </span>
                            </div>

                            <div className="section">
                              <h3>🍽️ Steps</h3>
                              <ol>
                                {(recipe.steps || []).map((step, stepIndex) => (
                                  <li key={stepIndex}>{convertStepText(step, settings)}</li>
                                ))}
                              </ol>
                            </div>

                            <button className='add' onClick={() => openCookedModal(recipe)}>Mark as Cooked</button>

                            {(recipe.missingIngredients || []).length > 0 && (
                              <div className="section">
                                <h3>🛒 Missing Ingredients</h3>
                                <ul>
                                  {recipe.missingIngredients.map((ingredient, i) => {
                                    const label = typeof ingredient === "string"
                                    ? ingredient
                                    : ingredient.name || ingredient.ingredient || JSON.stringify(ingredient)
                                    return (
                                      <li key={i}>
                                        {label.charAt(0).toUpperCase() + label.slice(1)}
                                      </li>
                                    )
                                  })}
                                </ul>
                              </div>
                            )}

                            <div className="cook-time">
                              <span>
                                ⏲️ Cook Time: {recipe.cookTime || "Not specified"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeTab === "shopping" && (
                  <>
                    <form
                      className="add-item-form"
                      onSubmit={(e) => { e.preventDefault(); addShoppingItem() }}
                    >
                      <input
                        type="text"
                        placeholder="e.g., Bread, Butter..."
                        value={newShoppingItem}
                        onChange={(e) => setNewShoppingItem(e.target.value)}
                        className="add-item-input"
                      />
                      <button type="submit" className="add">Add</button>
                    </form>

                    <div className="items">
                      <div className="list-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Shopping List:</span>
                        
                          {dismissedAutoItems.length > 0 && (
                            <button
                              onClick={async () => {
                                await fetch(
                                  "https://fridge-organiser.onrender.com/items/dismissed",
                                  {
                                    method: "DELETE",
                                    credentials: "include"
                                  }
                                )
                                setDismissedAutoItems([])}}
                                className='reset-btn'>Reset Shopping List</button>
                          )}  
                      </div>
                      {(() => {
                        const groupedShopping = shoppingList.reduce((acc, item) => {
                          const key = item.name.trim().toLowerCase()
                          if (!acc[key]) acc[key] = { count: 0, ids: [], displayName: item.name }
                          acc[key].count++
                          acc[key].ids.push(item.id)
                          return acc
                        }, {})

                        const manualItems = Object.entries(groupedShopping).map(([key, data]) => ({
                          name: key,
                          displayName: data.displayName,
                          count: data.count,
                          ids: data.ids,
                          manual: true
                        }))

                        const autoItems = needToBuy
                          .filter(name =>
                            !Object.keys(groupedShopping).includes(name.toLowerCase()) &&
                            !dismissedAutoItems.includes(name)
                          )
                          .map(name => ({ name, displayName: name, count: 1, ids: [], manual: false }))

                        return [...manualItems, ...autoItems]
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((item, index) => (
                            <li key={index} className="item-row-wrapper">
                              <div className="item-row">
                                <span>
                                  {item.displayName.charAt(0).toUpperCase() + item.displayName.slice(1)}
                                  {item.count > 1 && <span className="item-count">x{item.count}</span>}
                                  {!item.manual && <span className="auto-badge">auto</span>}
                                </span>
                                <button
                                  className="delete-btn"
                                  onClick={() => {
                                    if (item.manual) {
                                      if (item.count === 1) {
                                        deleteShoppingItem(item.ids[0])
                                      } else {
                                        setExpandedShoppingItem(expandedShoppingItem === item.name ? null : item.name)
                                        setDeleteShoppingAmount(prev => ({ ...prev, [item.name]: 1 }))
                                      }
                                    } else {
                                      setConfirmDeleteAuto(item.name)
                                      setDontShowAgain(false)
                                    }
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d9534f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                  </svg>
                                </button>
                              </div>

                              {item.manual && expandedShoppingItem === item.name && (
                                <div className="delete-controls">
                                  <button onClick={() => setDeleteShoppingAmount(prev => ({ ...prev, [item.name]: Math.max(1, (prev[item.name] || 1) - 1) }))}>-</button>
                                  <input
                                    type="number"
                                    min="1"
                                    max={item.count}
                                    value={deleteShoppingAmount[item.name] || ""}
                                    onChange={(e) => {
                                      const value = e.target.value
                                      setDeleteShoppingAmount(prev => ({ ...prev, [item.name]: value === "" ? "" : Number(value) }))
                                    }}
                                  />
                                  <button onClick={() => setDeleteShoppingAmount(prev => ({ ...prev, [item.name]: Math.min(item.count, (prev[item.name] || 1) + 1) }))}>+</button>
                                  <button
                                    className="confirm-delete"
                                    disabled={deleteShoppingAmount[item.name] === "" || deleteShoppingAmount[item.name] < 1}
                                    onClick={async () => {
                                      const idsToDelete = item.ids.slice(0, deleteShoppingAmount[item.name] || 1)
                                      for (const id of idsToDelete) {
                                        await fetch(`https://fridge-organiser.onrender.com/shopping/${id}`, { method: "DELETE", credentials: "include" })
                                      }
                                      setExpandedShoppingItem(null)
                                      fetchShoppingList()
                                    }}
                                  >Delete</button>
                                </div>
                              )}

                              {confirmDeleteAuto === item.name && (
                                <div className="auto-delete-panel">
                                  <span className="auto-delete-title">Remove from list?</span>
                                  <label className="auto-delete-checkbox-label">
                                    <input type="checkbox" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} />
                                    Don't show this item again
                                  </label>
                                  <div className="auto-delete-actions">
                                    <button className="auto-delete-btn-confirm" onClick={confirmAutoDelete}>Confirm</button>
                                    <button className="auto-delete-btn-cancel" onClick={() => { setConfirmDeleteAuto(null); setDontShowAgain(false) }}>Cancel</button>
                                  </div>
                                </div>
                              )}
                            </li>
                          ))
                      })()}
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
                              backgroundColor: item.quantity === 0 ? "#f5f5f5" : "",
                              flexDirection: "column",
                              alignItems: "stretch",
                              gap: "8px"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span className='detected-item-name'>{item.name}</span>
                              <div className="quantity-controls">
                                <button
                                  type='button'
                                  className='qty-btn'
                                  onClick={() => {
                                    const updated = detectedItems.map((curr, idx) =>
                                      idx === index ? { ...curr, quantity: Math.max(0, curr.quantity - 1) } : curr
                                    )
                                    setDetectedItems(updated)
                                  }}
                                >-</button>
                                <input
                                  type="number"
                                  className='qty-input'
                                  min="0"
                                  value={item.quantity ?? ""}
                                  style={{ width: "40px", textAlign: "center", border: "1px solid #ccc", borderRadius: "4px", margin: "0 5px" }}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    const updated = detectedItems.map((curr, idx) =>
                                      idx === index ? { ...curr, quantity: value === "" ? "" : Number(value) } : curr
                                    )
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

                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <label style={{ fontSize: "0.8rem", color: "#666", whiteSpace: "nowrap" }}>Expiry:</label>
                              <input
                                type="date"
                                className="expiry-input"
                                value={item.expires_at || ""}
                                style={{ flex: 1, fontSize: "0.8rem" }}
                                onChange={(e) => {
                                  const updated = detectedItems.map((curr, idx) =>
                                    idx === index ? { ...curr, expires_at: e.target.value } : curr
                                  )
                                  setDetectedItems(updated)
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="modal-footer">
                        <button onClick={() => setShowDetectedModal(false)} className='btn-secondary'>Cancel</button>
                        <button
                          className="btn-primary"
                          onClick={addDetectedItems}
                          disabled={!detectedItems.some(item => item.quantity > 0) || addingItems}
                        >
                          {addingItems ? "Adding..." : "Add To Fridge"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {cookedRecipe && (
                  <div className="modal-overlay">
                    <div className="modal-window">
                      <h2 className="modal-header">Which ingredients did you use from your fridge?</h2>
                      <div className="modal-content">
                        {cookedIngredients.map((ing, index) => (
                          <div
                            key={index}
                            className="detected-card"
                            style={{
                              opacity: !ing.inFridge ? 0.4 : 1,
                              transition: "opacity 0.2s ease",
                              backgroundColor: !ing.inFridge ? "#f5f5f5" : ""
                            }}
                          >
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                              <input
                                type="checkbox"
                                checked={ing.checked}
                                disabled={!ing.inFridge}
                                onChange={(e) => {
                                  const updated = cookedIngredients.map((curr, idx) =>
                                    idx === index ? { ...curr, checked: e.target.checked } : curr
                                  )
                                  setCookedIngredients(updated)
                                }}
                              />
                              <span className="detected-item-name">
                                {ing.name}
                                {!ing.inFridge && <span style={{ fontSize: "0.75rem", color: "#999", marginLeft: "6px" }}>not in fridge</span>}
                              </span>
                            </label>

                            {ing.inFridge && ing.checked && (
                              <div className="quantity-controls">
                                <button
                                  type="button"
                                  className="qty-btn"
                                  onClick={() => {
                                    const updated = cookedIngredients.map((curr, idx) =>
                                      idx === index ? { ...curr, removeCount: Math.max(0, curr.removeCount - 1) } : curr
                                    )
                                    setCookedIngredients(updated)
                                  }}
                                >-</button>
                                <input
                                  type="number"
                                  className="qty-input"
                                  min="0"
                                  max={ing.available}
                                  value={ing.removeCount}
                                  style={{ width: "40px", textAlign: "center", border: "1px solid #ccc", borderRadius: "4px", margin: "0 5px" }}
                                  onChange={(e) => {
                                    const val = e.target.value === "" ? "" : Math.min(Number(e.target.value), ing.available)
                                    const updated = cookedIngredients.map((curr, idx) =>
                                      idx === index ? { ...curr, removeCount: val } : curr
                                    )
                                    setCookedIngredients(updated)
                                  }}
                                />
                                <button
                                  type="button"
                                  className="qty-btn"
                                  onClick={() => {
                                    const updated = cookedIngredients.map((curr, idx) =>
                                      idx === index ? { ...curr, removeCount: Math.min(ing.available, curr.removeCount + 1) } : curr
                                    )
                                    setCookedIngredients(updated)
                                  }}
                                >+</button>
                                <span style={{ fontSize: "0.8rem", color: "#666", marginLeft: "4px" }}>
                                  / {ing.available} in fridge
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="modal-footer">
                        <button className="btn-secondary" onClick={() => setCookedRecipe(null)}>Cancel</button>
                        <button
                          className="btn-primary"
                          onClick={confirmCooked}
                          disabled={!cookedIngredients.some(ing => ing.checked && ing.inFridge && ing.removeCount > 0)}
                        >Remove from Fridge</button>
                      </div>
                    </div>
                  </div>
                )}

                <Settings
                  isOpen={showSettings}
                  onClose={() => setShowSettings(false)}
                  settings={settings}
                  setSettings={setSettings}
                />
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