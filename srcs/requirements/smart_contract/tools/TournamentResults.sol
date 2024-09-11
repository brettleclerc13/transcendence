// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract TournamentResults {

	struct MatchResult {
		uint256	timestamp;
		string	player_1_name;
		address	player_1_address;
		uint256	player_1_score;
		string	player_2_name;
		address	player_2_address;
		uint256	player_2_score;
	}

	mapping(uint256 => MatchResult) private matchResults;
	uint256 private matchCount;

	function addMatchResult(string memory _player_1_name
				, address _player_1_address, uint256 _player_1_score
				, string memory _player_2_name, address _player_2_address
				, uint256 _player_2_score) public returns (uint256) {
		matchResults[matchCount] = MatchResult(block.timestamp, _player_1_name
				, _player_1_address, _player_1_score, _player_2_name
				, _player_2_address, _player_2_score);

		matchCount++;

		return matchCount;
	}

	function getMatchResult(uint256 _matchId) public view returns (MatchResult memory) {
		return matchResults[_matchId];
	}

}
