const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config()

// * middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// * connect to database
mongoose.connect(process.env.Mongo_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

// * create schemas

const exerciseSchema = new mongoose.Schema({
  userid: String,
  username: String,
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: String,
});

const userSchema = new mongoose.Schema({
  username: String,
});

// * create models
const Exercise = mongoose.model('Exercise', exerciseSchema);
const User = mongoose.model('User', userSchema);

// * get
// * get list of all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// * get
// * get full exercise log of any user.
// {"description":"web_api","duration":50,"date":"Tue Feb 25 2025"},
// {"description":"test",   "duration":60,"date":"Thu Feb 20 2025"}
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found'});
    }
    let query = {userid: user._id};
    const from = req.query.from || new Date(0).toISOString().substring(0, 10);
	  const to = req.query.to || new Date(Date.now()).toISOString().substring(0, 10);
    if (req.query.from || req.query.to) {
      query.date = {};
      query.date.$gte = from;
      query.date.$lte = to;
    }
    const limit = Number(req.query.limit) || 0;
    console.log(query);
    const exercises = await Exercise.find(query).limit(limit).exec();
    
    res.json({
      _id: user._id,
      username: user.username,
      count: exercises.length,
      log: exercises.map( (exercise) => {
        return {
          description: exercise.description,
          duration: exercise.duration,
          date: new Date(exercise.date).toDateString()
        }
      })
    })
  } catch (err) {
    res.status(500).json({ error: err });
  }
})

// * post
// * create new user

app.post('/api/users', (req, res) => {
  const { username } = req.body;
  const newUser = new User({ username: username });
  newUser.save((err, data) => {
    if (err) return console.error(err);
    res.json({ username: data.username, _id: data._id });
  });
});

// * post
// * add exercise
app.post( '/api/users/:_id/exercises', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found'});
    }
    //console.log(user);
    const date = req.body.date
      ? new Date(req.body.date).toISOString().substring(0, 10)
      : new Date().toISOString().substring(0, 10);
    //console.log(req.body.duration);
    const newExercise = new Exercise({
      userid: user._id,
      username: user.username,
      description: req.body.description,
      duration: Number(req.body.duration),
      date: date,
    });
    //console.log(newExercise);
    await newExercise.save();
    //console.log('saved');
    res.json({
      username: user.username,
      description: newExercise.description,
      duration: newExercise.duration,
      date: newExercise.date,
      _id: user._id,
    });
  } catch (err) {
    res.status(500).json({ error: err});
  }
} );

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
