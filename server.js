const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

dotenv.config();

const statusRoutes = require('./src/routes/statusRoutes');
const authRoutes = require('./src/routes/authRoutes');
const tuktukRoutes = require('./src/routes/tuktukRoutes');
const locationRoutes = require('./src/routes/locationRoutes');
const policeStationRoutes = require('./src/routes/policeStationRoutes');
const { notFoundHandler, errorHandler } = require('./src/middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api', statusRoutes);
app.use('/auth', authRoutes);
app.use('/tuktuks', tuktukRoutes);
app.use('/locations', locationRoutes);
app.use('/policestations', policeStationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`TukTuk Tracking API listening on port ${port}`);
});
