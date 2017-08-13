import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { get } from 'lodash';
import BearerStrategy from 'passport-http-bearer';
import Token from './models/token';
import User from './models/user';

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    console.log('user', user);
    done(err, user);
  });
});

passport.use(
  new BearerStrategy((tokenString, done) => {
    Token.findOne({ token: tokenString }, (err, token) => {
      if (err) {
        return done(err);
      }
      if (!token.user) {
        return done(null, false);
      }

      return User.findOne({ _id: token.user }, (userError, user) => {
        if (err) {
          return done(err);
        }
        return done(null, user, { scope: 'all' });
      });
    });
  })
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      callbackURL: process.env.REDIRECT_URL,
      scope: 'user:email',
    },
    (accessToken, refreshToken, profile, done) => {
      User.findOne({ githubID: profile.id }, (err, existingUser) => {
        if (existingUser) {
          done(err, existingUser);
        } else {
          const user = new User();
          user.githubID = profile.id;
          user.githubToken = accessToken;
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.picture = user.profile.picture ||
            // eslint-disable-next-line
            profile._json.avatar_url;
          user.profile.email = get(profile, 'emails[0].value', '');
          user.save(saveError => {
            done(saveError, user);
          });
        }
      });
    }
  )
);

// eslint-disable-next-line
export function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}
