const express = require('express');
const bodyparser = require('body-parser');

const app = express();
module.exports = app;




const playerroute = require('./routes/player');


app.use((req, res, next) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // تصحيح هنا
	next();
});
app.use(bodyparser.json());




app.use('/player', playerroute);






app.use((error, req, res, next) =>
{
	console.log(error);
	const status = error.statusCode || 500;
	let message = error.message;

	// Check if the error has an array of errors
	if (error.array)
	{
		// Format the errors array
		const errorsArray = error.array();
		message = { errors: errorsArray.map(err => ({ message: err.msg })) };
	}

	res.status(status).json({ message: message });
	console.log(req)
});














//////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
// const mongoose = require('mongoose');
//const server = require('http').Server(app);
// const io = require('socket.io')(server);


//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////




