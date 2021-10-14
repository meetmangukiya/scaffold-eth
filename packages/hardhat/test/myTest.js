const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("DeStaking", function () {
  let myContract;
  let myExternalContract;
  let deadlineInPastContract;
  let deadlineInFutureContract;

  describe("Staker", function () {
    let owner, addr1, addr2;

    beforeEach(async () => {
      [owner, addr1, addr2] = await ethers.getSigners();
      const ExampleExternalContract = await ethers.getContractFactory(
        "ExampleExternalContract"
      );
      myExternalContract = await ExampleExternalContract.deploy();

      const now = Math.ceil(new Date().getTime() / 1000);
      const dayInSeconds = 24 * 60 * 60;
      // 1 day from now
      const futureDeadline = now + dayInSeconds;
      // a day before now
      const pastDeadline = now - dayInSeconds;
      // max i can use without overflow :(
      const threshold = 10 ** 14;

      const Staker = await ethers.getContractFactory("Staker");

      deadlineInFutureContract = await Staker.deploy(
        myExternalContract.address,
        futureDeadline,
        threshold
      );
      deadlineInPastContract = await Staker.deploy(
        myExternalContract.address,
        pastDeadline,
        threshold
      );
    });

    describe("#stake", () => {
      it("Should accept stakes until deadline has passed", async () => {
        await deadlineInFutureContract
          .connect(owner)
          .stake({ value: 10 ** 10 });

        expect(
          await deadlineInFutureContract.stakedAmountOf(owner.address)
        ).to.eq(10 ** 10);
      });

      it("Should reject stakes after deadline has passed", async () => {
        try {
          await deadlineInPastContract
            .connect(owner)
            .stake({ value: 10 ** 10 });
        } catch (err) {
          return;
        }
        throw new Error("it should fail!");
      });
    });

    describe("#withdraw", () => {
      it("shouldn't allow withdraw before deadline has passed", async () => {
        try {
          await deadlineInFutureContract.connect(owner).withdraw();
        } catch (err) {
          return;
        }
        throw new Error("it should fail!");
      });

      it("should allow withdraw after deadline has passed", async () => {
        await deadlineInPastContract.connect(owner).withdraw();
      });

      it("should not allow withdraw if threshold has passed", async () => {
        await owner.sendTransaction({
          to: deadlineInPastContract.address,
          value: 10 ** 15,
        });
        try {
          await deadlineInPastContract.connect(owner).withdraw();
        } catch (err) {
          return;
        }
        throw new Error("it should fail!");
      });
    });

    describe("#execute", () => {
      it("should not execute if time is still left", async () => {
        try {
          await deadlineInFutureContract.connect(owner).execute();
        } catch (err) {
          return;
        }
        throw new Error("it should fail");
      });

      it("should execute if time has passed and threshold has met", async () => {
        await owner.sendTransaction({
          to: deadlineInPastContract.address,
          value: 10 ** 15,
        });
        expect(await myExternalContract.completed()).to.be.false;
        await deadlineInPastContract.connect(owner).execute();
        expect(await myExternalContract.completed()).to.be.true;
      });

      it("should not execute if time has passed and threshold is not met", async () => {
        expect(await myExternalContract.completed()).to.be.false;
        try {
          await deadlineInPastContract.connect(owner).execute();
        } catch (err) {
          return;
        }
        throw new Error("it should fail");
      });
    });
  });
});
