const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/signin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'users', 'user-signin.html'));
});

router.get('/signup', (req, res) => {   
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'users', 'user-signup.html'));
});

router.get('/edit', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'users', 'user-edit.html'));
});

router.get('/edit/password', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'users', 'user-edit-password.html'));
});

module.exports = router;
