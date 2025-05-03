# Postman Collections for the Hierarchical Category System

This document provides comprehensive instructions on how to use the Postman collections for testing the Category and Catalog APIs.

## Setup Environment Variables

Before using the collections, set up the following environment variables in Postman:

1. `baseUrl`: Your API base URL (e.g., `http://localhost:5000`)
2. `email`: Admin user email for authentication
3. `password`: Admin user password for authentication
4. `authToken`: This will be populated automatically after login

## Category API Collection

The Category API collection includes the following requests:

### Authentication

1. **Login (Get Token)**: Authenticate and get a JWT token that will be stored in the `authToken` environment variable.

### Categories

1. **Get All Categories**: Retrieve all categories for the current tenant.
   - Endpoint: `GET /api/v1/categories`
   - Response: Array of categories with hierarchy information

2. **Get Category by ID**: Get a specific category by its ID.
   - Endpoint: `GET /api/v1/categories/:id`
   - Note: The ID must be a valid MongoDB ObjectId

3. **Get Child Categories**: Get all child categories for a specific parent category.
   - Endpoint: `GET /api/v1/categories/:id/children`
   - Response: All direct child categories of the specified parent

4. **Create Root Category**: Create a new root-level category (level 0).
   - Endpoint: `POST /api/v1/categories`
   - Body:
     ```json
     {
       "name": "Electronics",
       "attributes": {
         "icon": "computer",
         "showInNav": true
       }
     }
     ```

5. **Create Child Category**: Create a new child category with a parent reference.
   - Endpoint: `POST /api/v1/categories`
   - Body:
     ```json
     {
       "name": "Laptops",
       "parent": "{{rootCategoryId}}",
       "attributes": {
         "icon": "laptop",
         "showInNav": true
       }
     }
     ```

6. **Update Category**: Update an existing category.
   - Endpoint: `PUT /api/v1/categories/:id`
   - Body:
     ```json
     {
       "name": "Updated Category Name",
       "attributes": {
         "icon": "updated-icon",
         "showInNav": false
       }
     }
     ```

## Catalog API Collection

The Catalog API collection includes the following requests:

### Authentication

1. **Login (Get Token)**: Authenticate and get a JWT token.
   - Endpoint: `POST /api/v1/auth/login`
   - Body: `{ "email": "{{email}}", "password": "{{password}}" }`

### Product Catalog

1. **Get Products By Category ID**: Get all products under a specific category (including all descendants).
   - Endpoint: `GET /api/v1/catalogs?categoryId={{categoryId}}`
   - This query uses the Array of Ancestors pattern to find all products in the specified category AND all its subcategories

2. **Get Products By Category Path**: Get all products under a specific category path.
   - Endpoint: `GET /api/v1/catalogs?categoryPath=Electronics,Laptops`
   - This query finds products with an exact category path match

3. **Get All Products**: Get all products with optional filters.
   - Endpoint: `GET /api/v1/catalogs`
   - Optional query parameters:
     - `brand`: Filter by brand name
     - `inStock`: Filter by availability (true/false)
     - `isPopular`: Filter by popularity (true/false)
     - `page`: Page number for pagination
     - `limit`: Items per page

4. **Get Product by ID**: Get a specific product by ID.
   - Endpoint: `GET /api/v1/catalogs/:id`
   
5. **Create Product**: Create a new product with category references.
   - Endpoint: `POST /api/v1/catalogs`
   - Body includes both old and new category references:
     ```json
     {
       "brand": "PowerTech",
       "name": "Cordless Drill",
       "category": "Tools",
       "subCategory": "Power Tools",
       "categoryId": "{{categoryId}}",
       "categoryPath": ["Tools", "Power Tools"],
       "price": 129.99,
       "mrp": 149.99,
       "discount": 13.33,
       "inStock": true,
       "stockQuantity": 50,
       "description": "Professional grade cordless drill",
       "shortDescription": "18V Cordless Drill",
       "isPopular": true,
       "ratings": {
         "average": 4.5,
         "count": 28
       },
       "images": ["drill1.jpg", "drill2.jpg"],
       "thumbnailUrl": "drill-thumb.jpg",
       "specifications": {
         "Power": "18V",
         "Chuck Size": "1/2 inch",
         "Motor Type": "Brushless"
       },
       "partNumber": "PT-CD-1000",
       "sku": "PT1000",
       "tags": ["drill", "power tools", "cordless"]
     }
     ```

## Usage Flow

For testing the hierarchical category system, follow this recommended sequence:

### 1. Authentication
1. **Login (Get Token)**:
   - Send a POST request to `/api/v1/auth/login` with your credentials
   - The response token will be automatically saved to the `authToken` environment variable

### 2. Create Category Hierarchy
1. **Create Root Category**:
   - Send a POST request to `/api/v1/categories` with a root category (e.g., "Electronics")
   - The new category ID will be saved to `rootCategoryId`

2. **Create First Child Category**:
   - Send a POST request to `/api/v1/categories` with a child category and parent reference
   - Example: "Laptops" with parent ID of the "Electronics" category
   - The ID will be saved to `childCategoryId`

