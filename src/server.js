
require('dotenv/config'); 
require('dotenv').config({ path: '../.env' }); 

const express = require('express');
const http = require('http');      
const path = require('path');      
const { Server } = require('socket.io'); 
const jwt = require('jsonwebtoken'); 
const cookieParser = require('cookie-parser');

const configViewEngine = require('./config/configEngine'); 
const routes = require('./routes/web');                   
const socketHandler = require('../src/public/DragonTiger/assets/socket.io/socket');                
const cronJobContronler = require('./controllers/cronJobContronler');
const socketIoController = require('./controllers/socketIoController');  
const aviatorController = require('./controllers/aviatorController'); 
const Dragon = require('./controllers/dragonController');
const historyApiRoutes = require('../src/public/DragonTiger/assets/routes/historyApi');
const adminApiRoutes = require('../src/public/DragonTiger/assets/routes/adminApi');



const YOUR_JWT_SECRET = process.env.JWT_SECRET || 'your_strong_secret_key'; 
const port = process.env.PORT || 7777; 

const app = express();
const server = http.createServer(app); 
const io = new Server(server, {      
    cors: {
        origin: '*', 
       
    }
});

app.use(cookieParser()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

const publicPath = path.resolve(__dirname, '../public'); 
console.log("Setting static files directory to:", publicPath);
app.use(express.static(publicPath));

const uploadsPath = path.resolve(__dirname, '../uploads'); 
console.log("Setting uploads directory to:", uploadsPath);
app.use('/uploads', express.static(uploadsPath));
app.use('/api', historyApiRoutes); 
app.use('/api/admin',adminApiRoutes);



configViewEngine(app);


routes.initWebRouter(app);


io.use((socket, next) => {
    console.log(`Socket attempting connection (${socket.id}). Checking token...`);

 
        console.log(`Socket authenticated (${socket.id})`);
        next(); 
    });



socketHandler(io);


socketIoController.sendMessageAdmin(io);
aviatorController.Aviator(io);        
Dragon.Dragon(io);
// Dragon.userDekh(io);


cronJobContronler.cronJobGame1p(io);


app.all('*', (req, res) => {
    
    return res.status(404).send("404 Not Found"); 
});


server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log("JWT Secret Loaded:", YOUR_JWT_SECRET ? "Yes (First few chars: " + YOUR_JWT_SECRET.substring(0, 5) + "...)" : "NO - Using default!");
});
