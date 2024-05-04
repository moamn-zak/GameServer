const express = require('express');


const plyercontroller = require('../controller/player');


const router = express.Router();


router.post('/signup', plyercontroller.signup);
router.post('/login', plyercontroller.login);


module.exports = router;