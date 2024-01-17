pragma solidity 0.5.16;

contract Voting {
    address[16] public voters;
    mapping(address => bool) hasVoted; // Track if an address has voted
    mapping(uint => uint) public votesReceived; // Track number of votes per candidate

    function vote(uint candidateId) public returns (uint) {
        require(candidateId >= 0 && candidateId <= 15);
        require(!hasVoted[msg.sender], "You have already voted."); // Check if the sender has already voted

        voters[candidateId] = msg.sender;
        hasVoted[msg.sender] = true; // Mark this address as having voted
        votesReceived[candidateId] += 1; // Increment vote count for the candidate

        return candidateId;
    }

    function getVoters() public view returns (address[16] memory) {
        return voters;
    }

    function getVotes(uint candidateId) public view returns (uint) {
        return votesReceived[candidateId];
    }
}
