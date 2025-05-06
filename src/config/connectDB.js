

// const mysql = require('mysql2/promise');

// const connection = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     password: '',  // XAMPP's default root password is blank
//     database: 'goagamesclub',
//     port: 3306
// });


// module.exports = connection;

// const mysql = require('mysql2/promise');

// const connection = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     password: '',  // XAMPP's default root password is blank
//     database: 'goagamesclub',
//     port: 3306
// });

// module.exports = connection;

const mysql = require('mysql2/promise');

// --- DEBUG DB CONNECTION VARS ---
console.log("--- connectDb.js ---");
console.log("process.env.MYSQLHOST:", process.env.MYSQLHOST);
console.log("process.env.MYSQLUSER:", process.env.MYSQLUSER);
// console.log("process.env.MYSQLPASSWORD:", process.env.MYSQLPASSWORD); // पासवर्ड कभी लॉग न करें!
console.log("process.env.MYSQLPASSWORD exists:", !!process.env.MYSQLPASSWORD);
console.log("process.env.MYSQLDATABASE:", process.env.MYSQLDATABASE);
console.log("process.env.MYSQLPORT:", process.env.MYSQLPORT);
console.log("----------------------");

const connection = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: parseInt(process.env.MYSQLPORT, 10), // पोर्ट को नंबर में बदलना हमेशा अच्छा होता है
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = connection;

