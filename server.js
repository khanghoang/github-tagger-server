import Express from 'express';
import Mongoose from 'mongoose';
import Promise from 'bluebird';
import _, { first } from 'lodash';
import bodyParser from 'body-parser';
import compression from 'compression';
import dotenv from 'dotenv';
import expressValidator from 'express-validator';
import fetch from 'node-fetch';
import invariant from 'invariant';
import logger from 'morgan';
import mongoStore from 'connect-mongo';
import passport from 'passport';
import session from 'express-session';

import path from 'path';

import Repo from './models/repo';
import Tag from './models/tag';
import User from './models/user';
import graphqlHTTP from './graphql';

Promise.config({
  // Enable cancellation
  cancellation: true,
});

dotenv.load({ path: '.env.dev' });

require('./configPassport');

import { SUCCESS, BAD_REQUEST, SERVER_ERROR } from './errorCodes';

// eslint-disable-next-line
Promise.promisifyAll(Mongoose);

// global stuffs
global.Promise = Promise;
global._ = _;

// models
global.Tag = require('./models/tag').default;
global.Repo = require('./models/repo').default;
global.User = require('./models/user').default;
const Token = require('./models/token').default;

const app = new Express();

const MongoStore = mongoStore(session);

app.set('views', path.join(__dirname, 'views'));
app.use('/static', Express.static(`${__dirname}/assets`));
app.set('view engine', 'jade');
app.use(compression());
app.use(expressValidator());
app.use(logger('dev'));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 365,
    },
    store: new MongoStore({
      url: process.env.MONGO_URI,
      autoReconnect: true,
    }),
  })
);

app.use(bodyParser({ extended: false }));
app.use(bodyParser.json());

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

app.get('/', (req, res) => {
  Tag.findAsync()
    .then(result => {
      res.send(result);
    })
    .catch(err => {
      res.send(`err ${err}`);
    });
});

const requireSessionOrToken = (req, res, next) => {
  if (req.user) {
    next();
    return;
  }

  const middleware = passport.authenticate('bearer', { session: false });
  middleware(req, res, next);
};

app.get('/getRepo', requireSessionOrToken, (req, res) => {
  let { tags: tags = '' } = req.query;

  tags = tags.split(',').map(t => t.trim()).filter(t => t !== '');

  const getRepoByTag = tag =>
    Tag.find({ name: tag })
      .populate('repos')
      .exec((err, t) => {
        if (err) {
          return Promise.reject(err);
        }

        return Promise.resolve(t);
      })
      .then(foundTags => _.first(foundTags) || { repos: [] })
      .then(results => {
        const getTagFromId = id =>
          Tag.findOne({ _id: id }).populate('tags').exec((err, arrTags) => {
            if (err) {
              return Promise.reject(err);
            }

            return Promise.resolve(arrTags);
          });

        const populateRepo = repo =>
          Promise.props({
            name: Promise.resolve(repo.name),
            tags: Promise.all(repo.tags.map(getTagFromId)),
          });

        return Promise.all(
          results.repos
            // eslint-disable-next-line no-underscore-dangle
            .filter(r => r.user.toString() === req.user._id.toString())
            .map(r => populateRepo(r))
        );
      });

  const p = Promise.resolve()
    .then(() => {
      invariant(req.user, 'Login required!!!');
      return true;
    })
    .catch(err => {
      res.status(400).json({ errorMessage: err.toString() });
      p.cancel();
      return;
    })
    .then(() => {
      if (tags.length > 0) {
        return Promise.all(tags.map(t => getRepoByTag(t)));
      }

      return Repo.find({ user: Mongoose.Types.ObjectId(req.user._id) }) // eslint-disable-line
        .populate('tags')
        .exec((err, repos) => {
          if (err) {
            return Promise.reject(err);
          }
          return Promise.resolve(repos || []);
        });
    })
    .then(_.flatten)
    .then(repos => _.unionBy(repos, 'name'))
    .then(repos =>
      repos.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt))
    )
    .then(results => {
      res.status(SUCCESS).json({ data: results });
      return results;
    })
    .catch(err => {
      res.status(SERVER_ERROR).json({ errorMessage: err.toString() });
    });
  return p;
});

