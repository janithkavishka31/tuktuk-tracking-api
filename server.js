const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

dotenv.config();

const statusRoutes = require('./src/routes/statusRoutes');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const tuktukRoutes = require('./src/routes/tuktukRoutes');
const locationRoutes = require('./src/routes/locationRoutes');
const policeStationRoutes = require('./src/routes/policeStationRoutes');
const deviceRoutes = require('./src/routes/deviceRoutes');
const { notFoundHandler, errorHandler } = require('./src/middleware/errorHandler');

const app = express();

if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set. Authentication will fail until it is configured.');
}

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }),
);
app.use(morgan('dev'));
app.use(express.json());

const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 30),
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(defaultLimiter);

app.use('/api', statusRoutes);
app.use('/auth', authLimiter, authRoutes);
app.use('/users', userRoutes);
app.use('/tuktuks', tuktukRoutes);
app.use('/locations', locationRoutes);
app.use('/policestations', policeStationRoutes);
app.use('/devices', deviceRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`TukTuk Tracking API listening on port ${port}`);
});
