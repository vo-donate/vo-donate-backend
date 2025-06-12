require("dotenv").config();

const config = {
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/vo-donate",
  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key",
  PORT: process.env.PORT || 3001,

  // Smart Contract Addresses
  REGISTRY_ADDRESS: "0xce5898E5dFA1409EB6944Ce49523bF664DfA9CAc",
  FACTORY_ADDRESS: "0xf2dB2F9BBe052cB6bD79b65e6a7C8eb9379f5A80",

  // RPC Configuration
  RPC_URL: "https://public-en-kairos.node.kaia.io",
  PRIVATE_KEY: process.env.PRIVATE_KEY,

  // Contract ABIs
  REGISTRY_ABI: require("./abis/MemberRegistry.json"),
  FACTORY_ABI: require("./abis/DonationProposalFactory.json"),
  PROPOSAL_ABI: require("./abis/DonationProposal.json"),
};

BigInt.prototype.toJSON = function () {
  return this.toString();
};

module.exports = config;
