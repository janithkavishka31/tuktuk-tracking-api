const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const statusRoutes = require('./src/routes/statusRoutes');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

app.use(express.json());

app.use('/api', statusRoutes);
app.use('/auth', authRoutes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`TukTuk Tracking API listening on port ${port}`);
});
