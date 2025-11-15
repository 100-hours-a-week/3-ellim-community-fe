const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// API routes
const postRouter = require('./routes/posts');
const userRouter = require('./routes/users');

app.use('/posts', postRouter);
app.use('/users', userRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Root redirect to posts list
app.get('/', (req, res) => {
    res.redirect('/posts');
});

// 404 handler - must be last
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'pages', 'error', '404.html'));
})

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});