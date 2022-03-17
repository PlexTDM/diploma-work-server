const { sign } = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const generateAccessToken = id=>{
    return sign({id}, process.env.SECRET_ACCESS_TOKEN,{
        expiresIn: '86400s'
        // 24h
    });
};

const generateRefreshToken = id =>{
    return sign({id}, process.env.SECRET_REFRESH_TOKEN,{
        expiresIn: '1200s'
        // 20min
    });
};

const sendAccessToken = (req, res, accesstoken, user)=>{
    res.send({
        accesstoken,
        message: 'success',
        user: user
    });
};

const sendRefreshToken = (res, refreshtoken)=>{
    // res.cookie('refreshtoken', refreshtoken, {
    //     httpOnly: false,
    //     path: './refresh_token'
    // });
    res.send({
        refreshtoken: refreshtoken,
    })
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    sendAccessToken,
    sendRefreshToken
};