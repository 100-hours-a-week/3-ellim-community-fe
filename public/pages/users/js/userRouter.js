const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/signin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'user-signin.html'));
});

router.get('/signup', (req, res) => {   
    res.sendFile(path.join(__dirname, '..', 'user-signup.html'));
});

router.get('/edit', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'user-edit.html'));
});

router.get('/edit/password', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'user-edit-password.html'));
});

// 로그아웃 라우트 추가 (예: /users/logout)

module.exports = router;