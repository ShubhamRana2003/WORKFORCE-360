const express = require('express');
const cors = require('cors');
require('dotenv').config();        // ✅ load .env BEFORE using it
const connectDB = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ call with process.env.MONGO_URI
connectDB(process.env.MONGO_URI);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server started on ' + PORT));
