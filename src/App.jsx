import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [items, setItems] = useState(['rice', 'pasta', 'milk'])
  const [standard, setstandard] = useState(['flour', 'sugar', 'salt', 'black pepper', 'olive oil', 'vegetable oil', 'rice', 'pasta', 'eggs', 'milk', 'butter', 'bread', 'garlic', 'onions', 'potatoes', 'canned tomatoes', 'canned beans', 'chicken stock', 'tea', 'coffee', 'oats', 'paprika', 'cumin', 'chili flakes', 'soy sauce', 'honey', 'peanut butter'])
  const [needToBuy, setNeedToBuy] = useState([])
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(false)

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

  const generateRecipes = async () => {

    setLoading(true)

    try {

      const response = await fetch('https://fridge-organiser.onrender.com/recipes', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ingredients: items
        })
    })

    const data = await response.json()

    const aiText = data.content

    try {
      const parsed = JSON.parse(aiText)
      setRecipes(parsed.recipes)
    } catch (error) {
      console.error('Error parsing AI response:', error)
    }


  } catch (error) {
      console.error(error)
  }

  setLoading(false)

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

        <button onClick={generateRecipes} className='add' disabled={loading}>
          {loading ? 'Generating...' : 'Generate Recipes'}
        </button>

        <div className='recipes-container'>
          
            {recipes.map((recipe, index) => (

              <div className='recipe-card' key={index}>

                <h2> {recipe.name}</h2>
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
    </>
  )
}

export default App
