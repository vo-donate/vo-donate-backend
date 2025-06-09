const User = require("../models/User");
const ethers = require("ethers");
const config = require("../config");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { id, password, name, introduction } = req.body;

    // Create new wallet
    const wallet = ethers.Wallet.createRandom();
    const walletAddress = wallet.address;
    const privateKey = wallet.privateKey;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ _id: id }, { wallet_address: walletAddress }],
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = new User({
      _id: id,
      password: password,
      name,
      wallet_address: walletAddress,
      private_key: privateKey,
      introduction,
    });

    await user.save();

    // Register user in MemberRegistry contract
    const provider = new ethers.JsonRpcProvider(config.RPC_URL);
    const adminWallet = new ethers.Wallet(config.PRIVATE_KEY, provider);
    const registryContract = new ethers.Contract(
      config.REGISTRY_ADDRESS,
      config.REGISTRY_ABI,
      adminWallet
    );

    const tx = await registryContract.register(user.wallet_address);
    await tx.wait();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { id, password } = req.body;
    const user = await User.findOne({ _id: id });

    if (!user) {
      return res.status(401).json({ message: "Invalid user" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { _id: user._id, wallet_address: user.wallet_address },
      config.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      name: user.name,
      wallet_address: user.wallet_address,
      introduction: user.introduction,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const provider = new ethers.JsonRpcProvider(config.RPC_URL);
    const balance = await provider.getBalance(user.wallet_address);

    res.json({
      wallet_address: user.wallet_address,
      balance: balance.toString(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
