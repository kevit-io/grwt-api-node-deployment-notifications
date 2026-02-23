module.exports = {
    apps: [
        {
            name: "grwt-api-node-deployment-notifications-prod",
            script: "./lib/app.js",
            watch: false,
            autorestart: true,
            restart_delay: 5000,
            max_restarts: 10,
        },
    ],
};
