# Hierarchical Category System Implementation

This document outlines the steps to implement a hierarchical category system using the Array of Ancestors pattern.

## Overview

The implementation adds the following features:

1. A new `categories` collection with hierarchical structure
2. Migration scripts to populate categories and update existing catalog data
3. API endpoints for category management
4. Efficient querying of products by category path or ID

## Schema Changes

### Category Schema

The new `Category` model uses the Array of Ancestors pattern with these fields:
- `name` (string): Category name
- `ancestors` (array): Array of objects with `_id` and `name`, representing the path to this category
- `parent` (ObjectId or null): Parent category ID (null for root categories)
- `level` (number): Depth in hierarchy (0 = root)
- `tenantId` (ObjectId): The tenant this category belongs to
- `attributes` (object): Optional attributes for UI filtering

### Catalog Schema Changes

The `Catalog` model has been extended with:
- `categoryId`: ObjectId reference to the most specific category
- `categoryPath`: Array of category names (e.g., ["Tools", "Power Tools"])

## Migration Steps

### Step 1: Create Categories

Run the following script to extract distinct category/subcategory combinations and create the hierarchical structure:

```bash
node migrations/populateCategories.js
```

This script will:
1. Find all distinct category/subcategory combinations in the catalogs collection
2. Create root categories (level 0) for each main category
3. Create child categories (level 1) with proper ancestor references

### Step 2: Update Catalog Documents

After creating the category hierarchy, run the following script to update the catalog documents:

```bash
node migrations/updateCatalogCategories.js
```

This script will:
1. Find the appropriate leaf category for each catalog document
2. Update the document with `categoryId` and `categoryPath` fields

## Using the APIs

### Category APIs

- `GET /api/v1/categories` - Get all categories for the current tenant
- `GET /api/v1/categories/:id` - Get a specific category by ID
- `GET /api/v1/categories/:id/children` - Get all child categories of a parent
- `POST /api/v1/categories` - Create a new category
- `PUT /api/v1/categories/:id` - Update a category

### Catalog APIs with Category Support

- `GET /api/v1/catalogs?categoryId=<id>` - Get all products in a specific category and its descendants
- `GET /api/v1/catalogs?categoryPath=Tools,Power%20Tools` - Get all products matching a specific category path

## Examples

### Create a Root Category

```json
POST /api/v1/categories
{
  "name": "Electronics",
  "attributes": {
    "icon": "computer",
    "showInNav": true
  }
}
```

### Create a Child Category

```json
POST /api/v1/categories
{
  "name": "Laptops",
  "parent": "60f5c8a1e4a0e34b3c7d6f5a",
  "attributes": {
    "icon": "laptop",
    "showInNav": true
  }
}
```

### Query Products by Category Path

```
GET /api/v1/catalogs?categoryPath=Electronics,Laptops
```

### Query Products by Category ID (including all subcategories)

```
GET /api/v1/catalogs?categoryId=60f5c8a1e4a0e34b3c7d6f5a
```
