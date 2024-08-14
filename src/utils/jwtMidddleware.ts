import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getConfig } from './config';

interface DecodedToken {
  id: string;
  email: string;
  // Add any other properties you expect to be in the token
}

export interface CustomRequest extends Request {
  user?: DecodedToken; // Make the user property optional
}

export const verifyToken = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  // Get the token from the Authorization header (e.g., Bearer <token>)
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the token using your secret key
    const decoded = jwt.verify(
      token,
      getConfig().jwt.jwtKey as string
    ) as DecodedToken;

    // Assign the decoded token to req.user
    req.user = decoded;

    // Continue to the next middleware/route handler
    next();
  } catch (err) {
    console.error(err);
    // If the token is invalid, send a 401 Unauthorized response
    res.status(401).json({ message: 'Invalid token' });
  }
};
