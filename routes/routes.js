const express = require('express');
const router = express.Router();
const ArticleController = require('../controllers/article');

router.get('/', ArticleController.getArticles);
router.get('/idsearch/:id', ArticleController.getArticlesById);
router.post('/', ArticleController.uploadArticle);
router.get('/search', ArticleController.searchArticles);

module.exports = router;