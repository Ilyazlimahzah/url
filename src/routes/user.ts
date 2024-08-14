import express, { NextFunction, Request, Response } from 'express';
import { User } from '../models/user';
import { body, validationResult } from 'express-validator';
import Jwt from 'jsonwebtoken';
import { getConfig } from '../utils/config';

const router = express.Router();

router.post(
  '/api/signup',
  [
    body('email').trim().isEmail().withMessage('Email must be valid'),
    body('type')
      .trim()
      .optional()
      .isString()
      .withMessage('type must be a string')
      .matches(/^(user|admin)$/)
      .withMessage('type must be either user or admin'),
    body('password')
      .trim()
      .isString()
      .withMessage('Password Should be A string')
      .isLength({ min: 8, max: 20 })
      .withMessage('Password must be between 8 and 20 characters'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestErrors = validationResult(req);
      if (!requestErrors.isEmpty()) {
        const result = requestErrors
          .array()
          .map((obj) => `${obj.msg}`)
          .join(', ');
        // return res.status(400).json({ errors: requestErrors.array() });
        const error = new Error(result) as any;
        error.status = 400;
        throw error;
      }
      const { email, password } = req.body;

      const userExists = await User.findOne({ email });
      if (userExists) {
        const error = new Error('Email already exists') as any;
        error.status = 400;
        throw error;
      }
      const newUser = new User({
        email,
        password,
        type: req.body.type || 'user',
      });

      await newUser.save();

      const token = Jwt.sign(
        {
          id: newUser.id,
          email: newUser.email,
          type: newUser.type,
        },
        getConfig().jwt.jwtKey,
        {
          expiresIn: '24h', // Token will expire in 24 hours
        }
      );

      res.status(201).json({ user: newUser, token });
    } catch (error: any) {
      console.error(error);
      next(error);
    }
  }
);

router.post(
  '/api/signin',
  [
    body('email').trim().isEmail().withMessage('Email must be valid'),
    body('password')
      .trim()
      .isString()
      .withMessage('Password Should be A string')
      .isLength({ min: 8, max: 20 })
      .withMessage('Password must be between 8 and 20 characters'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestErrors = validationResult(req);
      if (!requestErrors.isEmpty()) {
        const result = requestErrors
          .array()
          .map((obj) => `${obj.msg}`)
          .join(', ');
        // return res.status(400).json({ errors: requestErrors.array() });
        const error = new Error(result) as any;
        error.status = 400;
        throw error;
      }
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        const error = new Error('Invalid email or password') as any;
        error.status = 400;
        throw error;
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        const error = new Error('Invalid email or password') as any;
        error.status = 400;
        throw error;
      }

      const token = Jwt.sign(
        {
          id: user.id,
          email: user.email,
          type: user.type,
        },
        getConfig().jwt.jwtKey,
        {
          expiresIn: '24h', // Token will expire in 24 hours
        }
      );
      res.status(200).json({ user, token });
    } catch (error: any) {
      console.error(error);
      next(error);
    }
  }
);

export { router as userRouter };
