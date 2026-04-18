# PM2 Ecosystem file for Next.js Spoto application
# Run with: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'spoto-nextjs',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/spoto',  # Adjust path to your project directory
      instances: 'max',  # Use all CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 9000,
        HOSTNAME: 'localhost'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 9000,
        HOSTNAME: 'localhost'
      },
      // Logging
      log_file: '/var/log/pm2/spoto.log',
      out_file: '/var/log/pm2/spoto-out.log',
      error_file: '/var/log/pm2/spoto-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      max_memory_restart: '1G',
      
      // Advanced features
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Health monitoring
      health_check_grace_period: 3000,
      
      // Environment variables
      env_file: '.env.production'  # Optional: if you have environment file
    }
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'www-data',  # Adjust user as needed
      host: 'your-server-ip',  # Replace with your server IP
      ref: 'origin/main',
      repo: 'git@github.com:your-username/spoto.git',  # Replace with your repo
      path: '/var/www/spoto',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};
