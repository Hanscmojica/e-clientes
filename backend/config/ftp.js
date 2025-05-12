// config/ftp.js
module.exports = {
    host: process.env.FTP_HOST || "127.0.0.1",
    port: parseInt(process.env.FTP_PORT || "21"),
    user: process.env.FTP_USER || "eclientes",
    password: process.env.FTP_PASSWORD || "12345",
    secure: process.env.FTP_SECURE === "true",
    secureOptions: {
        rejectUnauthorized: false 
    },
    basePath: process.env.FTP_BASE_PATH || "/"
};