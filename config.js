require("dotenv").config();

const config = {
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/vo-donate",
  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key",
  PORT: process.env.PORT || 3001,

  // Smart Contract Addresses
  REGISTRY_ADDRESS: "0x55Fa45f5D488abe283D47a1196dB19f7bAF46CDD",
  FACTORY_ADDRESS: "0x042F8B0028723EB74829a52e244ffd7f4e636edf",

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
