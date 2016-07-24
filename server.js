import Express from 'express';
import mongoose from 'mongoose';
import Promise from 'bluebird';
import bodyParser from 'body-parser';

Promise.promisifyAll(mongoose);

// global stuffs
global.Promise = Promise;
global.Mongoose = mongoose;

// models
global.Tag = require('./models/tag').default;
global.Repo = require('./models/repo').default;

const app = new Express();

app.use(bodyParser({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  Tag.findAsync()
    .then(result => {
      res.send(result);
    })
    .catch(err => {
      res.send(`err ${err}`);
    });
});

app.post('/saveTag', (req, res) => {
  const data = req.body || {};
  const tagName = data.name;

  if (!tagName) {
    res.status(401).json({
      errorString: 'Name is missing',
    });
    return;
  }

  const tag = new Tag();
  tag.name = tagName;

  tag.saveAsync()
    .then(results => {
      res.send(results);
      return results;
    })
    .catch(err => {
      res.send(`${err}`);
    });
});

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost/test';
mongoose.connect(mongoUri);

const port = process.env.PORT || 3333;

app.listen(port, () => {
  console.log(`🐶  server runs on port ${port}`);
});
