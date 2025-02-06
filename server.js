const http = require('http');
const port = 3003;
const app = require('./app')
require('dotenv').config();

const server = http.createServer(app);


server.listen(port,()=>{
    console.log("server is live now");
})