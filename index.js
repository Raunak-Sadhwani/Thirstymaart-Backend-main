const conectToMongo = require('./db')
const express = require('express')
const cors = require('cors');

conectToMongo()
const app = express()
const PORT = process.env.PORT || 3000;


app.use(express.json())

app.use(cors());

// available routes
app.use('/api/user' , require('./routes/SignupRoute'))
app.use('/api/vendorinfo' , require('./routes/VendorInfoRoute'))
app.use('/api/products', require('./routes/ProductRoute'));
app.use('/api/analysis', require('./routes/productAnalysisRoute'));
app.use('/api/categories', require('./routes/categoryRoute'));
app.use('/api/review', require('./routes/reviewsRoute'));
app.use('/api/search', require('./routes/searchRoute'));


app.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});
/* 