3. **Create More Child Categories**:
   - Create additional child categories under the same parent
   - Example: "Smartphones", "Tablets" under "Electronics"

4. **Create Deeper Hierarchy** (optional):
   - Create third-level categories for deeper hierarchy
   - Example: "Gaming Laptops" as a child of "Laptops"

### 3. Test Category API Functions
1. **Get All Categories**:
   - Retrieve the full category hierarchy for your tenant
   - Verify the proper parent-child relationships and ancestor arrays

2. **Get Category by ID**:
   - Fetch a specific category using its ID
   - Verify all category fields including ancestors, level, etc.

3. **Get Child Categories**:
   - Fetch all children of a specific category
   - Verify that only direct children are returned

4. **Update Category**:
   - Modify a category's name or attributes
   - Verify the changes are saved correctly

### 4. Test Catalog API with Category Support
1. **Create Products with Category References**:
   - Create products with both traditional fields (category/subCategory)
   - Include the new hierarchical fields (categoryId/categoryPath)

2. **Query Products by Category ID**:
   - Test retrieving all products under a specific category
   - Verify that products in subcategories are included in the results

3. **Query Products by Category Path**:
   - Test retrieving products matching a specific category path
   - Example: all products with categoryPath=["Electronics", "Laptops"]

4. **Test Standard Filters**:
   - Combine category filters with other filters (brand, inStock, etc.)
   - Test pagination with category filters

## Handling Variables

The collections use Postman's test scripts to automatically set environment variables:

- `authToken`: Set after successful login
- `categoryId`: Set after retrieving a category
- `rootCategoryId`: Set after creating a root category
- `childCategoryId`: Set after creating a child category
- `catalogId`: Set after creating a product

These variables are then used in subsequent requests to reference the created resources.

## Running Migration Scripts

The hierarchical category system requires two migration scripts to be run in sequence:

### 1. Populate Categories

First, run the script to create categories based on existing catalog data:

```powershell
node migrations/populateCategories.js
```

This script:
- Extracts all distinct combinations of `tenantId`, `category`, and `subCategory` from the catalogs collection
- Creates a two-level hierarchy (root categories and subcategories)
- Sets up the proper parent-child relationships and ancestor arrays
- Preserves tenant isolation (categories are tenant-specific)

### 2. Update Catalog Documents

Next, run the script to update the catalog documents with the new category references:

```powershell
node migrations/updateCatalogCategories.js
```

This script:
- Finds the appropriate leaf category for each catalog document
- Updates each document with `categoryId` (reference to the category) 
- Populates the `categoryPath` array with category names
- Preserves the original `category` and `subCategory` fields for backward compatibility

## Testing Migration Results

After running the migration scripts, you can use these collections to verify:

1. **Category Structure**:
   - Use "Get All Categories" to verify that categories were created correctly
   - Check the proper nesting, ancestors arrays, and level values

2. **Catalog Updates**:
   - Use "Get All Products" to verify that catalog items have the correct `categoryId` and `categoryPath`
   - Compare the values to the original `category` and `subCategory` fields

3. **Query Performance**:
   - Test queries by category ID to ensure they return all products in a category and its subcategories
   - Test queries by category path to ensure they return only products with an exact path match

4. **Edge Cases**:
   - Test with missing categories
   - Test with invalid category IDs
   - Test with empty category paths

## MongoDB Schema Design and Indexing

### Category Schema

```javascript
{
  name: String,                  // Category name
  ancestors: [{                  // Array of ancestors from root to parent
    _id: ObjectId,               // Reference to ancestor category
    name: String                 // Name of ancestor category
  }],
  parent: ObjectId or null,      // Reference to parent category (null for root)
  level: Number,                 // Depth in hierarchy (0 = root)
  tenantId: ObjectId,            // Reference to tenant
  attributes: Object,            // Optional attributes for UI/filtering
  createdAt: Date,
  updatedAt: Date
}
```

### Catalog Schema (with new fields)

```javascript
{
  // Existing fields
  brand: String,
  category: String,              // Original field (kept for backward compatibility)
  subCategory: String,           // Original field (kept for backward compatibility)
  
  // New fields
  categoryId: ObjectId,          // Reference to the most specific category
  categoryPath: [String],        // Array of names, e.g., ["Tools", "Power Tools"]
  
  // Other existing fields...
}
```

### Optimal Indexes

These indexes are set up automatically in the schema files for optimal query performance:

#### Categories Collection
```javascript
// Find categories by tenant and name
{ tenantId: 1, name: 1 }

// Find child categories
{ parent: 1 }

// Find categories by ancestor ID
{ 'ancestors._id': 1 }

// Find categories by ancestor name
{ 'ancestors.name': 1 }
```

#### Catalogs Collection
```javascript
// Find products by tenant and category
{ tenantId: 1, categoryId: 1 }

// Find products by tenant and category path
{ tenantId: 1, categoryPath: 1 }
```
