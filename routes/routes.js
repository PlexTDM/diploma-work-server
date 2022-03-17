const express = require('express');
const router = express.Router();
const ArticleController = require('../controllers/article');
const AuthController = require('../controllers/auth');

router.get('/', ArticleController.getArticles);
router.get('/idsearch/:id', ArticleController.getArticlesById);
router.post('/', ArticleController.uploadArticle);
router.get('/search', ArticleController.searchArticles);
router.get('/getUserArticles/:id', ArticleController.getUserArticles);
router.put('/update/:id', ArticleController.updateArticles);
router.delete('/delete/:id', ArticleController.deleteArticles);

router.post('/login', AuthController.loginUser);
router.post('/register', AuthController.registerUser);
router.get('/getUser/:id', AuthController.getUser);
router.post('/accesstoken', AuthController.getAccessToken);

module.exports = router;