const { generateAccessToken, generateRefreshToken } = require("./tokens");
const { hash, compare, genSaltSync } = require("bcryptjs");
const { verify } = require("jsonwebtoken");
const User = require("../models/usermodel");
require("dotenv").config();

class UserController {
  getUsers = async (req, res) => {
    const skips = req.params.skips;
    try {
      const authHeader = req.headers["authorization"];
      const access_token = authHeader && authHeader.split(" ")[1];
      if (access_token === null) return res.status(401);
      let willReturn = false;
      verify(access_token, process.env.SECRET_ACCESS_TOKEN, (err, data) => {
        if (err) {
          res.status(403).json({ message: err });
          return (willReturn = true);
        }
        if (data.role !== "admin") {
          willReturn = true;
        }
      });
      if (willReturn) return;
      const users = await User.find().sort({ _id: -1 }).skip(skips).limit(5);
      const count = await User.countDocuments();
      if (!users) {
        res.status(404).json({
          message: "User Not Found",
        });
        return;
      }
      res.json({
        status: 200,
        users: users,
        count: count,
      });
    } catch (error) {
      res.json({
        message: error.message,
      });
    }
  };
  getUser = async (req, res) => {
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({
        message: "id required"
      })
    }
    try {
      const authHeader = req.headers["authorization"];
      const access_token = authHeader && authHeader.split(" ")[1];
      if (access_token === null) return res.status(401);
      verify(access_token, process.env.SECRET_ACCESS_TOKEN, async (err, data) => {
        if (err) return res.status(403).json({ message: err });
        const user = await User.findById(req.params.id);
        if (!user) {
          return res.status(404).json({
            status: 404,
            message: "User Not Found",
          });
        }
        const userData = {
          _id: user._id,
          username: user.username,
          email: user.email,
          number: user.number,
          avatar: user.avatar,
          role: user.role,
          access_token: access_token,
        };
        res.json({
          message: "success",
          user: userData,
        });
      });
    } catch (error) {
      res.json({
        message: error.message,
      });
      console.error("error on getUser: ", error);
    }
  };

  async registerUser(req, res) {
    try {
      const { username, email, number, password } = req.body;
      if (!username || !email || !number || !password) {
        return res.status(400).json({ message: "info not correct" });
      }
      const checkUser = await User.findOne({ email: email });
      if (checkUser) {
        res.status(403).json({
          status: 403,
          message: "Email Already in use",
        });
        return;
      }
      const salt = genSaltSync(14);
      const hashedPassword = await hash(password, salt);
      const user = new User({
        username: username,
        email: email,
        number: number,
        password: hashedPassword,
        avatar: null,
        // avatar pic is base64, default: empty
        role: "member",
        // roles = [member, writer/author, admin];
        // default member and the admin can change it
      });
      const result = await user.save();
      res.json({
        status: 200,
        message: "Registered",
        data: result,
      });
    } catch (error) {
      res.status(501).json({
        message: error.message,
      });
    }
  }

  async loginUser(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email: email });
      if (!user) return res.status(404).json({
        status: 404,
        message: "User not Found",
      });

      const valid = await compare(password, user.password);
      if (!valid) return res.status(403).json({
        message: "Password Incorrect",
      });

      const userData = {
        _id: user._id,
        username: user.username,
        role: user.role,
      };
      const refreshtoken = generateRefreshToken(user._id, user.role);
      const accesstoken = generateAccessToken(user._id, user.role);

      userData.access_token = accesstoken;
      userData.refresh_token = refreshtoken;

      return res.send({
        message: "success",
        user: userData,
      });
    } catch (err) {
      res.json({ message: err.message });
      console.log("error on login: ", err.message);
    }
  }
  // async refreshToken(req, res) {
  //     const { refreshtoken } = req.body;
  //     if (refreshtoken === null) return res.status(401);
  //     const token = await Tokens.findOne({ 'refreshToken': refreshtoken });
  //     if (!token) return res.status(403).json({ message: "token incorrect" });
  //     verify(refreshtoken, process.env.SECRET_REFRESH_TOKEN, (err, id) => {
  //         if (err) return res.status(403).json({ message: err });
  //         const accesstoken = generateAccessToken(id);
  //         res.json({ accesstoken: accesstoken })
  //     });
  // };

  async getAccessToken(req, res) {
    console.log(req.body);
    try {
      const authHeader = req.headers["authorization"];
      const refresh_token = authHeader && authHeader.split(" ")[1];
      if (refresh_token === null) return res.status(401);
      verify(refresh_token, process.env.SECRET_REFRESH_TOKEN, (err, id) => {
        if (err) return res.status(403).json({ message: err });
        // id.id is user _id
        const access_token = generateAccessToken(id.id, id.role);
        res.json({ access_token: access_token });
      });
    } catch (error) {
      console.error("error on getaccesstoken", error);
    }
  }

  async updateUser(req, res) {
    if (req.params.id === null) return res.json({ message: "error" });
    const { username, email, number, password, avatar, role } = req.body;
    if (!username || !email || !number || !role) {
      return res.status(400).json({ message: "info not correct" });
    }
    if (
      username.trim() === "" ||
      email.trim() === "" ||
      number.trim() === "" ||
      role.trim() === ""
    ) {
      return res.status(400).json({ message: "info not correct" });
    }
    const _id = req.params.id;

    try {
      const authHeader = req.headers["authorization"];
      const access_token = authHeader && authHeader.split(" ")[1];
      if (access_token === null) return res.status(401);
      let willReturn = false;
      verify(access_token, process.env.SECRET_ACCESS_TOKEN, (err, data) => {
        if (err) {
          res.status(403).json({ message: err });
          return (willReturn = true);
        }
        if (data.role !== "admin" && _id !== data.id) {
          willReturn = true;
          res.status(403).json({ message: "You are not permitted" });
        }
      });
      if (willReturn) return;
      if (password) {
        const hashedPassword = await hash(password, 14);
        await User.findByIdAndUpdate(
          { _id: req.params.id },
          {
            $set: {
              username: username,
              email: email,
              number: number,
              password: hashedPassword,
              avatar: avatar || null,
              role: role,
            },
          }
        );
        return res.json({ message: "success" });
      } else {
        await User.findByIdAndUpdate({ _id: req.params.id },
          {
            $set: {
              username: username,
              email: email,
              number: number,
              avatar: avatar || null,
              role: role,
            },
          }
        )
      }
      res.json({
        message: "Updated Successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: error.message,
      });
    }
  }

  async deleteUser(req, res) {
    if (req.params.id === null) return res.json({ message: "error" });

    try {
      const response = await User.findOneAndDelete({ _id: req.params.id });
      res.json({
        status: 200,
        message: "Deleted Successfully",
        response: response,
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  }

  async checkValid(req, res) {
    if (!req.params.id) return;
    try {
      const user = await User.find({ _id: req.params.id });
      if (!user) return;
      res.json({
        status: 200,
        message: "Valid",
        user: user,
      });
    } catch (err) {
      res.status(501).json({
        error: err.message,
      });
    }
  }
}

module.exports = new UserController();
