import express, { NextFunction, Request, Response } from 'express';
import { URL } from '../models/shorten';
import QRCode from 'qrcode';
import { CustomRequest, verifyToken } from '../utils/jwtMidddleware';
import { body, validationResult } from 'express-validator';
import { User } from '../models/user';
import { getConfig } from '../utils/config';

const router = express.Router();

//for user only
router.get(
  '/api/shorten/user',
  verifyToken,
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.user?.id);
      if (!user) {
        const error = new Error(
          'User not found, register again or sign in properly'
        ) as any;
        error.status = 400;
        throw error;
      }

      const urls = await URL.find({ creator: user.id });
      res.status(200).json({ urls });
    } catch (error: any) {
      console.error(error);
      next(error);
    }
  }
);

//get analytics of shortened urls
router.get(
  '/api/shorten/admin',
  verifyToken,
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { page = 0 } = req.query;
    try {
      const user = await User.findById(req.user?.id);
      if (!user || user.type !== 'admin') {
        const error = new Error(
          'User not found or authorized to view this page'
        ) as any;
        error.status = 400;
        throw error;
      }

      const urls = await URL.find({})
        .skip(Number(page) * 10)
        .limit(10);
      res.status(200).json({ urls });
    } catch (error: any) {
      console.error(error);
      next(error);
    }
  }
);

//get shortened url by id
router.get(
  '/api/shorten/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const url = await URL.findOne({ shortUrl: id });
      if (!url) {
        const error = new Error('URL not found') as any;
        error.status = 404;
        throw error;
      }
      url.visitCount += 1;
      url.location.push(req!.ip as string);
      await url.save();
      res.status(200).json({ url: url.originalUrl });
    } catch (error: any) {
      console.error(error);
      next(error);
    }
  }
);

router.post(
  '/api/shorten/qrcode',
  verifyToken,
  [
    body('urlLink')
      .trim()
      .isString()
      .withMessage('urlLink URL Should be A valid string'),
  ],
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const requestErrors = validationResult(req);
      if (!requestErrors.isEmpty()) {
        const result = requestErrors
          .array()
          .map((obj) => `${obj.msg}`)
          .join(', ');
        const error = new Error(result) as any;
        error.status = 400;
        throw error;
      }
      const user = await User.findById(req.user?.id);
      if (!user) {
        const error = new Error(
          'User not found, register again or sign in properly'
        ) as any;
        error.status = 400;
        throw error;
      }
      const { urlLink } = req.body;
      const urlExists = await URL.findOne({ urlLink });
      if (!urlExists) {
        const error = new Error('urlLink does not exist') as any;
        error.status = 400;
        throw error;
      }
      const qrCodeDataUrl = await QRCode.toDataURL(urlExists.urlLink);

      // Send QR code as an image
      res.status(200).json(qrCodeDataUrl);
    } catch (error: any) {
      console.error(error);
      next(error);
    }
  }
);

router.post(
  '/api/shorten',
  verifyToken,
  [
    body('customUrl')
      .trim()
      .optional()
      .isString()
      .withMessage('customUrl must be valid')
      .isLength({ min: 5, max: 20 })
      .withMessage('customUrl must be between 5 and 20 characters')
      .custom((value) => {
        // Check if the customUrl is 'user' or 'admin'
        if (value === 'user' || value === 'admin') {
          throw new Error('customUrl cannot be user or admin');
        }
        return true;
      }),
    body('originalUrl')
      .trim()
      .isURL()
      .withMessage('Original URL Should be A valid URL'),
  ],
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const requestErrors = validationResult(req);
      if (!requestErrors.isEmpty()) {
        const result = requestErrors
          .array()
          .map((obj) => `${obj.msg}`)
          .join(', ');
        const error = new Error(result) as any;
        error.status = 400;
        throw error;
      }
      const user = await User.findById(req.user?.id);
      if (!user) {
        const error = new Error(
          'User not found, register again or sign in properly'
        ) as any;
        error.status = 400;
        throw error;
      }
      const { originalUrl, customUrl } = req.body;

      //create a shortUrl
      let shortUrl = '';
      if (customUrl) {
        //check if the customUrl is already in use
        const urlExists = await URL.findOne({ customUrl });
        if (urlExists) {
          const error = new Error('customUrl already exists') as any;
          error.status = 400;
          throw error;
        }
        shortUrl = customUrl;
      } else {
        shortUrl = Math.random().toString(36).substring(7);
      }
      //save the data to the database
      const newUrl = new URL({
        originalUrl,
        shortUrl: shortUrl,
        urlLink: `${getConfig().baseUrl}/api/shorten/${shortUrl}`,
        creator: user.id,
      });
      await newUrl.save();
      //send the response
      return res.status(201).json({
        message: 'URL shortened successfully',
        data: newUrl,
      });
    } catch (error: any) {
      console.error(error);
      next(error);
    }
  }
);

export { router as shortenRouter };
