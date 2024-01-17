App = {
  web3Provider: null,
  contracts: {},

  init: async function () {
    // Load candidates.
    $.getJSON("../candidates.json", function (data) {
      var petsRow = $("#petsRow");
      var candidateTemplate = $("#candidateTemplate");

      //create new object kat website
      for (i = 0; i < data.length; i++) {
        candidateTemplate.find(".panel-title").text(data[i].name);
        candidateTemplate.find("img").attr("src", data[i].picture);
        candidateTemplate.find(".candidate-course").text(data[i].course);
        candidateTemplate.find(".candidate-age").text(data[i].age);

        candidateTemplate.find(".btn-adopt").attr("data-id", data[i].id);

        petsRow.append(candidateTemplate.html());
      }
    });

    return await App.initWeb3();
  },

  initWeb3: async function () {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access");
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://localhost:7545"
      );
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function () {
    $.getJSON("Voting.json", function (data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      var VotingArtifact = data;
      App.contracts.Voting = TruffleContract(VotingArtifact);

      // Set the provider for our contract
      App.contracts.Voting.setProvider(App.web3Provider);

      // Use our contract to retrieve and mark the adopted pets
      return App.markVoted();
    });

    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on("click", ".btn-adopt", App.handleVote);
  },

  markVoted: function () {
    var votingInstance;

    App.contracts.Voting.deployed()
      .then(function (instance) {
        votingInstance = instance;

        return votingInstance.getVoters.call();
      })
      .then(function (voters) {
        web3.eth.getAccounts(function (error, accounts) {
          if (error) {
            console.log(error);
          }

          var account = accounts[0];

          for (i = 0; i < voters.length; i++) {
            if (voters[i] === account) {
              $(".btn-adopt").text("Voted").attr("disabled", true);
              break;
            }
          }
        });
      })
      .catch(function (err) {
        console.log(err.message);
      });
  },

  handleVote: function (event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data("id"));

    var votingInstance;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Voting.deployed()
        .then(function (instance) {
          votingInstance = instance;

          // Check if the account has already voted
          return votingInstance.voters(petId);
        })
        .then(function (votedAddress) {
          if (votedAddress === account) {
            alert("You have already voted.");
            return;
          }

          // Execute vote as a transaction by sending account
          return votingInstance.vote(petId, { from: account });
        })
        .then(function (result) {
          return App.markVoted();
        })
        .catch(function (err) {
          console.log(err.message);
        });
    });
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
