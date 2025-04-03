"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

const socket = io("https://backend-chatwave-production.up.railway.app/");

export default function Chat() {
    const [username, setUsername] = useState("");
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [joined, setJoined] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const [avatarColor, setAvatarColor] = useState("");
    const messagesEndRef = useRef(null);
    const messageInputRef = useRef(null);
    const usernameInputRef = useRef(null);

    // Generate random color for user avatar
    useEffect(() => {
        const colors = [
            "bg-pink-500", "bg-purple-500", "bg-indigo-500", 
            "bg-blue-500", "bg-green-500", "bg-yellow-500", 
            "bg-red-500", "bg-teal-500"
        ];
        setAvatarColor(colors[Math.floor(Math.random() * colors.length)]);
    }, []);

    // Auto-focus username input on load
    useEffect(() => {
        if (usernameInputRef.current) {
            usernameInputRef.current.focus();
        }
    }, []);

    // When a new message is received
    useEffect(() => {
        socket.on("receive_message", (data) => {
            setMessages((prev) => [...prev, {...data, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}]);
        });

        socket.on("update_users", (users) => {
            setUsers(users);
        });

        socket.on("user_typing", (user) => {
            if (user !== username) {
                setTypingUsers((prev) => {
                    if (!prev.includes(user)) {
                        return [...prev, user];
                    }
                    return prev;
                });
                
                setTimeout(() => {
                    setTypingUsers((prev) => prev.filter(u => u !== user));
                }, 3000);
            }
        });

        return () => {
            socket.off("receive_message");
            socket.off("update_users");
            socket.off("user_typing");
        };
    }, [username]);

    
    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    useEffect(() => {
        if (joined && messageInputRef.current) {
            messageInputRef.current.focus();
        }
    }, [joined]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    
    const joinChat = (e) => {
        e?.preventDefault();
        if (username.trim() !== "") {
            socket.emit("join_chat", username);
            setJoined(true);
        }
    };


    const sendMessage = (e) => {
        e?.preventDefault();
        if (message.trim() !== "") {
            const currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const msgData = { username, message, time: currentTime, avatarColor };
            socket.emit("send_message", msgData);
            setMessage("");
        }
    };

    
    const handleTyping = (e) => {
        setMessage(e.target.value);
        if (!isTyping) {
            setIsTyping(true);
            socket.emit("typing", username);
            setTimeout(() => setIsTyping(false), 3000);
        }
    };

    
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
            <AnimatePresence>
                {!joined ? (
                    <div className="flex flex-col items-center justify-center w-full min-h-screen p-6">
                        <motion.div 
                            initial={{ opacity: 0, y: -30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-center mb-8"
                        >
                            <h1 className="text-5xl font-bold mb-2 text-blue-400">ChatWave</h1>
                            <p className="text-gray-400 text-lg">Connect and chat in real-time</p>
                        </motion.div>
                        
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700 w-full max-w-md"
                        >
                            <div className="flex items-center justify-center mb-6">
                                <div className="relative">
                                    <div className={`w-20 h-20 rounded-full ${avatarColor} flex items-center justify-center text-2xl font-bold`}>
                                        {username ? username.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-800"></div>
                                </div>
                            </div>
                            
                            <h2 className="text-2xl font-bold mb-6 text-center">Join the Conversation</h2>
                            
                            <form onSubmit={joinChat} className="flex flex-col">
                                <div className="mb-4">
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-2">
                                        What should we call you?
                                    </label>
                                    <input
                                        id="username"
                                        ref={usernameInputRef}
                                        type="text"
                                        placeholder="Your Name"
                                        className="p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                                
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="mt-4 px-4 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-lg"
                                    type="submit"
                                    disabled={!username.trim()}
                                >
                                    Join Chat
                                </motion.button>
                            </form>
                            
                            <div className="mt-6 flex justify-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <p className="text-green-400 text-sm">{users.length} users online</p>
                            </div>
                        </motion.div>
                        
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="mt-8 text-center text-gray-500 text-sm"
                        >
                            <p>© 2025 ChatWave. Experience real-time communication.</p>
                        </motion.div>
                    </div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full max-w-4xl p-6"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-blue-400">ChatWave</h2>
                            <div className="bg-blue-600 px-3 py-1 rounded-full text-sm flex items-center">
                                <div className={`w-4 h-4 rounded-full ${avatarColor} mr-2`}></div>
                                <span className="font-bold">{username}</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Users List */}
                            <div className="md:col-span-1">
                                <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700">
                                    <h3 className="font-bold text-green-400 mb-2">Online Users ({users.length})</h3>
                                    <div className="max-h-96 overflow-y-auto">
                                        {users.map((user, index) => (
                                            <div key={index} className="flex items-center mb-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                                <p className="text-gray-300">
                                                    {user.username} 
                                                    {user.username === username && <span className="text-blue-400 text-xs ml-1">(you)</span>}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div className="md:col-span-3 flex flex-col">
                                <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700 h-96 overflow-y-auto flex flex-col">
                                    <div className="flex-grow">
                                        {messages.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                                <p>No messages yet. Start the conversation!</p>
                                            </div>
                                        ) : (
                                            messages.map((msg, index) => (
                                                <motion.div 
                                                    key={index}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`mb-3 ${msg.username === username ? 'text-right' : 'flex'}`}
                                                >
                                                    {msg.username !== username && (
                                                        <div className={`w-8 h-8 rounded-full ${msg.avatarColor || 'bg-gray-600'} flex-shrink-0 flex items-center justify-center mr-2 text-sm font-bold`}>
                                                            {msg.username.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className={`inline-block rounded-lg px-4 py-2 max-w-3/4 break-words shadow-sm
                                                        ${msg.username === username ? 
                                                            'bg-blue-600 text-white' : 
                                                            'bg-gray-700 text-gray-200'}`}
                                                    >
                                                        {msg.username !== username && (
                                                            <div className="font-bold text-sm text-blue-400 mb-1">{msg.username}</div>
                                                        )}
                                                        <div>{msg.message}</div>
                                                        <div className="text-xs text-gray-400 mt-1 text-right">{msg.time}</div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                    
                                    {typingUsers.length > 0 && (
                                        <div className="text-sm text-gray-400 italic mt-2 flex items-center">
                                            <div className="flex space-x-1 mr-2">
                                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "0ms"}}></div>
                                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "150ms"}}></div>
                                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "300ms"}}></div>
                                            </div>
                                            {typingUsers.length === 1 
                                                ? `${typingUsers[0]} is typing...` 
                                                : `${typingUsers.join(", ")} are typing...`}
                                        </div>
                                    )}
                                </div>

                                {/* Message Input */}
                                <form onSubmit={sendMessage} className="flex mt-3">
                                    <input
                                        ref={messageInputRef}
                                        type="text"
                                        placeholder="Type a message..."
                                        className="flex-grow p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        value={message}
                                        onChange={handleTyping}
                                        onKeyDown={handleKeyDown}
                                    />
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="submit"
                                        className="ml-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-lg flex items-center justify-center"
                                        disabled={!message.trim()}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    </motion.button>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}