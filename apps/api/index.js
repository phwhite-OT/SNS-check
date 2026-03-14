const { app } = require('./src/app');
const { env } = require('./src/config/env');

app.listen(env.PORT, () => {
  console.log(`API Server running on http://localhost:${env.PORT}`);
});
