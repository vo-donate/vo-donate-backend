const DonationProposal = require("../models/DonationProposal");
const ethers = require("ethers");
const config = require("../config");
const User = require("../models/User");
const moment = require("moment-timezone");

exports.addProposal = async (req, res) => {
  try {
    const { proposalText, voteDurationInMinutes, donationDurationInMinutes } =
      req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const provider = new ethers.JsonRpcProvider(config.RPC_URL);
    const wallet = new ethers.Wallet(user.private_key, provider);
    const factoryContract = new ethers.Contract(
      config.FACTORY_ADDRESS,
      config.FACTORY_ABI,
      wallet
    );

    // Create new proposal and get receipt
    const tx = await factoryContract.createProposal(
      proposalText,
      voteDurationInMinutes,
      donationDurationInMinutes
    );
    const receipt = await tx.wait();
    const iface = new ethers.Interface(config.FACTORY_ABI);

    let proposalAddress = null;

    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed.name === "ProposalCreated") {
          proposalAddress = parsed.args.proposalAddress || parsed.args[0];
          break;
        }
      } catch (err) {
        console.log("Failed to parse log:", log);
        continue;
      }
    }

    if (!proposalAddress) {
      throw new Error("ProposalCreated event not found in logs");
    }

    const voteEndTime = moment()
      .utcOffset(9)
      .add(voteDurationInMinutes, "minutes")
      .format("YYYY-MM-DD HH:mm:ss");
    const donationEndTime = moment(voteEndTime)
      .utcOffset(9)
      .add(donationDurationInMinutes, "minutes")
      .format("YYYY-MM-DD HH:mm:ss");
    console.log(voteEndTime, donationEndTime);
    // Save to database
    const proposal = new DonationProposal({
      user_id: req.user._id,
      contract_address: proposalAddress,
      vote_end_time: voteEndTime,
      donationDurationInMinutes,
      donation_end_time: donationEndTime,
    });
    await proposal.save();

    const now = moment().utcOffset(9).toDate();
    const timeDiff = proposal.vote_end_time - now;

    if (timeDiff <= 0) {
      await finalizeVote(proposal.contract_address);
    } else {
      setTimeout(async () => {
        await finalizeVote(proposal.contract_address);
      }, timeDiff);
    }

    res.status(201).json({
      message: "Proposal created successfully",
      proposalId: proposal._id,
      proposalContractAddress: proposalAddress,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProposals = async (req, res) => {
  try {
    const proposals = await DonationProposal.find(
      {},
      {
        _id: 1,
        user_id: 1,
        contract_address: 1,
        vote_end_time: 1,
        donationDurationInMinutes: 1,
        donation_end_time: 1,
      }
    ).sort({ vote_end_time: 1 });

    const formattedProposals = proposals.map((proposal) => ({
      id: proposal._id.toString(),
      user_id: proposal.user_id,
      contract_address: proposal.contract_address,
      vote_end_time: moment(proposal.vote_end_time).format(
        "YYYY-MM-DD HH:mm:ss"
      ),
      donationDurationInMinutes: proposal.donationDurationInMinutes,
      donation_end_time: moment(proposal.donation_end_time).format(
        "YYYY-MM-DD HH:mm:ss"
      ),
    }));

    res.json(formattedProposals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const proposal = await DonationProposal.findById(id);

    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    const provider = new ethers.JsonRpcProvider(config.RPC_URL);
    const proposalContract = new ethers.Contract(
      proposal.contract_address,
      config.PROPOSAL_ABI,
      provider
    );

    const summary = await proposalContract.getSummary();

    res.json({
      id: proposal._id,
      proposer: summary[0],
      proposalText: summary[1],
      totalDonation: summary[2],
      finalized: summary[3],
      voteCount: summary[4],
      voterCount: summary[5],
      balance: summary[6],
      votePassed: summary[7],
      donationEndTime: summary[8],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.vote = async (req, res) => {
  try {
    const { id } = req.params;
    const { approve } = req.body;
    const proposal = await DonationProposal.findById(id);

    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    // Check if user has already voted
    const hasVoted = proposal.voted_users.some(
      (v) => v.user_id === req.user._id
    );
    if (hasVoted) {
      return res.status(400).json({ message: "User has already voted" });
    }
    const { private_key } = await User.findById(req.user._id).select(
      "private_key"
    );
    const provider = new ethers.JsonRpcProvider(config.RPC_URL);
    const userWallet = new ethers.Wallet(private_key, provider);
    const proposalContract = new ethers.Contract(
      proposal.contract_address,
      config.PROPOSAL_ABI,
      userWallet
    );

    // Check if user is registered
    const registryContract = new ethers.Contract(
      config.REGISTRY_ADDRESS,
      config.REGISTRY_ABI,
      provider
    );
    const isMember = await registryContract.isMember(userWallet.address);
    if (!isMember) {
      return res.status(403).json({ message: "User is not a member" });
    }

    // Check if voting period is still open
    if (new Date() > proposal.vote_end_time) {
      return res.status(403).json({ message: "Voting period has ended" });
    }

    // Vote with STAKE_AMOUNT (1000 wei)
    const tx = await proposalContract.vote(approve, {
      value: 1000n,
    });
    await tx.wait();

    // Update database
    proposal.voted_users.push({
      user_id: req.user._id,
      yes: approve,
    });
    await proposal.save();

    res.json({ message: "Vote successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.donate = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const proposal = await DonationProposal.findById(id);
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    const { private_key } = await User.findById(req.user._id).select(
      "private_key"
    );
    const provider = new ethers.JsonRpcProvider(config.RPC_URL);
    const userWallet = new ethers.Wallet(private_key, provider);

    const proposalContract = new ethers.Contract(
      proposal.contract_address,
      config.PROPOSAL_ABI,
      userWallet
    );

    const votePassed = await proposalContract.votePassed();
    const donationEndTime = await proposalContract.donationEndTime();
    const currentTime = Math.floor(Date.now() / 1000);

    if (!votePassed) {
      return res.status(403).json({ message: "Vote has not ended" });
    }

    console.log(currentTime);
    console.log(donationEndTime);
    console.log(Number(donationEndTime));
    if (currentTime > Number(donationEndTime)) {
      return res.status(403).json({ message: "Donation period has ended" });
    }

    const tx = await proposalContract.connect(userWallet).donate({
      value: BigInt(amount),
    });
    await tx.wait();

    res.json({ message: "Donation successful" });
  } catch (error) {
    if (error.message.includes("Proposal not passed")) {
      return res.status(403).json({ message: "Proposal not passed" });
    }
    console.error("Donation error:", error);
    res.status(500).json({ message: error.message });
  }
};

async function finalizeVote(contractAddress) {
  try {
    const provider = new ethers.JsonRpcProvider(config.RPC_URL);
    const proposalContract = new ethers.Contract(
      contractAddress,
      config.PROPOSAL_ABI,
      provider
    );

    // 투표가 이미 종료되었는지 확인
    const votePassed = await proposalContract.votePassed();
    if (!votePassed) {
      // 제안자 지갑 정보 가져오기
      const proposal = await DonationProposal.findOne({
        contract_address: contractAddress,
      });
      if (!proposal) {
        console.error("Proposal not found:", contractAddress);
        return;
      }

      const { private_key } = await User.findById(proposal.user_id).select(
        "private_key"
      );
      const wallet = new ethers.Wallet(private_key, provider);

      // finalizeVote 실행
      const proposalContractWithWallet = proposalContract.connect(wallet);
      await proposalContractWithWallet.finalizeVote();
      console.log("Vote finalized successfully for proposal:", contractAddress);
    }
  } catch (error) {
    console.error("Error finalizing vote:", error);
  }
}

exports.withdraw = async (req, res) => {
  try {
    const { id } = req.params;
    const proposal = await DonationProposal.findById(id);

    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    const { private_key } = await User.findById(req.user._id).select(
      "private_key"
    );

    const provider = new ethers.JsonRpcProvider(config.RPC_URL);
    const userWallet = new ethers.Wallet(private_key, provider);
    const proposalContract = new ethers.Contract(
      proposal.contract_address,
      config.PROPOSAL_ABI,
      userWallet
    );

    // Check if user is the proposer
    const proposer = await proposalContract.proposer();
    if (proposer !== userWallet.address) {
      return res.status(403).json({ message: "Only proposer can withdraw" });
    }

    // Check if donation period has ended
    const donationEndTime = await proposalContract.donationEndTime();
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime < donationEndTime) {
      return res.status(403).json({ message: "Donation period has not ended" });
    }

    // Withdraw funds
    const tx = await proposalContract.withdraw();
    await tx.wait();

    res.json({ message: "Withdrawal successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
