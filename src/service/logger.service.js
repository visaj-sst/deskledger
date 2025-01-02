import winston from 'winston';

const logger = winston.createLogger({
  transports: [
    // File transport for error logs
    new winston.transports.File({
      level: "error",
      filename: "logs/filelog-error.log",
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.json()
      ),
    }),
    // File transport for info logs
    new winston.transports.File({
      level: "info",
      filename: "logs/filelog-info.log",
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.json()
      ),
    }),
    // File transport for warn logs
    new winston.transports.File({
      level: "warn",
      filename: "logs/filelog-warn.log",
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.json()
      ),
    }),
    // Console transport to display logs in the console
    new winston.transports.Console({
      level: "info", // Adjust this to the lowest level you want to display in the console (info, warn, error)
      format: winston.format.combine(
        winston.format.colorize(), // Adds colors to the console output
        winston.format.simple() // Simple format for console output
      ),
    }),
  ],
});

export default logger;
