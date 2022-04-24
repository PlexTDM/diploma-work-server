const { MongoClient } = require('mongodb');
var ObjectId = require('mongodb').ObjectId;
const { verify } = require('jsonwebtoken');
require('dotenv').config();

const client = new MongoClient(process.env.MONGO_URI);
client.connect().then(() => console.log('connected'));

class ArticleController {
    articlesDb = client.db('articleDb').collection('articles');
    usersDb = client.db('articleDb').collection('users');
    uploadArticle = async (req, res) => {
        let hasError = false;
        const authHeader = req.headers['authorization'];
        const access_token = authHeader && authHeader.split(' ')[1];
        if (access_token === null) return res.status(401);
        verify(access_token, process.env.SECRET_ACCESS_TOKEN, (err) => {
            if (err) {
                res.status(403).json({ message: err });
                return hasError = true;
            }
        });
        if (hasError) return;
        try {
            const { article, author, type, title, poster } = req.body;
            if (article.trim() === '' ||
                author.trim() === '' ||
                type.trim() === '' ||
                title.trim() === '') {
                return res.status(400).json({ error: 'expression empty' });
            }
            const date = new Date();
            const fullDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${(date.getMinutes() < 10 ? '0' : '') + date.getMinutes()}`;
            const formData = {
                title: title,
                body: article,
                author: author,
                type: type,
                date: fullDate,
                poster: poster
            }
            await this.articlesDb.insertOne(formData);
            res.json({ message: 'success' });
        } catch (err) {
            res.status(500).json({ error: err });
            console.error(err);
        }
    }

    getArticles = async (req, res) => {
        console.count('getArticles');
        const { limit } = req.query;
        try {
            if (!limit || limit.trim() === '') {
                const result = await this.articlesDb.find({}).toArray();
                res.json({
                    message: result
                });
                return
            }
            const result = await this.articlesDb.find({}).limit(limit).toArray();
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
            const objId = new ObjectId(id);
            const result = await this.articlesDb.find({ _id: objId }).toArray();
            const authorId = new ObjectId(result[0].author);
            const author = await this.usersDb.find({ _id: authorId }).toArray();
            res.json({
                article: result[0],
                author: author[0] || {}
            });
        } catch (error) {
            res.status(500).json({ error: error });
            console.error(error);
        }
    }

    updateArticles = async (req, res) => {
        const { title, body, type, poster } = req.body;
        const _id = req.params.id;
        try {
            const authHeader = req.headers['authorization'];
            const access_token = authHeader && authHeader.split(' ')[1];
            if (access_token === null) {
                res.status(401);
                return
            }
            const articleId = new ObjectId(_id);
            let willReturn = false;
            await verify(access_token, process.env.SECRET_ACCESS_TOKEN, async (err, val) => {
                if (err) {
                    res.status(403).json({ message: err });
                    willReturn = true;
                }
                const user = await this.articlesDb.findOne({ author: val.id });
                if (!user) {
                    res.status(403).json({ message: 'not authorized' });
                    willReturn = true;
                }
            });
            if (willReturn) return
            const dataObj = {
                title: title,
                body: body,
                type: type,
                poster: poster
            }
            await this.articlesDb.findOneAndUpdate({ _id: articleId }, { $set: dataObj });
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
            if (access_token === null) {
                res.status(401);
                return
            }
            const articleId = new ObjectId(_id);
            let willReturn = false;
            await verify(access_token, process.env.SECRET_ACCESS_TOKEN, async (err, val) => {
                if (err) {
                    res.status(403).json({ message: err });
                    willReturn = true;
                }
                const userId = new ObjectId(val.id);
                const user = await this.usersDb.findOne({ _id: userId });
                if (user._id.toString() !== val.id) {
                    res.status(403).json({ message: 'not authorized' });
                    willReturn = true;
                }
            });
            if (willReturn) return
            await this.articlesDb.deleteOne({ _id: articleId });
            res.json({
                message: 'success'
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
        if (!limit) limit = 10;
        if (!skip) skip = 0;
        if (project) project = project.split(',').reduce((a, v) => ({ ...a, [v]: 1}), {})
        if (!project) project = {title:1,body:1};
        const regex = new RegExp(`${q}.*?`);
        try {
            if (!type) {
                if (!q || q.trim() === '') return
                
                const result = await this.articlesDb.find({ title: { $regex: regex, $options : 'i' } }).project(project).skip(skip).limit(limit).sort({_id:-1}).toArray();
                const count = await this.articlesDb.countDocuments({ title: { $regex: regex } });
                return res.json({
                    message: result,
                    count: count
                });
            }
            if (!q) {
                if (!type || type.trim() === '') return
                const result = await this.articlesDb.find({ type: type}).project(project).skip(skip).limit(limit).sort({_id:-1}).toArray();
                const count = await this.articlesDb.countDocuments({ type: type });
                // console.log(type, skip, result.length);
                return res.json({
                    message: result,
                    count: count
                });
            }
            const result = await this.articlesDb.find({ type: type, title: { $regex: regex, $options : 'i' } }).project(project).skip(skip).sort({_id:-1}).limit(limit).toArray();
            const count = await this.articlesDb.countDocuments({ type:type,title: { $regex: regex, $options : 'i' } });
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
        try {
            if (!id || id.trim() === '') return
            const result = await this.articlesDb.find({ author: id }).project({title:1}).sort({ _id: -1 }).toArray();
            res.json({
                message: result
            });
        } catch (error) {
            res.status(500).json({ error: error });
            console.error(error);
        }
    }

    getLatest = async (req, res) => {
        const { num } = req.params;
        try {
            const result = await this.articlesDb.find({}).project({title:1,poster:1}).sort({ _id: -1 }).skip(parseInt(num)).limit(1).toArray();
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