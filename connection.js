const app = require('./app');
// const io = require('./controller/socket');
// const io = require('./testroom');
const mongoose = require('mongoose');
const server = require('http').Server(app);
//require('dotenv').config();

const MONGODB_URI =
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.ojvgbto.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

mongoose.connect(MONGODB_URI)
    .then(() =>
    {
        server.listen(process.env.PORT || 3000, () => { console.log('connectttt') });
        //require('./controller/socket').init(server);
        require('./tesstroom1').init(server);
    })
    .catch(error => { console.log('MongoDB connection failed: ', error); });


// const io = require('./socket').getIO();
// io.on('connection', socket =>
// {
//     console.log('Client connected');
//     console.log(socket.id);
// });