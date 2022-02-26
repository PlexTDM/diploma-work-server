const express = require('express');
const router = express.Router();
const ArticleController = require('../controllers/article');
const AuthController = require('../controllers/auth');

router.get('/', ArticleController.getArticles);
router.get('/idsearch/:id', ArticleController.getArticlesById);
router.post('/', ArticleController.uploadArticle);
router.get('/search', ArticleController.searchArticles);
router.post('/login', AuthController.loginUser);
router.post('/register', AuthController.registerUser);

module.exports = router;