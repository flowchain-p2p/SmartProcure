# UnitOfMeasure API Documentation

This document outlines the API endpoints for the UnitOfMeasure module in the Instatenders multi-tenant application.

## Getting Started

1. Import the `UOM_API.postman_collection.json` file into Postman
2. Set up an environment with the following variables:
   - `baseUrl` (default: http://localhost:5000)
   - `email` (admin user email)
   - `password` (admin user password) 
   - `authToken` (this will be set automatically after login)
   - `uomId` (to be set after creating a unit of measure)

## Authentication

First, use the Login endpoint in the Authentication folder to get a token:

1. Use the `Login (Get Token)` request
2. The token will be automatically saved to the `authToken` environment variable

## Available Endpoints

### GET /api/v1/uom

List all units of measure with pagination and filtering support.

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10) - Number of results per page
- `category` (optional) - Filter by category (e.g., "Weight", "Length")

**Example Response:**
```json
{
  "success": true,
  "count": 2,
  "total": 15,
  "totalPages": 8,
  "currentPage": 1,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "symbol": "kg",
      "name": "Kilogram",
      "category": "Weight",
      "description": "Standard unit of mass in the International System of Units",
      "tenantId": "60d21b1c67d0d8992e610c83",
      "isActive": true,
      "createdAt": "2021-06-22T15:33:10.123Z",
      "updatedAt": "2021-06-22T15:33:10.123Z"
    },
    {
      "_id": "60d21b4667d0d8992e610c86",
      "symbol": "g",
      "name": "Gram",
      "category": "Weight",
      "description": "A metric unit of mass",
      "tenantId": "60d21b1c67d0d8992e610c83",
      "isActive": true,
      "createdAt": "2021-06-22T15:33:10.123Z",
      "updatedAt": "2021-06-22T15:33:10.123Z"
    }
  ]
}
```

### GET /api/v1/uom/:id

Get a single unit of measure by ID.

**Example Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "symbol": "kg",
    "name": "Kilogram",
    "category": "Weight",
    "description": "Standard unit of mass in the International System of Units",
    "tenantId": "60d21b1c67d0d8992e610c83",
    "isActive": true,
    "createdAt": "2021-06-22T15:33:10.123Z",
    "updatedAt": "2021-06-22T15:33:10.123Z"
  }
}
```

### POST /api/v1/uom

Create a new unit of measure.

**Request Body:**
```json
{
  "symbol": "kg",
  "name": "Kilogram",
  "category": "Weight",
  "description": "Standard unit of mass in the International System of Units"
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "symbol": "kg",
    "name": "Kilogram",
    "category": "Weight",
    "description": "Standard unit of mass in the International System of Units",
    "tenantId": "60d21b1c67d0d8992e610c83",
    "isActive": true,
    "createdAt": "2021-06-22T15:33:10.123Z",
    "updatedAt": "2021-06-22T15:33:10.123Z"
  }
}
```

### PUT /api/v1/uom/:id

Update an existing unit of measure.

**Request Body:**
```json
{
  "symbol": "kg",
  "name": "Kilogram",
  "category": "Mass",
  "description": "Updated description for the kilogram unit",
  "isActive": true
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "symbol": "kg",
    "name": "Kilogram",
    "category": "Mass",
    "description": "Updated description for the kilogram unit",
    "tenantId": "60d21b1c67d0d8992e610c83",
    "isActive": true,
    "createdAt": "2021-06-22T15:33:10.123Z",
    "updatedAt": "2021-06-22T15:45:22.456Z"
  }
}
```

### DELETE /api/v1/uom/:id

Delete a unit of measure.

**Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

## Common UnitOfMeasure Categories

Here are some common categories and units you might want to use:

1. **Weight/Mass**
   - kg (Kilogram)
   - g (Gram)
   - mg (Milligram)
   - lb (Pound)
   - oz (Ounce)
   - t (Metric Ton)

2. **Length/Distance**
   - m (Meter)
   - cm (Centimeter)
   - mm (Millimeter)
   - km (Kilometer)
   - in (Inch)
   - ft (Foot)
   - yd (Yard)
   - mi (Mile)

3. **Volume**
   - L (Liter)
   - mL (Milliliter)
   - m³ (Cubic Meter)
   - gal (Gallon)
   - qt (Quart)
   - pt (Pint)
   - fl oz (Fluid Ounce)

4. **Area**
   - m² (Square Meter)
   - cm² (Square Centimeter)
   - km² (Square Kilometer)
   - ha (Hectare)
   - acre (Acre)
   - ft² (Square Foot)

5. **Time**
   - s (Second)
   - min (Minute)
   - h (Hour)
   - d (Day)
   - wk (Week)
   - mo (Month)
   - yr (Year)

6. **Temperature**
   - °C (Celsius)
   - °F (Fahrenheit)
   - K (Kelvin)

7. **Quantity**
   - ea (Each)
   - dz (Dozen)
   - pc (Piece)
   - pr (Pair)
   - set (Set)
   - box (Box)
   - pkg (Package)
