pragma solidity >=0.6.0 <0.7.0;

import "hardhat/console.sol";
import "./ExampleExternalContract.sol"; //https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol

contract Staker {

  ExampleExternalContract public exampleExternalContract;

  uint256 public deadline;
  uint256 public threshold;

  mapping(address => uint256) balances;

  event Stake(address, uint256);

  constructor(address exampleExternalContractAddress, uint256 target, uint256 thresholdAmount) public {
    exampleExternalContract = ExampleExternalContract(exampleExternalContractAddress);
    deadline = target;
    threshold = thresholdAmount;
  }

  // Collect funds in a payable `stake()` function and track individual `balances` with a mapping:
  //  ( make sure to add a `Stake(address,uint256)` event and emit it for the frontend <List/> display )
  function stake() external payable {
    uint256 amountStaked = msg.value;
    balances[msg.sender] += amountStaked;
    emit Stake(msg.sender, amountStaked);
  }

  // After some `deadline` allow anyone to call an `execute()` function
  //  It should either call `exampleExternalContract.complete{value: address(this).balance}()` to send all the value
  function execute() external {
    require(timeLeft() == 0, "Deadline has not passed yet");
    require(address(this).balance > threshold, "Threshold was not, users should withdraw their funds");
    exampleExternalContract.complete{value: address(this).balance}();
  }

  function stakedAmountOf(address who) public view returns (uint256) {
    return balances[who];
  }

  // if the `threshold` was not met, allow everyone to call a `withdraw()` function
  function withdraw() public {
    require(timeLeft() == 0, "Time is still left");
    require(address(this).balance < threshold, "Staked amount is greater than threshold, cannot withdraw, its locked now!");

    uint256 toReturn = stakedAmountOf(msg.sender);
    (bool sent, ) = msg.sender.call{value: toReturn}("");
    require(sent, "Failed to withraw Ether");
  }

  // Add a `timeLeft()` view function that returns the time left before the deadline for the frontend
  function timeLeft() public view returns (uint256) {
    if (now >= deadline) return 0;
    else return deadline - now;
  }
}
