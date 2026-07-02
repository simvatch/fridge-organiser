# Fridge Organiser
---
### Fridge organiser is a project I came up with when thinking about what features I would want to have on my smart fridge. 
---

## Features

### Fridge Inventory Management

Users are able to add items manually or by uploading an image. Using AI image recognition the items are recognised and are added to your stock. Users are able to remove individual or multiple items at once and the system automatically groups duplicate items and tracks current stock levels. Expiry dates are also tracked. Items can be filtered via name, expiry date or date added.

### Recipe Generation

Users are able to generate recipes based on ingredients currently in their fridge. They are able to cusomise what kind of recipes they want based on dietary requirements through settings. Each recipe includes a name, description, an AI generated image based on the provided description, ingredients, cooking steps, cook time, number of servings and a list of any missing ingredients.

## Favourite Recipes

Users are able to favourite recipes they have previously made and store them for future use. They are easily accessible via Saved Recipes button in recipes tab.

### Shopping List

The shopping list feature tracks ingredients previously added to the fridge, identifies any that are no longer in stock and builds a shopping list from that information. User can also manually add items.

### User Settings

Users are able to configure their preferred units for temperature (°C / °F), weight (g / oz / lb) and volume (ml / litres / cups). They are also able to configure any dietary requirements they may have.

### Authentication

The webapp supports user registration and login with JWT authentication, secured via HTTP-only cookies, with protected routes throughout. The login details and user preferences are stored in a PostgreSQL. This allows each user to have personalised menus and recipes.

---
