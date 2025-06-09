const mongoose = require("mongoose");

const donationProposalSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      ref: "User",
    },
    contract_address: {
      type: String,
      required: true,
      unique: true,
    },
    start_time: {
      type: Date,
      default: Date.now,
    },
    vote_end_time: {
      type: Date,
      required: true,
    },
    donationDurationInMinutes: {
      type: Number,
      required: true,
      default: 0,
    },
    donation_end_time: {
      type: Date,
      required: true,
    },
    voted_users: [
      {
        user_id: {
          type: String,
          required: true,
        },
        yes: {
          type: Boolean,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DonationProposal", donationProposalSchema);
