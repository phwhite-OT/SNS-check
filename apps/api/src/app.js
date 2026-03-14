const express = require('express');
const cors = require('cors');
const { env } = require('./config/env');
const { apiRouter } = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.locals.defaultUserId = env.DEFAULT_USER_ID;

app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);
app.use(errorHandler);

module.exports = { app };
