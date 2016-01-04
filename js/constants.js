/* constants.js
 * Eli Shayer
 * -----------
 * Constants for common use throughout the project
 */

// options gives text and value of option tags (required)
// maps gives a map from JSON data to numeric code (optional)
// isIncluded determines whether a pitch is included in a situation
//     given its numeric value and the selected option (required)
var options = {}, maps = {}, isIncluded = {};

// ------------------------------------ Innings
options.inning = [
	{ text: 'All Innings', value: 0 },
	{ text: 'Inning 1', value: 1 },
	{ text: 'Inning 2', value: 2 },
	{ text: 'Inning 3', value: 3 },
	{ text: 'Inning 4', value: 4 },
	{ text: 'Inning 5', value: 5 },
	{ text: 'Inning 6', value: 6 },
	{ text: 'Inning 7', value: 7 },
	{ text: 'Inning 8', value: 8 },
	{ text: 'Inning 9', value: 9 },
];

// either all innings is selected or an exact match
isIncluded.inning = function(option, pitch) {
	return option === 0 || option === pitch.inning;
}

// ------------------------------------ Count
options.count = [
	{ text: 'All Counts', value: 0 },
	{ text: 'Pitcher Ahead', value: 1 },
	{ text: 'Batter Ahead', value: 2 },
	{ text: 'Neutral', value: 3 },
	{ text: '0-0', value: 4 },
	{ text: '0-1', value: 5 },
	{ text: '0-2', value: 6 },
	{ text: '1-0', value: 7 },
	{ text: '1-1', value: 8 },
	{ text: '1-2', value: 9 },
	{ text: '2-0', value: 10 },
	{ text: '2-1', value: 11 },
	{ text: '2-2', value: 12 },
	{ text: '3-0', value: 13 },
	{ text: '3-1', value: 14 },
	{ text: '3-2', value: 15 },
];

// hash on balls then strikes
maps.count = {
	0: { 0: 4,  1: 5,  2: 6  },
	1: { 0: 7,  1: 8,  2: 9  },
	2: { 0: 10, 1: 11, 2: 12 },
	3: { 0: 13, 1: 14, 2: 15 }
};

// determine whether a pitch is included given the option
// all counts, or pitcher ahead selected and more strikes than balls
// or batter ahead selected and more balls than strikes, or
// netural selected and equal balls and strikes, or a specific count 
// selected and that count
isIncluded.count = function(option, pitch) {
	var balls = Math.trunc((pitch.count - 4) / 3);
	var strikes = (pitch.count - 4) % 3;
	return option === 0 ||
		option === 1 && strikes > balls ||
		option === 2 && strikes < balls ||
		option === 3 && strikes === balls ||
		option === pitch.count;
}

// ------------------------------------ Out
options.out = [
	{ text: 'Any Number of Outs', value: 0 },
	{ text: 'No outs', value: 1 },
	{ text: 'One out', value: 2 },
	{ text: 'Two outs', value: 3 },
];

// map from number of outs to code
maps.out = {
	0: 1,
	1: 2,
	2: 3
};

// predicate for whether the outs for a pitch match the selected option
isIncluded.out = function(option, pitch) {
	return option === 0 || option === pitch.out;
}

// ------------------------------------ Bases
options.bases = [
	{ text: 'Any Base Configuration', value: 0 },
	{ text: 'Bases Empty', value: 1 },
	{ text: 'First Base', value: 2 },
	{ text: 'Second Base', value: 3 },
	{ text: 'Third Base', value: 4 },
	{ text: 'First and Second Base', value: 5 },
	{ text: 'First and Third Base', value: 6 },
	{ text: 'Second and Third Base', value: 7 },
	{ text: 'Bases Loaded', value: 8 },
	{ text: 'Runners in Scoring Position', value: 9 },
];

// first base then second base then third base
// 1 indicates occupied, 0 indicates vacant
maps.bases = {
	0: { 0: { 0: 1, 1: 4 }, 1: { 0: 3, 1: 7 } },
	1: { 0: { 0: 2, 1: 6 }, 1: { 0: 5, 1: 8 } }
};

// predicate for whether the bases on a pitch match the selected option
isIncluded.bases = function(option, pitch) {
	return option === 0 ||
		option === 8 && pitch.bases !== 0 && pitch.bases !== 1 ||
		option === pitch.bases;
}

// ------------------------------------ Handedness
options['batter-hand'] = [
	{ text: 'Any Batter Handedness', value: 0 },
	{ text: 'Right', value: 1 },
	{ text: 'Left', value: 2 }
];

maps['batter-hand'] = {
	R: 1,
	L: 2
};

// predicate method for whether the batter handedness either matches
// or 'any' is selected
isIncluded['batter-hand'] = function(option, pitch) {
	return option === 0 || option === pitch['batter-hand'];
}

// ------------------------------------ Previous Pitch
options['previous-pitch'] = [
	{ text: 'Any Pitch', value: 0},
	{ text: 'General Fastball', value: 1},
	{ text: 'Breaking Ball', value: 2},
	{ text: 'Changeup', value: 3},
	{ text: 'Curveball', value: 4},
	{ text: 'Two Seamer', value: 5},
	{ text: 'Four Seamer', value: 6},
	{ text: 'Cutter', value: 7},
	{ text: 'Slider', value: 8},
	{ text: 'Splitter', value: 9},
	{ text: 'Sinker', value: 10},
	{ text: 'Forkball', value: 11},
	{ text: 'Knuckleball', value: 12},
	{ text: 'Kuckle Curve', value: 13},
	{ text: 'Screwball', value: 14},
	{ text: 'Gyroball', value: 15},
	{ text: 'Eephus', value: 16}
];

maps['previous-pitch'] = {
	FA: 1,
	CH: 3,
	CU: 4,
	FT: 5,
	FF: 6,
	FC: 7,
	SL: 8,
	FS: 9,
	SI: 10,
	FO: 11,
	KN: 12,
	KC: 13,
	SC: 14,
	GY: 15,
	EP: 16
};

// predicate function for whether a pitch is of a certain type
isIncluded['previous-pitch'] = function(option, pitch) {
	// true for the any choice, fastball and pitch is a fastball,
	// breaking and pitch is breaking, or exact match
	return option === 0 ||
		option === 1 && (pitch['previous-pitch'] === 1 ||
			pitch['previous-pitch'] === 5 ||
			pitch['previous-pitch'] === 6 ||
			pitch['previous-pitch'] === 7 ||
			pitch['previous-pitch'] === 9 ||
			pitch['previous-pitch'] === 10) ||
		option === 2 && (pitch['previous-pitch'] === 4 ||
			pitch['previous-pitch'] === 8 ||
			pitch['previous-pitch'] === 13 ||
			pitch['previous-pitch'] === 14 ||
			pitch['previous-pitch'] === 15) ||
		option === pitch['previous-pitch'];
}
