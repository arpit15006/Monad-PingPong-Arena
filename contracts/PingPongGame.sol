// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract PingPongGame {
    address public owner;
    uint256 public gameIdCounter;

    constructor() {
        owner = msg.sender;
    }

    struct Game {
        address player1;
        address player2;
        uint256 stake;
        address winner;
        bool isFinished;
        bool isCancelled;
    }

    struct MatchResult {
        uint256 gameId;
        address player1;
        address player2;
        address winner;
        uint256 stake;
        uint256 timestamp;
    }

    struct PlayerStats {
        uint256 gamesPlayed;
        uint256 gamesWon;
    }

    mapping(uint256 => Game) public games;
    mapping(address => PlayerStats) public playerStats;
    MatchResult[] public matchHistory;
    address[] public players;

    event GameCreated(uint256 indexed gameId, address indexed player1, address indexed player2, uint256 stake);
    event GameJoined(uint256 indexed gameId, address indexed player2);
    event GameCancelled(uint256 indexed gameId, address indexed player1);
    event GameFinished(uint256 indexed gameId, address indexed winner);
    event MatchRecorded(
        uint256 indexed gameId,
        address indexed player1,
        address indexed player2,
        address winner,
        uint256 stake,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // Add ReentrancyGuard
    bool private locked;
    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    function createMatch(address opponent) external payable nonReentrant {
        require(msg.sender != opponent, "Cannot challenge yourself");
        require(msg.value > 0, "Stake must be greater than 0");
        require(opponent != address(0), "Invalid opponent address");

        uint256 gameId = gameIdCounter++;
        games[gameId] = Game({
            player1: msg.sender,
            player2: opponent,
            stake: msg.value,
            winner: address(0),
            isFinished: false,
            isCancelled: false
        });

        _addPlayerIfNew(msg.sender);
        _addPlayerIfNew(opponent);

        emit GameCreated(gameId, msg.sender, opponent, msg.value);
    }

    function joinMatch(uint256 gameId) external payable nonReentrant {
        Game storage game = games[gameId];
        require(game.player1 != address(0), "Game not found");
        require(msg.sender == game.player2, "Not the intended opponent");
        require(!game.isFinished && !game.isCancelled, "Game not active");
        require(msg.value == game.stake, "Stake mismatch");
        require(address(this).balance >= game.stake * 2, "Invalid game state");

        emit GameJoined(gameId, msg.sender);
    }

    function cancelMatch(uint256 gameId) external nonReentrant {
        Game storage game = games[gameId];
        require(msg.sender == game.player1, "Only creator can cancel");
        require(!game.isFinished && !game.isCancelled, "Game already processed");

        game.isCancelled = true;
        
        // Use call instead of transfer
        (bool success, ) = payable(game.player1).call{value: game.stake}("");
        require(success, "Transfer failed");

        emit GameCancelled(gameId, msg.sender);
    }

    function reportMatchResult(uint256 gameId, address winner) external nonReentrant onlyOwner {
        Game storage game = games[gameId];
        require(!game.isFinished && !game.isCancelled, "Game already resolved");
        require(winner == game.player1 || winner == game.player2, "Invalid winner");
        require(address(this).balance >= game.stake * 2, "Insufficient contract balance");

        game.winner = winner;
        game.isFinished = true;

        // Update stats
        playerStats[game.player1].gamesPlayed++;
        playerStats[game.player2].gamesPlayed++;
        playerStats[winner].gamesWon++;

        // Record match result
        matchHistory.push(MatchResult({
            gameId: gameId,
            player1: game.player1,
            player2: game.player2,
            winner: winner,
            stake: game.stake,
            timestamp: block.timestamp
        }));

        emit GameFinished(gameId, winner);
        emit MatchRecorded(gameId, game.player1, game.player2, winner, game.stake, block.timestamp);

        // Use call instead of transfer
        (bool success, ) = payable(winner).call{value: game.stake * 2}("");
        require(success, "Transfer failed");
    }

    function getMatchHistoryLength() external view returns (uint256) {
        return matchHistory.length;
    }

    function getMatchResult(uint256 index) external view returns (MatchResult memory) {
        require(index < matchHistory.length, "Invalid index");
        return matchHistory[index];
    }

    function getGame(uint256 gameId) external view returns (Game memory) {
        return games[gameId];
    }

    function getPlayerStats(address player) external view returns (uint256 played, uint256 won) {
        PlayerStats memory stats = playerStats[player];
        return (stats.gamesPlayed, stats.gamesWon);
    }

    function getTopPlayers() external view returns (address[] memory topAddresses) {
        uint256 len = players.length;
        address[] memory sorted = players;

        // basic bubble sort (for hackathon simplicity)
        for (uint i = 0; i < len; i++) {
            for (uint j = 0; j < len - 1; j++) {
                if (playerStats[sorted[j]].gamesWon < playerStats[sorted[j + 1]].gamesWon) {
                    address temp = sorted[j];
                    sorted[j] = sorted[j + 1];
                    sorted[j + 1] = temp;
                }
            }
        }

        // Return top 10 (or fewer if not enough players)
        uint256 topCount = len > 10 ? 10 : len;
        address[] memory top10 = new address[](topCount);
        for (uint i = 0; i < topCount; i++) {
            top10[i] = sorted[i];
        }
        return top10;
    }

    function _addPlayerIfNew(address player) internal {
        if (playerStats[player].gamesPlayed == 0 && playerStats[player].gamesWon == 0) {
            players.push(player);
        }
    }

    function withdraw() external nonReentrant onlyOwner {
        (bool success, ) = payable(owner).call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }

    receive() external payable {}
}
