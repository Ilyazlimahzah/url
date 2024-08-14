import express, { NextFunction, Request, Response } from 'express';
import { shortenRouter } from './routes/shorten';
import { userRouter } from './routes/user';

const app = express();

app.use(express.json());

const loggerFunction = (req: Request, res: Response, next: NextFunction) => {
  console.error(`${req.method} to ${req.originalUrl} on this server!`);
  next();
};
app.use(loggerFunction);

app.use(shortenRouter);
app.use(userRouter);

app.all('*', async (req, res, next) => {
  next({
    status: 404,
    message: `Can't find  ${req.method} to ${req.originalUrl} on this server!`,
  });
});

// Error handler middleware
const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || 500;
  const message = err.message || 'Something went wrong';

  console.error(err, `${req.method} to ${req.originalUrl} on this server!`);

  // Send a response with the error status and message
  res.status(status).json({
    status,
    message,
  });
};

app.use(errorHandler);

export default app;
