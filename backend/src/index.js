// index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const path = require('path');
const socketHandler = require('./socket'); // Your game logic handler
// const { initWebRouter } = require('./routes/web');
const {initWebRouter} = require(path.resolve(__dirname, '../../src/routes/web'));// Your Express routes

const YOUR_JWT_SECRET = process.env.JWT_SECRET || 'your_strong_secret_key'; // Use environment variable

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' } // Configure CORS properly 
});


const viewsPath = path.resolve(__dirname, '../../src/views');

console.log("Setting views directory to:", viewsPath); // Should print: /Users/infayoudigital/Downloads/GoaGamesStandard/src/views
app.set('views', viewsPath);
app.set('view engine', 'ejs');
// Express Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 



const publicPath = path.resolve(__dirname, '../../public');
console.log("Setting static files directory to:", publicPath);
app.use(express.static(publicPath));


const uploadsPath = path.resolve(__dirname, '../../uploads');
console.log("Setting uploads directory to:", uploadsPath);
app.use('/uploads', express.static(uploadsPath));
// Serve uploads

// Initialize Express Routes (including /login, /api/webapi/login, etc.)
initWebRouter(app);

// --- Socket.IO Authentication Middleware ---
io.use((socket, next) => {
  const token = socket.handshake.auth.token; // Get token from client connection attempt

  if (!token) {
    console.error(`Socket connection rejected (${socket.id}): No token.`);
    return next(new Error('Authentication error: No token provided')); // Reject connection
  }

  jwt.verify(token, YOUR_JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error(`Socket connection rejected (${socket.id}): Invalid token. ${err.message}`);
      return next(new Error('Authentication error: Invalid token')); // Reject connection
    }
    // Token is valid: Attach user info to the socket object
    socket.user = decoded; // Contains { userId: ..., phone: ... } etc. from JWT payload
    console.log(`Socket authenticated (${socket.id}) for user ID: ${socket.user.userId}`);
    next(); // Allow the connection
  });
});

// Initialize Your Socket Event Handlers (Pass the configured 'io' instance)
socketHandler(io);

// Optional: 404 Handler for Express
app.use((req, res) => { res.status(404).send("Not Found"); });

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { console.log(`Server running on http://localhost:${PORT}`); });



// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const socketHandler = require('./socket');

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: '*'
//   }
// });

// socketHandler(io); // initialize socket handling

// app.get('/', (req, res) => {
//     res.send('Server is running!');
//   });

// const PORT = 3000;
// server.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
