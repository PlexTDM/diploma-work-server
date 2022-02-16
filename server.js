const userRouter = require('./routes/routes.js');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const express = require('express');
const bp = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const server = express();

server.use(cors());
server.use(bp.json());
server.use(cookieParser());
server.use(express.json());
server.use('/static', express.static(path.join(__dirname, 'public')));
server.use(express.urlencoded({extended: true}));

server.use(userRouter);

const PORT = process.env.PORT || 4000;

const connection = async ()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI)
        .then(()=>{
            server.listen(PORT,()=>{
                console.log(`Listening ${PORT}`);
            });
        });
    } catch (err){
        console.log("Can't Connect to the server",
        err);
    };
};

connection();