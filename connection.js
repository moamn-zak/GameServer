const app = require('./app');
const mongoose = require('mongoose');
const server = require('http').Server(app);
//require('dotenv').config();

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.ojvgbto.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority&appName=Cluster0`;

mongoose.connect(MONGODB_URI)
    .then(() =>
    {
        server.listen(process.env.PORT || 3000, () => { console.log('connectttt') });
        require('./testroom2').init(server);
    })
    .catch(error => { console.log('MongoDB connection failed: ', error); });
