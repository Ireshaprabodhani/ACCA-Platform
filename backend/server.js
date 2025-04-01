require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("./src/models/db");
const adminRoutes = require("./src/routes/adminRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
