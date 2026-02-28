const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// CRITICAL: Ensure models are registered with Mongoose BEFORE routes use them
if (!mongoose.models.Achievement) {
  require("./models/Achievement");
}
if (!mongoose.models.Child) {
  require("./models/Child");
}
if (!mongoose.models.User) {
  require("./models/User");
}

const app = express();
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Make io accessible to our routers
app.set("io", io);

io.on("connection", (socket) => {
  console.log("New client connected to WebSockets:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.use(cors());
app.use(express.json());

// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const testRoutes = require("./routes/testRoutes");
app.use("/api/test", testRoutes);

const aiRoutes = require("./routes/aiRoutes");
app.use("/api/ai", aiRoutes);

const childRoutes = require("./routes/childRoutes");
app.use("/api/children", childRoutes);

const donationRoutes = require("./routes/donationRoutes");
app.use("/api/donations", donationRoutes);

const medicalRoutes = require("./routes/medicalRoutes");
app.use("/api/medical", medicalRoutes);

const opportunityRoutes = require("./routes/opportunityRoutes");
app.use("/api/opportunities", opportunityRoutes);

const schemeRoutes = require("./routes/schemeRoutes");
app.use("/api/schemes", schemeRoutes);

const paymentRoutes = require("./routes/paymentRoutes");
app.use("/api/payment", paymentRoutes);

const uploadRoutes = require("./routes/uploadRoutes");
app.use("/api/upload", uploadRoutes);


app.get("/", (req, res) => {
  res.send("API Running...");
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Address:', server.address());
});

