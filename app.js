const express = require('express');
const Path = require('path');
const app = express();
const port = 3000;

const allwedPaths = ['/posts', '/users'];

app.use(express.static(Path.join(__dirname, 'public')));
app.use('/assets', express.static(Path.join(__dirname, 'assets')));

const postRouter = require('./public/pages/posts/js/postRoutes');
app.use('/posts', postRouter);

const userRouter = require('./public/pages/users/js/userRouter');
app.use('/users', userRouter);

app.use((req, res) => {
    if (allwedPaths.some(path => req.path.startsWith(path))) {
        res.status(404).sendFile(Path.join(__dirname, 'public', '/pages/error/404.html'));
    } else {
        res.status(404).send('404 Not Found');
    }
})

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});