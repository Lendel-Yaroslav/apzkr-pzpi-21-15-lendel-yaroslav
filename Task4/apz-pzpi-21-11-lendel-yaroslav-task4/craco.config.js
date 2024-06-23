// craco.config.js
module.exports = {
    devServer: {
        allowedHosts: 'all', // This will allow all hosts, you can specify the ones you need
    },
};
module.exports = {
    devServer: {
        allowedHosts: ['*'], // Use '*' to allow all hosts
    },
};