app.post('/save', requireSessionOrToken, (req, res) => {
  console.log('req.user: ', req.user);
  let { tags: tags = '', name: repoName = '' } = req.body; // eslint-disable-line
  tags = tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t !== '');

  const repo = new Repo();
  repo.name = repoName;

  const p = Promise.resolve()
    .then(() => {
      invariant(req.user, 'Login required');
      return true;
    })
    .catch(err => {
      res.status(BAD_REQUEST).json({ errorMessage: err.toString() });
      p.cancel();
    })
    .then(() => {
      invariant(repoName, 'Name is missing');
      return true;
    })
    .then(() => {
      invariant(tags.length > 0, 'No tags?');
      return true;
    })
    .then(() => {
      const findTag = tagName =>
        Tag.findAsync({ name: tagName })
          .then(foundTags => {
            if (foundTags.length === 0) {
              const newTag = new Tag();
              newTag.name = tagName;
              return newTag.saveAsync();
            }

            const firstRepo = _.first(foundTags);
            return firstRepo;
          })
          .then(tag => {
            tag.repos.push(repo._id); // eslint-disable-line
            return tag.saveAsync();
          });

      const promises = _.reduce(
        tags,
        (acc, t) => {
          acc[t] = findTag(t.toLowerCase()); // eslint-disable-line
          return acc;
        },
        {}
      );

      return Promise.props(promises);
    })
    .then(foundTags => {
      repo.tags = _.reduce(
        foundTags,
        (acc, t) => {
          acc.push(t._id); // eslint-disable-line
          return acc;
        },
        []
      );
      repo.user = req.user._id; // eslint-disable-line
      return repo.saveAsync();
    })
    .then(foundRepo =>
      Repo.findOne({ _id: foundRepo }).populate('tags').exec((err, result) => {
        if (err) {
          return Promise.reject(err);
        }

        return Promise.resolve(result);
      })
    )
    .then(result => {
      res.status(SUCCESS).json({
        repo: result,
      });
      return result;
    })
    .catch(err => {
      res.status(BAD_REQUEST).json({
        errorMessage: err.toString(),
      });
    });
});

app.get('/auth/github', passport.authenticate('github'));
app.get(
  '/auth/github/callback',
  passport.authenticate('github', {
    failureRedirect: '/login',
  }),
  (req, res) => {
    const token = new Token({});
    token.user = req.user;
    token.save(err => {
      if (!err) {
        res.json({
          token,
        });
      }
    });
  }
);

app.use(graphqlHTTP);

/* login by using github token */
// eslint-disable-next-line
app.post('/login/github', async (req, res) => {
  Promise.promisifyAll(Token);
  Promise.promisifyAll(User);

  const { token } = req.body;
  const rawData = await fetch('https://api.github.com/user/emails', {
    headers: {
      Accept: 'application/json',
      Authorization: `token ${token}`,
    },
    method: 'GET',
  });

  const emails = await rawData.json();
  const primaryEmail = first(emails.filter(({ primary }) => primary));
  const getOrCreateUserByEmail = async email => {
    const u = await User.findOneAsync({ 'profile.email': email });
    if (u) return u;
    const newUser = new User();
    newUser.githubToken = token;
    newUser.profile.name = '';
    newUser.profile.picture = '';
    newUser.profile.email = email;
    await newUser.saveAsync();
  };

  const user = await getOrCreateUserByEmail(primaryEmail.email);
  const newToken = new Token({
    user,
  });

  await newToken.saveAsync();
  return res.json(newToken);
});

const mongoUri = process.env.MONGO_URI;
// eslint-disable-next-lint
Mongoose.connect(mongoUri);

const port = process.env.PORT || 3333;

app.listen(port, () => {
  console.log(`🐶  server runs on port ${port}`);
});
