module.exports = {
  apps: [
    {
      name: 'courses-server',
      script: 'index.js',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      watch: false, // Set to true if you want PM2 to restart on file changes (not recommended in production)
      instances: 1, // Or 'max' for cluster mode
      autorestart: true,
      max_memory_restart: '1G'
    }
  ]
}; 