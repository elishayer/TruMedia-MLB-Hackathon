/* main.js
 * Eli Shayer
 * ----------
 * The main javascript file for Eli Shayer's entry in the TruMedia Hackathon
 * Declares an Angular module and controller
 */

angular.module('tmhApp', []).controller('tmhController', function($scope) {
	// tabs and the current view, initialized to comparison
	$scope.view = {
		tabs: [ 'comparison', 'search', 'tree' ],
		curr: 'comparison',
		setActive: function(tab) {
			this.curr = tab;
		},
		isActive: function(tab) {
			return this.curr === tab;
		}
	}

	// initialize the input given by the user
	$scope.input = {
		// the select input groups
		selects: {
			/* input groups each have the following data:
			 * title: the title of the input group
			 * type: the type of data submitted in the input group
			 * value: the initialized value of the select, used with ng-model
			 * options: function for the options for the select
			 * submit: function for submitting the form
			 * showForm: function for whether to show the form
			 * result: the text representing the entered data
			 * showEdit: function for whether to show the edit form
			 * edit: function to initiate an edit
			 */
			team: {
				title: 'Pitcher Team',
				type: 'team',
				value: '0',
				options: function() { return Object.keys(teams); },
				submit: function() { $scope.input.submitted.team = this.value; },
				showForm: function() { return !$scope.input.submitted.team; },
				result: function() { return 'Team: ' + $scope.input.submitted.team; },
				showEdit: function() { return $scope.input.submitted.team; },
				edit: function() {
					// reset all data: team, pitcher, and distributions
					$scope.input.selects.team.value = '0';
					$scope.input.selects.pitcher.value = '0';
					$scope.input.submitted = {
						team: 0,
						pitcher: 0,
						situation: 0
					};
					$scope.input.situation.initialize();
				}
			},
			pitcher: {
				title: 'Pitcher',
				type: 'pitcher',
				value: '0',
				options: function() {
					var team = $scope.input.submitted.team;
					if (team) {
						return teams[team].pitchers;
					} else {
						return [];
					}
				},
				submit: function() {
					// set pitcher detail and name
					$scope.input.submitted.pitcher = pitchers[this.value];
					$scope.input.submitted.pitcher.name = this.value;

					// find the overall pitch distribution
					// store for brevity
					var pitches = $scope.input.submitted.pitcher.pitches;

					// initialize an empty distribution object
					var distribution = {};

					// count the number of pitches by pitch type
					var numPitches = 0;
					Object.keys(pitches).forEach(function(type) {
						distribution[type] = pitches[type].length;
						numPitches += pitches[type].length;
					});

					// find the percent of pitches, left in numeric form on [0, 1]
					for (type in distribution) {
						distribution[type] /= numPitches;
					}

					// set the distribution and number of pitches to the pitcher data
					$scope.input.submitted.pitcher.num = numPitches;
					$scope.input.submitted.pitcher.distribution = distribution;
				},
				showForm: function() {
					return $scope.input.submitted.team &&
						!$scope.input.submitted.pitcher;
				},
				result: function() {
					return 'Pitcher: ' + $scope.input.submitted.pitcher.name;
				},
				showEdit: function() { return $scope.input.submitted.pitcher; },
				edit: function() {
					// reset all data except team: pitcher and distributions
					$scope.input.selects.pitcher.value = '0';
					$scope.input.submitted.pitcher = 0;
					$scope.input.submitted.situation = 0;
					$scope.input.situation.initialize();
				}
			}
		},
		// the details for the situation of which pitches to consider
		situation: {
			// an array of the details that can be given, and an object with the values
			details: [ 'inning', 'count', 'bases', 'out', 'batter-hand' ],
			values: {},
			// options for the details
			options: options,
			// function for whether the situation form should be displayed
			show: function() { return $scope.input.submitted.pitcher; },
			// function to submit the situation request
			submit: function() {
				// initialize the submitted situation to be an empty object
				// to hold the distribution for the situation and num pitches
				$scope.input.submitted.situation = {
					distribution: {},
					num: 0
				};

				// get the number of included pitches by type
				// and keep track of the total included pitches
				Object.keys($scope.input.submitted.pitcher.pitches).forEach(function(type) {
					// initialize key in distribution object for the pitch type
					$scope.input.submitted.situation.distribution[type] = 0;

					$scope.input.submitted.pitcher.pitches[type].forEach(function(pitch) {
						// included if the pitch is included for every situation detail
						var included = true;
						$scope.input.situation.details.forEach(function(detail) {
							included = included && isIncluded[detail](parseInt(
								$scope.input.situation.values[detail]), pitch);
						});

						// if included increment the total counter and the type counter
						if (included) {
							$scope.input.submitted.situation.num++;
							$scope.input.submitted.situation.distribution[type]++;
						}
					});
				});

				// get the proportion on [0-1] for each pitch type
				for (type in $scope.input.submitted.situation.distribution) {
					$scope.input.submitted.situation.distribution[type] /=
						$scope.input.submitted.situation.num;
				}
			},
			// initialize the value of each situation to '0'
			initialize: function() {
				$scope.input.situation.details.forEach(function(detail) {
					$scope.input.situation.values[detail] = '0';
				});
			}
		},
		// the permanent values of the forms, initialized to 0
		submitted: {
			team: 0,
			pitcher: 0,
			situation: 0
		}
	}

	// initialize the situation details
	$scope.input.situation.initialize();

	// data and methods for the results table
	$scope.table = {
		// predicate method for whether to show the table
		show: function() { return $scope.input.submitted.pitcher; },
		// generate the caption for the table
		caption: function() {
			return $scope.input.submitted.pitcher.name + ' of ' + 
				$scope.input.submitted.team;
		},
		// get the array of pitches thrown by the pitcher
		getPitches: function() {
			if ($scope.input.submitted.pitcher) {
				// the keys of the pitches object sorted by number of pitches
				var pitches = $scope.input.submitted.pitcher.pitches;
				return Object.keys(pitches).sort(function(a, b) {
					return pitches[b].length - pitches[a].length;
				});
			} else {
				return [];
			}
		},
		// the headers are the pitchers with a blank and 'Number' at the beginning
		getHeaders: function() {
			var headers = $scope.table.getPitches();
			headers.unshift('Number');
			headers.unshift('');
			return headers;
		},
		/* the rows of the table, each with the following data:
		 * header: the text in the leftmost cell
		 * show: function for whether the row should be displayed
		 * getCell: function to get the cell value based on the pitch type
		 * getNum: function to get the number of pitches
		 */
		rows: [
			// overall for the pitcher
			{
				header: 'Overall',
				show: function() { return $scope.input.submitted.pitcher; },
				// get the percent of overall repetoire formatted as a percent
				getCell: function(pitch) {
					if ($scope.input.submitted.pitcher) {
						return $scope.format.percent(
							$scope.input.submitted.pitcher.distribution[pitch]);
					} else {
						return '';
					}
				},
				getNum: function() { return $scope.input.submitted.pitcher.num; }
			},
			{
				header: 'Situation',
				show: function() { return $scope.input.submitted.situation; },
				getCell: function(pitch) {
					if ($scope.input.submitted.situation) {
						return $scope.format.percent(
							$scope.input.submitted.situation.distribution[pitch]);
					} else {
						return '';
					}
				},
				getNum: function() { return $scope.input.submitted.situation.num; }
			},
			{
				header: 'Differential',
				show: function() {
					return $scope.input.submitted.situation &&
						$scope.input.submitted.situation.num;
				},
				getCell: function(pitch) {
					if ($scope.input.submitted.situation) {
						return $scope.format.percent(
							$scope.input.submitted.situation.distribution[pitch] -
							$scope.input.submitted.pitcher.distribution[pitch]);
					} else {
						return '';
					}
				},
				getNum: function() { return '-'; },
			}
		],
	}

	// formatting functions
	$scope.format = {
		// textualize data, with a hyphen corresponding to a space
		textualize: function(text) {
			// split at hyphens
			text = text.split('-');
			// capitalize each word
			for (var i = 0; i < text.length; i++) {
				text[i] = text[i][0].toUpperCase() + text[i].substring(1);
			}
			// re-join with space instead of hyphen
			return text.join(' ');
		},
		// format num as a percent with number of digits as given, or 3 otherwise
		// Assumes input as 0.52342165 for example, with 3 digits being 52.3%
		// requires digits to be greater than or equal to 2
		percent: function(num, digits) {
			digits = digits || 3;
			for (var i = 0; i < digits; i++) {
				num *= 10;
			}
			num = Math.round(num);
			for (var i = 0; i < digits - 2; i++) {
				num /= 10;
			}
			return num + '%';
		}
	}
});
