# Fridge Organiser

Fridge organiser is a project I came up with when thinking about what features I would want to have on my smart fridge. It is an AI powered recipe generator that uses PostgreSQL to manage each individual person's items in order for the AI to come up with recipes individually for each person.

---

## Features

### Fridge Inventory Management

Users can add items manually or by uploading an image using AI image recognition. They can remove individual or multiple items at once and the system automatically groups duplicate items and tracks current stock levels.

### Recipe Generation

Users can generate recipes based on ingredients currently in their fridge. Each recipe includes a name, description, an AI generated image based on the provided description, cooking steps, cook time, number of servings and a list of any missing ingredients.

### Shopping List

The shopping list tracks ingredients previously added to the fridge, identifies any that are no longer in stock and builds a dynamic shopping list from that information.

### User Settings

Users can configure their preferred units for temperature (°C / °F), weight (g / oz / lb) and volume (ml / litres / cups).

### Authentication

The webapp supports user registration and login with JWT authentication, secured via HTTP-only cookies, with protected routes throughout.

---