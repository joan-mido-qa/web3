import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Voting Contract", function () {
  async function deployVotingFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const hardhatToken = await ethers.deployContract("Voting", [["Option 0", "Option 1"]]);

    await hardhatToken.waitForDeployment();

    return { hardhatToken, owner, addr1, addr2 };
  }
  describe("Deployment", function () {
    it("Should assign 0 votes to each Proposal", async function () {
      const { hardhatToken } = await loadFixture(deployVotingFixture);

      expect(await hardhatToken.votesOf("Option 0")).to.equal(0);
      expect(await hardhatToken.votesOf("Option 1")).to.equal(0);
    });
  });
  describe("Vote", function () {
    it("Should fail if sender already voted", async function () {
      const { hardhatToken } = await loadFixture(deployVotingFixture);

      await hardhatToken.vote("Option 0");

      await expect(hardhatToken.vote("Option 0")).to.be.revertedWith("Already voted.");
    });
    it("Should increase proposale votes", async function () {
      const { hardhatToken } = await loadFixture(deployVotingFixture);

      await hardhatToken.vote("Option 1");

      expect(await hardhatToken.votesOf("Option 1")).to.equal(1);
    });
  });
  describe("Result", function () {
    it("Should return the winner name", async function () {
      const { hardhatToken, addr1, addr2 } = await loadFixture(deployVotingFixture);

      await hardhatToken.vote("Option 1");
      await hardhatToken.connect(addr1).vote("Option 1");
      await hardhatToken.connect(addr2).vote("Option 0");

      expect(await hardhatToken.winnerName()).to.equal("Option 1");
    });
  });
});
