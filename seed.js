const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/markethub');

    const sampleProducts = [
      {
        name: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 2999,
        category: 'Electronics',
        stock: 50,
        image: 'https://via.placeholder.com/300x300?text=Headphones',
        vendorId: new mongoose.Types.ObjectId(), // Dummy vendor ID
        isActive: true,
      },
      {
        name: 'Smart Watch',
        description: 'Fitness tracking smart watch with heart rate monitor',
        price: 4999,
        category: 'Electronics',
        stock: 30,
        image: 'https://via.placeholder.com/300x300?text=Smart+Watch',
        vendorId: new mongoose.Types.ObjectId(), // Dummy vendor ID
        isActive: true,
      },
      {
        name: 'Coffee Maker',
        description: 'Automatic coffee maker with programmable timer',
        price: 1999,
        category: 'Appliances',
        stock: 20,
        image: 'https://via.placeholder.com/300x300?text=Coffee+Maker',
        vendorId: new mongoose.Types.ObjectId(), // Dummy vendor ID
        isActive: true,
      },
      {
        name: 'Running Shoes',
        description: 'Comfortable running shoes for all terrains',
        price: 1499,
        category: 'Sports',
        stock: 100,
        image: 'https://via.placeholder.com/300x300?text=Running+Shoes',
        vendorId: new mongoose.Types.ObjectId(), // Dummy vendor ID
        isActive: true,
      },
      {
        name: 'Laptop Backpack',
        description: 'Water-resistant backpack for laptops up to 15 inches',
        price: 799,
        category: 'Accessories',
        stock: 75,
        image: 'https://via.placeholder.com/300x300?text=Backpack',
        vendorId: new mongoose.Types.ObjectId(), // Dummy vendor ID
        isActive: true,
      },
    ];

    await Product.insertMany(sampleProducts);
    console.log('Sample products added successfully!');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding products:', error);
  }
}

seedProducts();