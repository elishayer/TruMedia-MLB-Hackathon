/* main.js
 * Eli Shayer
 * ----------
 * The main javascript file for Eli Shayer's entry in the TruMedia Hackathon
 * Declares an Angular module and controller
 */

// the details with which pitchers can be separated
var details = [ 'inning', 'count', 'bases', 'out', 'batter-hand', 'previous-pitch' ];

angular.module('tmhApp', ['ui.bootstrap']).controller('tmhController', function($scope, $uibModal) {
	// tabs and the current view, initialized to splits
	$scope.view = {
		tabs: [ 'splits', 'tree' ],
		curr: 'splits',
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
			/* the select input groups are shared between all taps,
			 * and each group has the following data:
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
				submit: function() {
					$scope.input.submitted.team = this.value;
					$scope.message = 'Now please select a pitcher below.';
				},
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
					$scope.tree.isDrawn = false;
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

					// set the message
					$scope.message = 'Great, now select details about the situation.';
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
					$scope.tree.isDrawn = false;
				}
			}
		},
		// the details for the situation of which pitches to consider
		situation: {
			details: details,
			values: {},
			// options for the details
			options: options,
			// function for whether the situation form should be disabled
			disabled: function() { return !$scope.input.submitted.pitcher; },
			// function to submit the situation request
			submit: function() {
				// initialize the submitted situation to be an empty object
				// to hold the distribution for the situation and num pitches
				$scope.input.submitted.situation = $scope.getSplitDistribution(
					$scope.input.submitted.pitcher.pitches,
					$scope.input.situation.values);
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

	// helper function to get the pitch distribution for given split details
	$scope.getSplitDistribution = function(pitches, details) {
		// initialize a distribution object
		var distribution = {};
		var num = 0;

		// get the number of included pitches by type
		// and keep track of the total included pitches
		Object.keys(pitches).forEach(function(type) {
			// initialize key in distribution object for the pitch type
			distribution[type] = 0;

			$scope.input.submitted.pitcher.pitches[type].forEach(function(pitch) {
				// included if the pitch is included for every situation detail
				var included = true;
				$scope.input.situation.details.forEach(function(detail) {
					included = included && isIncluded[detail](parseInt(details[detail]), pitch);
				});

				// if included increment the total counter and the type counter
				if (included) {
					num++;
					distribution[type]++;
				}
			});
		});

		// get the proportion on [0-1] for each pitch type
		for (type in distribution) {
			distribution[type] /= num;
		}

		return {
			distribution: distribution,
			num: num
		}
	}

	// initialize the situation details
	$scope.input.situation.initialize();

	// data and methods for the results table
	$scope.table = {
		// generate the caption for the table
		caption: function() {
			if ($scope.input.submitted.pitcher) {
				return $scope.input.submitted.pitcher.name + ' of ' + 
					$scope.input.submitted.team;
			} else {
				return 'Pitch Distribution table';
			}
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
				return ['Pitch Types'];
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
				getNum: function() {
					if ($scope.input.submitted.situation) {
						return '-';
					} else {
						return '';
					}
				}
			}
		],
	}

	// object for the tree tab
	$scope.tree = {
		// deep copy so sorting doesn't change the order in different tabs
		details: angular.copy(details),
		// add a selection via the modal and checkboxes
		add: function(detail) {
			var body =
				'<form>' +
					'<div class="form-group" ng-repeat="datum in data">' +
						'<div class="checkbox">' +
							'<label>' +
								'<input type="checkbox" ng-model="result[datum.value]"> {{ datum.text }}' +
							'</label>' +
						'</div>' +
					'</div>' +
				'</form>';
			$scope.modal = options[detail];
			$scope.openModal('Select the ' + $scope.format.textualize(detail) +
				' options you would like to include', body, 'Submit', 'Cancel',
				function(result) {
					// get the keys, reduce to only those that map to true
					var keys = Object.keys(result);
					if (keys.length) {
						var branches = [];
						keys.forEach(function(key) {
							if (result[key]) {
								branches.push(key);
							}
						});
						$scope.tree.selected.push({
							detail: detail,
							branches: branches
						});
					}
					$scope.tree.sort();
				}
			);
		},
		// edit a selection by removing the previous selection, then add a new one
		edit: function(detail) {
			$scope.tree.remove(detail);
			$scope.tree.add(detail);
		},
		// remove a selection by removing the selection
		remove: function(detail) {
			$scope.tree.selected.splice($scope.util.find($scope.tree.selected, detail,
			function(a, b) {
				return a.detail === b;
			}), 1);
			$scope.tree.sort();
		},
		// resort the details such that the selected are at the top and in order
		// and otherwise maintain order
		sort: function() {
			$scope.tree.details.sort(function(a, b) {
				return $scope.util.find($scope.tree.selected, b, function(a, b) {
					return a.detail === b;
				}) - $scope.util.find($scope.tree.selected, a, function(a, b) {
					return a.detail === b;
				});
			});
		},
		// delete the tree svg for the sake of updating
		delete: function() {
			$scope.tree.isDrawn = false;
		},
		// draw the tree based on the currently selected details
		draw: function() {
			$scope.tree.isDrawn = true;

			// remove any previous svg and initialize a new svg
			d3.select('svg').remove();
			var tree = d3.select('#tree')
				.append('svg')
				.attr('width', document.getElementById('tree').clientWidth)
				.attr('height', 700);

			// SVG constants
			var width = tree.attr('width');
			var height = tree.attr('height');
			var buffer = 20;
			var bufferRight = 80;
			var r = 3;

			// higher number index in selected is base, 0 is the leaf
			// drawing oriented with base on left, leaves on right
			// level index refers to the selection index, left (0) to right (max)
			// branch index refers to the vertical index, top (0) to bottom (max)

			// construct the data
			var leaves = [{
				leafCount: 1,
				details: []
			}];

			$scope.tree.selected.forEach(function(selection, i) {
				var details = angular.copy(leaves[i].details);
				details.push({
					detail: selection.detail,
					branches: selection.branches
				});
				leaves.push({
					leafCount: leaves[i].leafCount * selection.branches.length,
					details: details
				});
			});

			// append a dot for each node in the tree
			var groups = tree.selectAll('g')
				.data(leaves)
				.enter()
				.append('g');

			// function for the data call for the groups
			groupDataFunction = function(d, level) {
				var arr = [];
				for (var i = 0; i < d.leafCount; i++) {
					arr.push({
						level: level,
						leafCount: d.leafCount,
						details: d.details
					});
				}
				return arr;
			}

			// get the x coordinate, with a negative level far left
			getX = function(level) {
				return level >= 0 ? buffer + level / $scope.tree.selected.length *
					(width - buffer - bufferRight) : buffer;
			}

			// get the y coordinate, with a negative level middle vertically
			// plus one to center vertically (i.e. 2nd of 3 is in middle)
			getY = function(leafCount, i) {
				return i >= 0 ? buffer + (i + 1) / (leafCount + 1) *
					(height - 2 * buffer) : height / 2;
			}

			// add nodes for each branch of the tree
			groups.selectAll('circle')
				.data(groupDataFunction)
				.enter()
				.append('circle')
				.attr({
					cx: function(d) { return getX(d.level); },
					cy: function(d, i) { return getY(d.leafCount, i)},
					r: r
				});

			// add lines between nodes
			groups.selectAll('line')
				.data(groupDataFunction)
				.enter()
				.append('line')
				.attr({
					x1: function(d) { return getX(d.level - 1); },
					y1: function(d, i) {
						// get the previous leafcount through reversing the product
						// guard against no details
						var lastDetail = d.details[d.details.length - 1];
						if (lastDetail) {
							lcFactor = lastDetail.branches.length;
							return getY(d.leafCount / lcFactor, Math.trunc(i / lcFactor));
						} else {
							return getY(0, i - 1);
						}
					},
					x2: function(d) { return getX(d.level); },
					y2: function(d, i) { return getY(d.leafCount, i)},
					stroke: 'black'
				});

			// get the text enter object
			var textEnter = groups.selectAll('text')
				// for each level
				.data(function(d, level) {
					var arr = [];
					// for each leaf
					for (var i = 0; i < d.leafCount; i++) {
						// construct the detail object of the given details
						details = {};
						var branch = i;
						for (j = level; j > 0; j--) {
							var detail = d.details[j - 1];
							var lcFactor = detail.branches.length
							details[detail.detail] = detail.branches[branch % lcFactor];
							branch = Math.trunc(branch / lcFactor);
						}

						// fill in the details that aren't specified as 0 (anything)
						$scope.tree.details.forEach(function(detail) {
							if (!details.hasOwnProperty(detail)) {
								details[detail] = 0;
							}
						});

						// get the distribution
						var distribution = $scope.getSplitDistribution(
							$scope.input.submitted.pitcher.pitches, details).distribution;

						// sort by frequency in an array
						var sortedDistribution = [];
						for (pitch in distribution) {
							sortedDistribution.push({
								pitch: pitch,
								frequency: distribution[pitch]
							});
						}
						sortedDistribution.sort(function(a, b) {
							return b.frequency - a.frequency;
						})

						// push the sorted distribution to the array
						arr.push({
							level: level,
							leafCount: d.leafCount,
							distribution: sortedDistribution,
							details: d.details
						});
					}
					return arr;
				})
				.enter();

			// display the top three pitches
			for (var rank = 0; rank < 3; rank++) {
				// pitch frequency labels
				textEnter.append('text')
					.attr({
						x: function(d) { return getX(d.level) + r; },
						y: function(d, i) { return getY(d.leafCount, i) + (rank - 1) * 12 + r; },
						fill: 'blue'
					})
					.text(function(d, i) {
						if (d.distribution[rank]) {
							return d.distribution[rank].pitch + ' (' +
								$scope.format.percent(d.distribution[rank].frequency) + ')';
						}
					});
			}


			// textual category labels
			var categoryLabels = textEnter.append('text')
				.attr({
					x: function(d, i) { return getX(d.level); },
					y: buffer
				})
				.text(function(d, i) {
					if (i === 0) {
						return $scope.format.textualize(d.level ?
							d.details[d.details.length - 1].detail : 'Overall');
					}
				});

			// adjust x location to center over the node (and not go off the svg)
			categoryLabels.attr({
				x: function() {
					return Math.max(0, Math.min(width - this.clientWidth,
						d3.select(this).attr('x') - this.clientWidth / 2));
				}
			})

			// textual detail labels
			var detailLabels = textEnter.append('text')
				.attr({
					x: function(d) { return getX(d.level); },
					y: function(d, i) { return getY(d.leafCount, i); },
					fill: 'red'
				})
				.text(function(d, i) {
					if (d.level) {
						var lastDetail = d.details[d.details.length - 1];
						return options[lastDetail.detail]
							[lastDetail.branches[i % lastDetail.branches.length]].text;
					} else {
						return '';
					}
				});

			// adjust location to the left of the node
			detailLabels.attr({
				x: function() {
					return d3.select(this).attr('x') - this.clientWidth - 2 * r ;
				},
			});
		},
		// determine whether a detail has been submitted
		submitted: function(detail) {
			return $scope.util.find($scope.tree.selected, detail, function(a, b) {
				return a.detail === b;
			}) !== SENTINEL;
		},
		// get the selections for a detail
		getSelections: function(detail) {
			var i = $scope.util.find($scope.tree.selected, detail, function(a, b) {
				return a.detail === b;
			});
			if (i !== SENTINEL) {
				var result = [];
				$scope.tree.selected[i].branches.forEach(function(branch) {
					result.push(options[detail][branch].text);
				});
				return result.join(', ');
			}
		},
		// change the order of selections
		shiftDown: function(detail) {
			$scope.tree.shift(detail, function(i) { return i > 0; }, -1);
		},
		// change the order of selections
		shiftUp: function(detail) {
			$scope.tree.shift(detail, function(i) {
				return i !== SENTINEL && i !== $scope.tree.selected.length - 1;
			}, 1);
		},
		shift: function(detail, conditionCallback, offset) {
			var i = $scope.util.find($scope.tree.selected, detail, function(a, b) {
				return a.detail === b;
			});
			// if condition passes, switch with the element offset away
			if (conditionCallback(i)) {
				$scope.tree.swap(i, i + offset)
			}
		},
		// swap the order of selections with the given indices
		swap: function(a, b) {
			var temp = $scope.tree.selected[a];
			$scope.tree.selected[a] = $scope.tree.selected[b];
			$scope.tree.selected[b] = temp;
			$scope.tree.sort(); 
		},
		// disable a detail if pitcher isn't yet submitted,
		// or for drawing if there are no selected details
		disabled: function(detail) {
			return !$scope.input.submitted.pitcher ||
				detail === 'draw' && !$scope.tree.selected.length;
		},
		// the selected options for the tree
		selected: []
	};

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
			// guard against "NaN%"
			if (isNaN(num)) {
				return '---';
			}
			return num + '%';
		}
	}

	// sentinel for unfound elements
	var SENTINEL = -1;

	// utility functions
	$scope.util = {
		// find the index of an element of an array
		find: function(arr, elem, callback) {
			callback = callback || function(a, b) {
				return a === b;
			};
			for (var i = 0; i < arr.length; i++) {
				if (callback(arr[i], elem)) {
					return i;
				}
			}
			return SENTINEL;
		}
	}

	// gets the textual message given the current status
	$scope.getMessage = function() {
		if (!$scope.input.submitted.team) {
			return 'Welcome! Please select a tab above and enter a team below.';
		} else if (!$scope.input.submitted.pitcher) {
			return 'Now select the pitcher below.';
		}
		if ($scope.view.curr === 'splits') {
			if ($scope.input.submitted.situation) {
				return 'Look to the table to compare the full repetoire of ' +
					$scope.input.submitted.pitcher.name + ' to the scenario you selected.';
			} else {
				return 'Select the details of the situation and hit submit.';
			}
		} else if ($scope.view.curr === 'tree') {
			if ($scope.tree.isDrawn) {
				return 'See the graph below! Hit Update ';
			} else {
				return 'Select branches and their order, then hit draw.'
			}
		}
	}

	// Modal
	// a helper to open a modal. The tempalte is made from the header, body and buttons
	// resolve gives the local variables of the modal, if any are given
	// closeBtn and dismissBtn give the text for each button, if one is to exist at all
	// cbSuccess and cbFailure are callbacks based on modal selection
	$scope.openModal = function(header, body, closeBtn, dismissBtn, cbSuccess, cbFailure) {
		// construct the template from the arguments
		template = '';
		template += '<div class="modal-header"><h3 class="modal-title">' + header + '</h3></div>';
		template += '<div class="modal-body">';
		// if the body contains a tag paste directly, otherwise wrap in a <p> tag
		template += (body[0] === '<' ? body : ('<p>' + body + '</p>')) + '</div>';
		template += '<div class="modal-footer">';
		template += '<button class="btn btn-success" type="button" ng-click="close(result)">' +
			(closeBtn || 'close') + '</button>';
		if (dismissBtn) {
			template += '<button class="btn btn-danger" type="button" ng-click="dismiss()">' +
				dismissBtn + '</button>';
		}
		template += '</div>';

		var options = {
			animation  : true,
			template   : template,
			backdrop   : 'static',
			controller : 'ModalInstanceCtrl',
			resolve    : {
				data : function() {
					return $scope.modal;
				}
			}
		}

		$uibModal.open(options).result.then(cbSuccess, cbFailure);
	};
});

// the modal controller, which simply takes either a 'yes' or 'no' and sends the proper response
angular.module('tmhApp').controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, data) {
	$scope.data = data;
	$scope.result = {};
	$scope.close = function(result) { $uibModalInstance.close(result); }
	$scope.dismiss = function() { $uibModalInstance.dismiss(); }
});
