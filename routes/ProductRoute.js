const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // For handling JWTs
const Product = require('../models/Products');

// Middleware to verify JWT and extract vendor ID
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization'); // Get the token from the 'Authorization' header

  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied' });
  }

  const tokenString = token.split(' ')[1]; // Extract the token without 'Bearer '
  try {
    console.log(tokenString);
    const decoded = jwt.verify(tokenString, 'AbdcshNA846Sjdfg'); // Replace with your secret key
    console.log(decoded + "decode obj");
    req.vendorId = decoded.id; // Extract vendor ID from JWT payload
    console.log(req.vendorId);
    next();
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Invalid token' });
  }
};

router.get('/vendorproducts', verifyToken, async (req, res) => {
  try {
    // Use Mongoose to query the products collection for the specific vendor
    const products = await Product.find({ vendor: req.vendorId });

    // Send the list of products for the vendor as a JSON response
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/list', async (req, res) => {
  try {
    // Use Mongoose to query the products collection
    const products = await Product.find();

    // Send the list of products as a JSON response
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.post('/add', verifyToken, async (req, res) => {
  try {
    const { name, description, category, subcategory, image } = req.body;
    const vendorId = req.vendorId; // Extracted from JWT
  

    // Create a new product associated with the vendor
    const product = new Product({
      vendor: vendorId,
      name,
      description,
      category,
      subcategory,
      image,
    });

    // Save the product to the database
    const savedProduct = await product.save();

    res.json(savedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Route to delete a product
router.delete('/delete/:productId', verifyToken, async (req, res) => {
  try {
    const vendorId = req.vendorId; // Extracted from JWT
    const productId = req.params.productId;

    // Check if the product with the given ID exists and belongs to the vendor
    const product = await Product.findOne({ _id: productId, vendor: vendorId });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete the product using the deleteOne method
    await Product.deleteOne({ _id: productId, vendor: vendorId });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Route to modify a product
router.put('/modify/:productId', verifyToken, async (req, res) => {
  try {
      const vendorId = req.vendorId; // Extracted from JWT
      const productId = req.params.productId;
      const updatedProductData = req.body; // Updated product information

      // Check if the product with the given ID exists and belongs to the vendor
      const product = await Product.findOne({ _id: productId, vendor: vendorId });

      if (!product) {
          return res.status(404).json({ error: 'Product not found' });
      }

      // Update the product's information
      // You can loop through the updatedProductData object to update all fields
      for (const key in updatedProductData) {
          if (Object.hasOwnProperty.call(updatedProductData, key)) {
              product[key] = updatedProductData[key];
          }
      }

      // Save the updated product
      await product.save();

      res.json({ message: 'Product updated successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
