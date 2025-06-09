const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const config = require("./config");

const userController = require("./controllers/userController");
const donationController = require("./controllers/donationController");
const auth = require("./middleware/auth");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || config.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.post("/registry", userController.register);
app.post("/login", userController.login);
app.get("/user", auth, userController.getUser);
app.get("/user/balance", auth, userController.getBalance);

app.post("/addProposal", auth, donationController.addProposal);
app.get("/proposal/:id", auth, donationController.getProposal);
app.get("/proposals", auth, donationController.getProposals);
app.post("/proposal/:id/vote", auth, donationController.vote);
app.post("/proposal/:id/donation", auth, donationController.donate);
app.get("/proposal/:id/withdraw", auth, donationController.withdraw);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
