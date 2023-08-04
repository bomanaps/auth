import express, { NextFunction, Request, Response } from 'express';
import { User, IUser } from '../Models/User';
import jwt from 'jsonwebtoken';
import { IGetUserAuthInfoRequest } from '../definition';
import { frontendUrl } from '../app';

const JWT_SECRET = "alwaysnoteverything";

const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', frontendUrl); // Replace with the origin of your frontend application
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // Allow credentials (cookies, headers) to be sent with requests
    
    const accessToken = req.cookies['accessToken']; // Get the accessToken from the cookie

    if (!accessToken) {
      return res.status(401).json({ message: 'Unauthorized - no token' });
    }

    try {
      // Verify the JWT token from the cookie
      const decoded: any = jwt.verify(accessToken, JWT_SECRET);
      const email: string = decoded.email;
      
      // Find user by email
      const user = await User.findOne({ email: email });

      if (user) {
        req.user = user;
        next();
      } else {
        return res.status(401).json({ message: 'Unauthorized - no user found' });
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Unauthorized - token has expired' });
      }
      return res.status(401).json({ message: 'Unauthorized - invalid token' });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error - auth middleware',
      error: error
    });
  }
}

export { auth };

