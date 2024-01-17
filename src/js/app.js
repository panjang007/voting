App = {
  web3Provider: null,
  contracts: {},

  init: async function () {
    return await App.initWeb3();
  },

  initWeb3: async function () {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        await window.ethereum.enable();
      } catch (error) {
        console.error("User denied account access");
      }
    } else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    } else {
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://localhost:7545"
      );
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function () {
    $.getJSON("Voting.json", function (data) {
      var VotingArtifact = data;
      App.contracts.Voting = TruffleContract(VotingArtifact);
      App.contracts.Voting.setProvider(App.web3Provider);

      if (window.location.pathname.includes("viewVotes.html")) {
        App.loadVoteCounts();
      } else {
        App.loadCandidates();
      }
    });

    return App.bindEvents();
  },

  loadCandidates: function () {
    var petsRow = $("#petsRow");
    var candidateTemplate = $("#candidateTemplate");

    $.getJSON("../candidates.json", function (data) {
      for (let i = 0; i < data.length; i++) {
        candidateTemplate.find(".panel-title").text(data[i].name);
        candidateTemplate.find("img").attr("src", data[i].picture);
        candidateTemplate.find(".candidate-course").text(data[i].course);
        candidateTemplate.find(".candidate-age").text(data[i].age);
        candidateTemplate.find(".btn-adopt").attr("data-id", data[i].id);
        candidateTemplate
          .find(".candidate-vote-count")
          .html(
            'Votes: <span class="candidate-' + data[i].id + '-votes">0</span>'
          );

        petsRow.append(candidateTemplate.html());
      }
    }).then(function () {
      App.updateVoteCounts();
    });
  },

  loadVoteCounts: function () {
    var candidatesRow = $("#candidatesRow");
    var candidateTemplate = $("#candidateTemplate");

    $.getJSON("../candidates.json", function (data) {
      for (let i = 0; i < data.length; i++) {
        candidateTemplate.find(".panel-title").text(data[i].name);
        candidateTemplate.find("img").attr("src", data[i].picture);
        candidateTemplate.find(".candidate-course").text(data[i].course);
        candidateTemplate.find(".candidate-age").text(data[i].age);
        candidateTemplate
          .find(".candidate-vote-count")
          .html(
            'Votes: <span class="candidate-' + data[i].id + '-votes">0</span>'
          );

        candidatesRow.append(candidateTemplate.html());
      }
    }).then(function () {
      App.updateVoteCounts();
    });
  },

  updateVoteCounts: function () {
    var votingInstance;

    App.contracts.Voting.deployed()
      .then(function (instance) {
        votingInstance = instance;

        for (let i = 0; i < 16; i++) {
          votingInstance
            .getVotes(i)
            .then(function (votes) {
              $(".candidate-" + i + "-votes").text(votes.toString());
            })
            .catch(function (err) {
              console.log(err.message);
            });
        }
      })
      .catch(function (err) {
        console.log(err.message);
      });
  },
  bindEvents: function () {
    $(document).on("click", ".btn-adopt", App.handleVote);
  },

  handleVote: function (event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data("id"));

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Voting.deployed()
        .then(function (instance) {
          votingInstance = instance;
          return votingInstance.vote(petId, { from: account });
        })
        .then(function (result) {
          App.markVoted(account);
        })
        .catch(function (err) {
          console.log(err.message);
        });
    });
  },

  markVoted: function (account) {
    var votingInstance;

    App.contracts.Voting.deployed()
      .then(function (instance) {
        votingInstance = instance;

        return votingInstance.getVoters.call();
      })
      .then(function (voters) {
        if (voters.includes(account)) {
          $(".btn-adopt[data-id]").each(function () {
            $(this).text("Voted").attr("disabled", true);
          });
          $("#viewResultsButton").show();
        }
        App.updateVoteCounts();
      })
      .catch(function (err) {
        console.log(err.message);
      });
  },

  checkIfVoted: function () {
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

          if (voters.includes(account)) {
            $(".btn-adopt[data-id]").each(function () {
              $(this).text("Voted").attr("disabled", true);
            });
            $("#viewResultsButton").show();
          }
        });
      })
      .catch(function (err) {
        console.log(err.message);
      });
  },
};

$(function () {
  $(window).load(function () {
    App.init().then(function () {
      App.checkIfVoted(); // Check if the current user has voted when the page loads
    });
  });
});
