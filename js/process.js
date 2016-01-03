/* process.js
 * Eli Shayer
 * -----------
 * Process the JSON data provided by TruMedia to produce the desired information
 */

// ------------------------------------ UTILITY FUNCTIONS
// get the index of a quantity of interest in the JSON data
// by iteratively searching the headers array
getIndexByLabel = function(label) {
	for (var i = 0; i < data.header.length; i++) {
		if (data.header[i].label === label) {
			return i;
		}
	}
	return SENTINEL;
}

// ------------------------------------ CONSTANTS
// sentinel for data not found
SENTINEL = -1;

// relevant indices in the array
I = {
	HOME        : getIndexByLabel('home'),
	VISITOR     : getIndexByLabel('visitor'),
	INNING      : getIndexByLabel('inning'),
	SIDE        : getIndexByLabel('side'),
	PITCHER     : getIndexByLabel('pitcher'),
	PITCHER_HAND: getIndexByLabel('pitcherHand'),
	PITCH_TYPE  : getIndexByLabel('pitchType'),
	BATTER_HAND : getIndexByLabel('batterHand'),
	BALLS       : getIndexByLabel('balls'),
	STRIKES     : getIndexByLabel('strikes'),
	OUTS        : getIndexByLabel('outs'),
	FIRST_BASE  : getIndexByLabel('manOnFirst'),
	SECOND_BASE : getIndexByLabel('manOnSecond'),
	THIRD_BASE  : getIndexByLabel('Third'),
}

// ------------------------------------ PROCESS
// initialize empty objects for teams and pitchers
// pitchers separate in case of players switching teams during the season
var teams = {};
var pitchers = {};

// for each pitch add the team to the teams array
data.rows.forEach(function(row) {
	// add new teams to the teams object
	[ row[I.HOME], row[I.VISITOR] ].forEach(function(team) {
		if (!teams.hasOwnProperty(team)) {
			teams[team] = { pitchers: [] }
		}
	});

	// add new pitchers to the object and append to team list
	if (!pitchers.hasOwnProperty(row[I.PITCHER])) {
		// add to the pitchers object
		pitchers[row[I.PITCHER]] = {
			hand   : row[I.PITCHER_HAND],
			pitches: {}
		}

		// append to the team list
		var pitcherTeam = row[I.SIDE] === 'T' ? row[I.HOME] : row[I.VISITOR];
		teams[pitcherTeam].pitchers.push(row[I.PITCHER]);
	}

	// if a new pitch, add a new key and initialize the array
	if (!pitchers[row[I.PITCHER]].pitches.hasOwnProperty(row[I.PITCH_TYPE])) {
		pitchers[row[I.PITCHER]].pitches[row[I.PITCH_TYPE]] = [];
	}

	// add to the pitches array
	pitchers[row[I.PITCHER]].pitches[row[I.PITCH_TYPE]].push({
		inning: row[I.INNING],
		count : maps.count[row[I.BALLS]][row[I.STRIKES]],
		bases: maps.bases[row[I.FIRST_BASE] * 1][row[I.SECOND_BASE] * 1][row[I.THIRD_BASE] * 1],
		out: maps.out[row[I.OUTS]],
		'batter-hand': maps['batter-hand'][row[I.BATTER_HAND]]
	});
});
