module.exports = {
  apps: [
    {
      name: 'eventkitqr-api',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 5050,
        ADMIN_EMAIL: 'technula@gmail.com',
        ADMIN_PASSWORD: 'Technula#191219',
        MONGODB_URI: 'mongodb+srv://bhaskarjoshi9965_db_user:Kichcha00@lmsfull.acqnhdd.mongodb.net/eventkitlead?retryWrites=true&w=majority&appName=lmsfull'
      }
    }
  ]
};
