const mongoose = require('mongoose')
const mongoURI = 'mongodb+srv://thirstymaartdb:Kolhapur%409115@thirstymaart.0zg2zbq.mongodb.net/Thirstymaart_maindb'

const conectToMongo = ()=>{
    mongoose.connect(mongoURI)
    console.log('conected to mongo sucesfully')
    
}

module.exports = conectToMongo;