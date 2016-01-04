/* process.js
 * Eli Shayer
 * -----------
 * Process the JSON data provided by TruMedia to produce the desired information
 */

// ------------------------------------ UTILITY
// determine whether a pitch should be skipped
isSkipPitch = function(pitch) {
	for (var i = 0; i < SKIP_PITCHES.length; i++) {
		if (SKIP_PITCHES[i] === pitch[I.PITCH_TYPE]) {
			return true;
		}
	}
	return false;
}

// a general contains for an array holding primative elements
contains = function(arr, elem) {
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] === elem) {
			return true;
		}
	}
	return false;
}

// ------------------------------------ CONSTANTS
// sentinel for data not found
var SENTINEL = -1;

// relevant indices in the array
var I = {
	YEAR        : 0,
	HOME        : 1,
	VISITOR     : 2,
	INNING      : 3,
	SIDE        : 4,
	PITCHER     : 5,
	PITCHER_HAND: 6,
	PITCH_TYPE  : 7,
	BATTER_HAND : 8,
	BALLS       : 9,
	STRIKES     : 10,
	OUTS        : 11,
	FIRST_BASE  : 12,
	SECOND_BASE : 13,
	THIRD_BASE  : 14,
	PA_RESULT   : 15,
}

// pitches to skip
var SKIP_PITCHES = [ 'PO', 'IN', 'AB', 'AS', 'UN' ];

// ------------------------------------ PROCESS
// initialize empty objects for teams and pitchers
// pitchers separate in case of players switching teams during the season
var teams = {};
var pitchers = {};

// initialize to no previous pitch
var prevPitchType = '';

processData = function(data) {
	// for each pitch add the team to the teams array
	data.forEach(function(pitch) {
		if (!isSkipPitch(pitch)) {
			// add new teams to the teams object
			[ pitch[I.HOME], pitch[I.VISITOR] ].forEach(function(team) {
				if (!teams.hasOwnProperty(team)) {
					teams[team] = {};
					[ '2013', '2014', '2015' ].forEach(function(year) {
						teams[team][year] = {
							pitchers: []
						}
					});
				}
			});

			// add new pitchers to the object and append to team list
			if (!pitchers.hasOwnProperty(pitch[I.PITCHER])) {
				// add to the pitchers object
				pitchers[pitch[I.PITCHER]] = {};
				[ '2013', '2014', '2015' ].forEach(function(year) {
					pitchers[pitch[I.PITCHER]][year] = {
						hand   : pitch[I.PITCHER_HAND],
						pitches: {}
					}
				});
			}

			// append to the team list if new for the team-year combination
			var pitcherTeam = pitch[I.SIDE] === 'T' ? pitch[I.HOME] : pitch[I.VISITOR];
			if (!contains(teams[pitcherTeam][pitch[I.YEAR]].pitchers, pitch[I.PITCHER])) {
				teams[pitcherTeam][pitch[I.YEAR]].pitchers.push(pitch[I.PITCHER]);
			}

			// if a new pitch, add a new key and initialize the array
			if (!pitchers[pitch[I.PITCHER]][pitch[I.YEAR]].pitches.hasOwnProperty(pitch[I.PITCH_TYPE])) {
				pitchers[pitch[I.PITCHER]][pitch[I.YEAR]].pitches[pitch[I.PITCH_TYPE]] = [];
			}

			// add to the pitches array
			pitchers[pitch[I.PITCHER]][pitch[I.YEAR]].pitches[pitch[I.PITCH_TYPE]].push({
				inning: pitch[I.INNING],
				count : maps.count[pitch[I.BALLS]][pitch[I.STRIKES]],
				bases: maps.bases[pitch[I.FIRST_BASE] * 1][pitch[I.SECOND_BASE] * 1][pitch[I.THIRD_BASE] * 1],
				out: maps.out[pitch[I.OUTS]],
				'batter-hand': maps['batter-hand'][pitch[I.BATTER_HAND]],
				'previous-pitch': maps['previous-pitch'][prevPitchType]
			});

			// update the previous pitch, but only if it is not the first of a PA
			prevPitchType = (pitch[I.PA_RESULT].length === 0 ? pitch[I.PITCH_TYPE] : null);
		}
	});
}
