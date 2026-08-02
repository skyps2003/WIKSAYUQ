// Entry point for cPanel/CloudLinux Passenger.
// Load File Manager's private .env before importing authentication and Prisma.
require('dotenv').config();

// The TypeScript application must be compiled before Passenger starts it.
require('./dist/server.js');
