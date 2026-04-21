module.exports = {
  apps: [
    {
      name: 'worker-api',
      script: './backend/server.js',
      cwd: '/var/www/worker',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 4001,
      },
    },
  ],
};
