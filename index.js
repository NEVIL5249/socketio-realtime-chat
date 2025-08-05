const express = require("express");
const http = require("http");
const path = require("path")
const {Server} = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Store connected users
const users = new Map();

//socket.io
io.on("connection" , (socket) => {
    console.log("a new user has connected", socket.id);
    
    // Handle user joining
    socket.on("user-join", (username) => {
        users.set(socket.id, username);
        socket.broadcast.emit("user-joined", username);
        
        // Broadcast updated user list to ALL users (including the new user)
        io.emit("user-list", Array.from(users.values()));
        console.log(`${username} joined the chat`);
    });
    
    // Handle chat messages
    socket.on("send-message", (message) => {
        const username = users.get(socket.id);
        if (username) {
            io.emit("receive-message", {
                message: message,
                username: username,
                time: new Date().toLocaleTimeString()
            });
        }
    });
    
    // Handle typing indicator
    socket.on("typing", (isTyping) => {
        const username = users.get(socket.id);
        if (username) {
            socket.broadcast.emit("user-typing", {
                username: username,
                isTyping: isTyping
            });
        }
    });
    
    // Handle disconnection
    socket.on("disconnect", () => {
        const username = users.get(socket.id);
        if (username) {
            users.delete(socket.id);
            socket.broadcast.emit("user-left", username);
            
            // Broadcast updated user list to remaining users
            io.emit("user-list", Array.from(users.values()));
            console.log(`${username} left the chat`);
        }
    });
});

app.use(express.static(path.resolve("./public")));

app.get("/" , (req,res)=>{
    return res.sendFile(path.join(__dirname, "public", "index.html"));    
});

server.listen(9000, ()=>console.log(`Server started at PORT:9000`));
