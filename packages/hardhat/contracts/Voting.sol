pragma solidity >0.8.0;

contract Voting {
  string[] public names;

  mapping(address => uint) public voters;
  mapping(string => uint) public proposals;

  constructor(string[] memory proposalNames) {
    names = proposalNames;

    for (uint i = 0; i < names.length; i++) {
      proposals[names[i]] = 0;
    }
  }

  function vote(string calldata proposal) external {
    require(voters[msg.sender] == 0, "Already voted.");

    voters[msg.sender] = 1;
    proposals[proposal] += 1;
  }

  function winnerName() external view returns (string memory winningProposal_) {
    uint winningVoteCount = 0;
    for (uint i = 0; i < names.length; i++) {
      if (proposals[names[i]] > winningVoteCount) {
        winningVoteCount = proposals[names[i]];
        winningProposal_ = names[i];
      }
    }
  }

  function votesOf(string calldata name) external view returns (uint) {
    return proposals[name];
  }
}
