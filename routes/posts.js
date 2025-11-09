const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'posts', 'post-list.html'));
});

router.get('/create', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'posts', 'post-create.html'));
});

router.get('/edit/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'posts', 'post-edit.html'));
});

router.get('/:id', (req, res, next) => {
    const id = req.params.id;
    if (!/^\d+$/.test(id)) return next();
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'posts', 'post-detail.html'));
});

module.exports = router;
