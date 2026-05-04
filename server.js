// ================= BACKEND =================
// File: server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Atlas URL yahan daalna
mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/opinionmania');

// Models
const UserSchema = new mongoose.Schema({
  username: String,
  password: String
});

const OpinionSchema = new mongoose.Schema({
  text: String,
  user: String,
  likes: { type: Number, default: 0 }
});

const User = mongoose.model('User', UserSchema);
const Opinion = mongoose.model('Opinion', OpinionSchema);

// Auth Middleware
function auth(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send('No token');

  try {
    const decoded = jwt.verify(token, 'secret');
    req.user = decoded;
    next();
  } catch {
    res.status(401).send('Invalid token');
  }
// Routes
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hash });
  await user.save();
  res.send('User created');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).send('User not found');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).send('Wrong password');

  const token = jwt.sign({ username }, 'secret');
  res.json({ token });
});

app.get('/opinions', async (req, res) => {
  const opinions = await Opinion.find();
  res.json(opinions);
});

app.post('/opinions', auth, async (req, res) => {
  const opinion = new Opinion({
    text: req.body.text,
    user: req.user.username
  });
  await opinion.save();
  res.json(opinion);
});

app.post('/like/:id', async (req, res) => {
  const op = await Opinion.findById(req.params.id);
  op.likes++;
  await op.save();
  res.json(op);
});

app.listen(process.env.PORT || 5000, () => console.log('Server running'));
}
