const express = require('express');
const router = express.Router();
const ArticleController = require('../controllers/article');
const AuthController = require('../controllers/auth');

router.get('/', ArticleController.getArticles);
router.get('/home', ArticleController.homePage);
router.get('/idsearch/:id', ArticleController.getArticlesById);
router.post('/', ArticleController.uploadArticle);
router.get('/search', ArticleController.searchArticles);
router.get('/getUserArticles/:id', ArticleController.getUserArticles);
router.put('/update/:id', ArticleController.updateArticles);
router.delete('/delete/:id', ArticleController.deleteArticles);

router.get('/getUsers/:skips', AuthController.getUsers);
router.get('/getUser/:id', AuthController.getUser);
router.post('/register', AuthController.registerUser);
router.post('/login', AuthController.loginUser);
router.put('/updateUser/:id', AuthController.updateUser);
router.post('/accesstoken', AuthController.getAccessToken);

module.exports = router;