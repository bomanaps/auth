import express, { NextFunction, Request, Response } from 'express';
import { User, IUser } from '../Models/User';
import jwt from 'jsonwebtoken';
import { IGetUserAuthInfoRequest } from '../definition';
import { frontendUrl } from '../app';

const JWT_SECRET = "alwaysnoteverything";

const getTokenFromCookie = (req: Request) => {
  const walletsCookie = req.cookies['Wallets']; // Get the "Wallets" cookie array

  if (!walletsCookie || !Array.isArray(walletsCookie) || walletsCookie.length === 0) {
    return null; // No token found in the cookie
  }

  const walletAddress: string = walletsCookie[0]; // Get the first index of the wallet array

  try {
    const decoded: any = jwt.verify(walletAddress, JWT_SECRET);
    return decoded; // Return the decoded payload
  } catch (error) {
    return null; // Token verification failed
  }
};

const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // ... (CORS headers setup and other code)

    const decodedPayload = getTokenFromCookie(req);

    if (!decodedPayload) {
      return res.status(401).json({ message: 'Unauthorized - invalid token' });
    }

    try {
      const user = await User.findOne({ wallet: { $elemMatch: { address: decodedPayload.walletAddress } } });

      if (user) {
        req.user = user;
        next();
      } else {
        return res.status(401).json({ message: 'Unauthorized - no user found' });
      }
    } catch (error) {
      // ...
    }
  } catch (error) {
    // ...
  }
};

export { auth };
