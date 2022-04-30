const { MongoClient } = require('mongodb');
var ObjectId = require('mongodb').ObjectId;
const articleModel = require('../models/articleModel');
const { verify } = require('jsonwebtoken');
const usermodel = require('../models/usermodel');
require('dotenv').config();

const client = new MongoClient(process.env.MONGO_URI);
client.connect().then(() => console.log('connected'));

class ArticleController {
    uploadArticle = (req, res) => {
        try {
            const authHeader = req.headers['authorization'];
            const access_token = authHeader && authHeader.split(' ')[1];
            if (access_token === null) return res.status(401);
            verify(access_token, process.env.SECRET_ACCESS_TOKEN, async (err) => {
                if (err) return res.status(403).json({ message: err });
                const { article, author, type, title, poster } = req.body;
                if (article.trim() === '' || author.trim() === '' ||
                    type.trim() === '' || title.trim() === '') {
                    return res.status(400).json({ error: 'expression empty' });
                }
                // const date = new Date();
                // const fullDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${(date.getMinutes() < 10 ? '0' : '') + date.getMinutes()}`;
                const newArticle = new articleModel({
                    title: title,
                    body: article,
                    author: author,
                    type: type,
                    // date: date,
                    poster: poster
                });
                newArticle.save();
                res.json({ message: 'success' });
            });
        } catch (err) {
            res.status(500).json({ error: err });
            console.error(err);
        }
    }

    getArticles = async (req, res) => {
        const { limit } = req.query;
        try {
            const result = await articleModel.find({}).limit(parseInt(limit) || 3).toArray();
            res.json({
                message: result
            });
        } catch (error) {
            res.status(500).json({ error: error });
            console.error(error);
        }
    }
    getArticlesById = async (req, res) => {
        const { id } = req.params;
        try {
            if (!id || id.trim() === '') return
            articleModel.findById(id).populate('author').exec(async (err, result) => {
                if (err) { res.status(500).json({ error: err }); return console.error(err); };
                if (!result) return res.status(404).json({ error: 'not found' });
                // console.log(result);
                const author = await usermodel.findById(result.author);
                res.json({
                    article: result,
                    author: author,
                });
            });

        } catch (error) {
            res.status(500).json({ error: error });
            console.error(error);
        }
    }

    updateArticles = async (req, res) => {
        const { title, body, type, poster } = req.body;
        const id = req.params.id;
        try {
            const authHeader = req.headers['authorization'];
            const access_token = authHeader && authHeader.split(' ')[1];
            if (access_token === null) return res.status(401);
            verify(access_token, process.env.SECRET_ACCESS_TOKEN, async (err, val) => {
                if (err) return res.status(403).json({ message: err });
                const user = await articleModel.findOne({ author: val.id });
                if (!user) return res.status(403).json({ message: 'not authorized' });
            });
            await articleModel.findOneAndUpdate({ _id: id }, {
                $set: {
                    title: title,
                    body: body,
                    type: type,
                    poster: poster
                }
            });
            res.json({
                message: 'success'
            });
        } catch (error) {
            res.status(500).json({ error: error });
            console.error(error.message);
        }
    }

    deleteArticles = async (req, res) => {
        const _id = req.params.id;
        try {
            const authHeader = req.headers['authorization'];
            const access_token = authHeader && authHeader.split(' ')[1];
            if (access_token === null) return res.status(401)
            const articleId = new ObjectId(_id);
            verify(access_token, process.env.SECRET_ACCESS_TOKEN, async (err, val) => {
                if (err) return res.status(403).json({ message: err });
                const user = await usermodel.findById(val.id);
                if (user._id.toString() !== val.id) return res.status(403).json({ message: 'not authorized' });
                await articleModel.deleteOne({ _id: articleId });
                res.json({
                    message: 'success'
                });
            });
        } catch (error) {
            res.status(500).json({ error: error });
            console.error('delete error ' + error.message);
        }
    }

    searchArticles = async (req, res) => {
        const { type, q } = req.query;
        let limit = parseInt(req.query.limit);
        let skip = parseInt(req.query.skip);
        let project = req.query.project;
        if (project) project = project.split(',').reduce((a, v) => ({ ...a, [v]: 1 }), {})
        if (!limit) limit = 10;
        if (!skip) skip = 0;
        if (!project) project = { title: 1, body: 1, date: 1 };
        let regex;
        if (!q || q === 'undefined' || q.length <= 0) regex = /./
        else regex = new RegExp(`${q}.*?`);
        try {
            if (!type && q) {
                const result = await articleModel.find({ title: { $regex: regex, $options: 'i' } }, project).skip(skip).limit(limit).sort({ _id: -1 });
                const count = await articleModel.countDocuments({ title: { $regex: regex } });
                return res.json({
                    message: result,
                    count: count
                });
            }
            if (!q && type) {
                const result = await articleModel.find({ type: type }, project).skip(skip).limit(limit).sort({ _id: -1 })
                const count = await articleModel.countDocuments({ type: type });
                return res.json({
                    message: result,
                    count: count
                });
            }
            const result = await articleModel.find({ type: type, title: { $regex: regex, $options: 'i' } }, project).skip(skip).sort({ _id: -1 }).limit(limit)
            const count = result.length;
            console.log(count);
            res.json({
                message: result,
                count: count
            });
        } catch (error) {
            res.status(500).json({ error: error });
            console.error(error.message);
        }
    }

    getUserArticles = async (req, res) => {
        const { id } = req.params;
        const { skips, limit } = req.query
        try {
            if (!id || id.trim() === '') return
            const result = await articleModel.find({ author: id }, { title: 1, }).sort({ _id: -1 }).skip(parseInt(skips)).limit(parseInt(limit));
            const count = await articleModel.countDocuments({ author: id });
            res.json({
                articles: result,
                count: count
            });
        } catch (error) {
            res.status(500).json({ error: error });
            console.error(error);
        }
    }

    getLatest = async (req, res) => {
        const { num } = req.params;
        try {
            const result = await articleModel.find({}, { title: 1, poster: 1 }).sort({ _id: -1 }).skip(parseInt(num)).limit(1).lean();
            res.json({
                message: result
            });
        } catch (error) {
            res.status(500).json({ error: error });
            console.error(error);
        }
    }

}

module.exports = new ArticleController()