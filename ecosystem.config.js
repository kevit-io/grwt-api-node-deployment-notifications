module.exports = {
    apps: [
        {
            name: "project-relevant-PM2-process-name",
            script: "./lib/index.js", // path to start your project
            watch: false,
            autorestart: true,
            restart_delay: 5000,
            max_restarts: 10,
            env: {
                NODE_ENV: "production",
            },
        },
    ],
};