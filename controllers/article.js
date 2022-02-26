const { MongoClient } = require('mongodb');
var ObjectId = require('mongodb').ObjectId; 
require('dotenv').config();

const client = new MongoClient(process.env.MONGO_URI);

class ArticleController {
    uploadArticle = async (req, res) => {
        console.log(req.body)
        //  or this xD 
        // async uploadArticle(req, res){
        const db = client.db('articleDb').collection('articles');
        try {
            const { article, author, type, title } = req.body;
            if (article.trim() === ''||
            author.trim() === '' ||
            type.trim() === '' ||
            title.trim() === '') {
                return res.status(400).json({ error: 'expression empty' });
            }
            const date = new Date();
            const fullDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${(date.getMinutes()<10?'0':'') + date.getMinutes()}`;
            const formData = {
                title: title,
                body: article,
                author: author,
                type: type,
                date: fullDate
            }
            await client.connect();
            db.insertOne(formData);
            res.json({ message: 'success' });
        } catch (err) {
            res.status(500).json({ error: err });
            console.log(err);
        }
    }

    getArticles = async (req, res) => {
        const {limit} = req.query;
        const db = client.db('articleDb').collection('articles');
        try {
            if(!limit || limit.trim() === ''){
                await client.connect();
                const result = await db.find({}).toArray();
                return res.json({
                    message: result
                });
            }
            await client.connect();
            const result = await db.find({}).limit(limit).toArray();
            res.json({
                message: result
            });
        } catch (error) {
            res.status(500).json({ error: error });
            console.log(error);
        }
    }
    getArticlesById = async (req, res) => {
        const {id} = req.params;
        const db = client.db('articleDb').collection('articles');
        try {
            if(!id || id.trim() === '')return
            await client.connect();
            const objId = new ObjectId(id);
            const result = await db.find({_id:objId}).toArray();
            res.json({
                message: result
            });
        } catch (error) {

        }
    }
    searchArticles = async (req, res) => {
        const db = client.db('articleDb').collection('articles');
        const { type, q } = req.query;
        try {
            // if(!type || type.trim() === '' && !q || q.trim() === ''){
            //     return res.status(400).json({ error: 'expression empty' });
            // }
            if(!type){
                if (!q || q.trim() === '') return
                await client.connect();
                const regex = new RegExp(`${q}.*?`);
                const result = await db.find({title:{$regex: regex}}).toArray();
                res.json({
                    message: result
                });
                return
            }
            if(!q){
                if (!type || type.trim() === '')return
                await client.connect();
                const result = await db.find({type:type}).toArray();
                res.json({
                    message: result
                });
                return
            }
            await client.connect();
            const regex = new RegExp(`${q}.*?`);
            const result = await db.find({type:type,title:{$regex: regex}}).toArray();
            res.json({
                message: result
            });
        } catch (error) {
            res.status(500).json({ error: error });
            console.log(error);
        }
    }
}

module.exports = new ArticleController()