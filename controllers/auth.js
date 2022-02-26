// const { generateAccessToken, generateRefreshToken, sendAccessToken, sendRefreshToken } = require('./tokens');
const { hash, compare, genSaltSync } = require('bcryptjs');
const { verify } = require('jsonwebtoken');
const User = require('../models/usermodel');
require('dotenv').config();

class UserController {

    getUsers = async (req, res) => {
        try {
            const users = await User.find();
            if (!users) {
                res.status(404).json({
                    message: 'User Not Found'
                });
                return;
            };
            res.json({
                status: 200,
                users: users
            });
        } catch (error) {
            res.json({
                message: error.message
            });
        };
    };

    async registerUser(req, res) {
        try {
            const { username, email, number, password } = req.body;
            if (!username || !email || !number || !password) {
                return res.status(400).json({ message: "info not correct" });
            }
            const checkUser = await User.findOne({ 'email': email });
            if (checkUser) {
                res.json({
                    status: 403,
                    message: "Email Already in use"
                });
                return;
            };
            const salt = genSaltSync(14);
            const hashedPassword = await hash(password, salt);
            const user = new User({
                username: username,
                email: email,
                number: number,
                password: hashedPassword,
                avatar: '',
                // avatar pic is base64, default: empty
                role: 'member'
                // roles = [member, writer/author, admin];
                // default member and the admin can change it
            });
            const result = await user.save();
            res.json({
                status: 200,
                message: 'Registered',
                data: result
            });
        } catch (error) {
            res.status(501).json({
                message: error.message
            });
        };
    };

    async loginUser(req, res) {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ 'email': email });
            if (!user) {
                // return res.status(404).json({
                return res.json({
                    status: 404,
                    message: 'User not Found'
                });
            };

            const valid = await compare(password, user.password);
            if (!valid) {
                res.status(403).json({
                    message: 'Password Incorrect'
                });
                return;
            };

            res.send({
                message: 'success',
                user: user
            });
            // console.log(user, valid)


            // const refreshtoken = generateRefreshToken(user.id);
            // const accesstoken = generateAccessToken(user.id);
            // user.accesstoken = accesstoken;
            // user.refreshToken = refreshtoken;

            // const token = new Tokens({
            //     refreshToken: refreshtoken
            // });
            // const result = await token.save();

            // sendRefreshToken(res, refreshtoken);
            // sendAccessToken(req, res, accesstoken, user);
        } catch (err) {
            res.json({ message: err.message });
            console.log(err.message);
        };
    };
    async refreshToken(req, res) {
        const { refreshtoken } = req.body;
        if (refreshtoken === null) return res.status(401);
        const token = await Tokens.findOne({ 'refreshToken': refreshtoken });
        if (!token) return res.status(403).json({ message: "token incorrect" });
        verify(refreshtoken, process.env.SECRET_REFRESH_TOKEN, (err, id) => {
            if (err) return res.status(403).json({ message: err });
            const accesstoken = generateAccessToken(id);
            res.json({ accesstoken: accesstoken })
        });
    };

    async updateUser(req, res) {
        if (req.params.id === null) return res.json({ message: 'error' });

        try {
            const { username, email, number, password } = req.body;
            const hashedPassword = await hash(password, 14);

            const response = await User.findByIdAndUpdate(
                { _id: req.params.id },
                {
                    $set: {
                        username: username,
                        email: email,
                        number: number,
                        password: hashedPassword
                    }
                });
            res.json({
                message: 'Updated Successfully',
                response: response
            });
        } catch (error) {
            res.status(500).json({
                error: error.message
            });
        };
    };

    async deleteUser(req, res) {
        if (req.params.id === null) return res.json({ message: 'error' });

        try {
            const response = await User.findOneAndDelete({ _id: req.params.id });
            res.json({
                status: 200,
                message: 'Deleted Successfully',
                response: response
            });
        } catch (error) {
            res.status(500).json({
                error: error.message
            });
        };
    };

    async checkValid(req, res) {
        if (!req.params.id) return;
        try {
            const user = await User.find({ _id: req.params.id });
            if (!user) return;
            res.json({
                status: 200,
                message: 'Valid',
                user: user
            });
        } catch (err) {
            res.status(501).json({
                error: err.message
            });
        };
    };

};

module.exports = new UserController()