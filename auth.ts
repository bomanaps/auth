import express, { Request, Response, NextFunction, CookieOptions } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import { User, IUser } from '../Models/User';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secret-key';

// Passport strategies
passport.use(new GoogleStrategy({
  clientID: 'your-google-client-id',
  clientSecret: 'your-google-client-secret',
  callbackURL: 'http://localhost:3000/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
  //  logic to handle Google authentication
  done(null, profile);
}));

passport.use(new GitHubStrategy({
  clientID: 'your-github-client-id',
  clientSecret: 'your-github-client-secret',
  callbackURL: 'http://localhost:3000/auth/github/callback',
}, (accessToken, refreshToken, profile, done) => {
  // Custom logic to handle GitHub authentication
  done(null, profile);
}));

const authRouter: express.Router = express.Router();

// New auth middleware
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(401).json({ message: 'Authentication failed: No token provided.' });
    }

    // Verify the token
    jwt.verify(token, JWT_SECRET, async (err, decoded: any) => {
      if (err) {
        return res.status(401).json({ message: 'Authentication failed: Invalid or expired token.' });
      }

      // Token is valid, decoded contains the payload
      const userId = decoded.userId;
      // You can now use the userId to fetch user details from the database or perform other actions
      try {
        const user: IUser | null = await User.findById(userId);
        if (!user) {
          return res.status(401).json({ message: 'Authentication failed: User not found.' });
        }

        // Store the user object in the request for further use in the route handlers
        req.user = user;

        // Call the next middleware/route handler
        next();
      } catch (error) {
        return res.status(500).json({ message: 'Internal server error.', error: error.message });
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

// Google authentication routes
authRouter.get('/google', passport.authenticate('google', { scope: ['email', 'profile'] }));
authRouter.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  const accessToken = jwt.sign({ ...req.user }, JWT_SECRET, { expiresIn: '1d' });
  res.cookie('accessToken', accessToken);
  res.redirect('/');
});

// GitHub authentication routes
authRouter.get('/github', passport.authenticate('github'));
authRouter.get('/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
  const accessToken = jwt.sign({ ...req.user }, JWT_SECRET, { expiresIn: '1d' });
  res.cookie('accessToken', accessToken);
  res.redirect('/');
});

// Wallet authentication
authRouter.get('/nonce', getNonce);
authRouter.post('/verify', verifyAccount);

// Apply the auth middleware to specific routes that require authentication
authRouter.get('/protected-route', authMiddleware, (req: Request, res: Response) => {
  // This route is protected and can only be accessed by authorized users
  res.status(200).json({ message: 'This is a protected route.', user: req.user });
});

export default authRouter;
