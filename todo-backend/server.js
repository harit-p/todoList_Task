const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
});


const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);


const TaskSchema = new mongoose.Schema({
    text: String,
    completed: { type: Boolean, default: false },
    priority: { type: String, default: 'low' },
    dueDate: Date,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const Task = mongoose.model('Task', TaskSchema);


const authenticate = async (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).send('Access denied.');

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).send('Invalid token.');
    }
};


app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).send(user);
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).send('User not found.');

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).send('Invalid password.');

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.header('Authorization', token).send(token);
});


app.get('/tasks', authenticate, async (req, res) => {
    const tasks = await Task.find({ userId: req.user._id });
    res.json(tasks);
});

app.post('/tasks', authenticate, async (req, res) => {
    const task = new Task({ ...req.body, userId: req.user._id });
    await task.save();
    io.emit('taskAdded', task);
    res.json(task);
});

app.put('/tasks/:id', authenticate, async (req, res) => {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    io.emit('taskUpdated', task);
    res.json(task);
});

app.delete('/tasks/:id', authenticate, async (req, res) => {
    await Task.findByIdAndDelete(req.params.id);
    io.emit('taskDeleted', req.params.id);
    res.status(204).send();
});


io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 6000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
