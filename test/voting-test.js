const Voting = artifacts.require("Voting");

contract("Voting", (accounts) => {
  let votingInstance;

  before(async () => {
    votingInstance = await Voting.deployed();
  });

  it("allows a voter to cast a vote", async () => {
    await votingInstance.vote(1, { from: accounts[0] });
    let voters = await votingInstance.getVoters();
    assert.equal(
      voters[1],
      accounts[0],
      "The voter's address should be recorded."
    );
  });

  it("prevents invalid candidate IDs", async () => {
    try {
      await votingInstance.vote(16, { from: accounts[1] });
      assert.fail("The vote should have thrown an error");
    } catch (err) {
      assert.include(
        err.message,
        "revert",
        "The error message should contain 'revert'"
      );
    }
  });

  it("prevents double voting", async () => {
    try {
      await votingInstance.vote(2, { from: accounts[0] });
      assert.fail("The vote should have thrown an error");
    } catch (err) {
      assert.include(
        err.message,
        "You have already voted.",
        "The error message should contain 'You have already voted.'"
      );
    }
  });

  it("returns the correct number of votes for a candidate", async () => {
    let voteCount = await votingInstance.getVotes(1);
    assert.equal(voteCount, 1, "Candidate should have one vote.");
  });
});
