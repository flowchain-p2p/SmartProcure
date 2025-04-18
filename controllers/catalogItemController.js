const CatalogItem = require('../models/CatalogItem');

// Get all catalog items for the current user
const getCatalogItems = async (req, res) => {
  try {
    const catalogItems = await CatalogItem.find({ tenantId: req.tenant.id });
    res.status(200).json(catalogItems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching catalog items', error });
  }
};

// Get a single catalog item by ID
const getCatalogItem = async (req, res) => {
  try {
    const catalogItem = await CatalogItem.findOne({ _id: req.params.id, tenantId: req.tenant.id });
    if (!catalogItem) {
      return res.status(404).json({ message: 'Catalog item not found' });
    }
    res.status(200).json(catalogItem);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching catalog item', error });
  }
};

// Create a new catalog item
const createCatalogItem = async (req, res) => {
  try {
    const { name, price } = req.body;
    const newCatalogItem = new CatalogItem({
      name,
      price,
      tenantId: req.tenant.id
    });
    const savedCatalogItem = await newCatalogItem.save();
    res.status(201).json(savedCatalogItem);
  } catch (error) {
    res.status(500).json({ message: 'Error creating catalog item', error });
  }
};

// Update an existing catalog item
const updateCatalogItem = async (req, res) => {
  try {
    const { name, price } = req.body;
    const updatedCatalogItem = await CatalogItem.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenant.id },
      { name, price },
      { new: true }
    );
    if (!updatedCatalogItem) {
      return res.status(404).json({ message: 'Catalog item not found' });
    }
    res.status(200).json(updatedCatalogItem);
  } catch (error) {
    res.status(500).json({ message: 'Error updating catalog item', error });
  }
};

// Delete a catalog item
const deleteCatalogItem = async (req, res) => {
  try {
    const deletedCatalogItem = await CatalogItem.findOneAndDelete({ _id: req.params.id, tenantId: req.tenant.id });
    if (!deletedCatalogItem) {
      return res.status(404).json({ message: 'Catalog item not found' });
    }
    res.status(200).json({ message: 'Catalog item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting catalog item', error });
  }
};

module.exports = {
  getCatalogItems,
  getCatalogItem,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem
};
