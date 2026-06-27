const app = require('./app');
const env = require('./config/env');

const PORT = env.port;

app.listen(PORT, () => {
  console.log(`🚀 OutpostClaude server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${env.nodeEnv}`);
});
