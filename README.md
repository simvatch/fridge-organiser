# Fridge Organiser
---
### Fridge organiser is a project I came up with when thinking about what features I would want to have on my smart fridge. 
---

## Features

### Fridge Inventory Management

Users are able to add items manually or by uploading an image. Using AI image recognition the items are recognised and are added to your stock. Users are able to remove individual or multiple items at once and the system automatically groups duplicate items and tracks current stock levels.

### Recipe Generation

Users are able to generate recipes based on ingredients currently in their fridge. Each recipe includes a name, description, an AI generated image based on the provided description, cooking steps, cook time, number of servings and a list of any missing ingredients.

### Shopping List

The shopping list feature tracks ingredients previously added to the fridge, identifies any that are no longer in stock and builds a shopping list from that information.

### User Settings

Users are able to configure their preferred units for temperature (°C / °F), weight (g / oz / lb) and volume (ml / litres / cups).

### Authentication

The webapp supports user registration and login with JWT authentication, secured via HTTP-only cookies, with protected routes throughout. The login details and user prefrences are stored in a PostegreSQL. This allows each user to have personalised menus and recipes.

---
