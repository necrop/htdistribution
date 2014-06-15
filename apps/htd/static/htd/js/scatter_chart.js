/*global $, d3, lemmajson, raw_datapoints */
'use strict';


//===============================================================
// Functions to run once the page has loaded
//===============================================================

$(document).ready( function() {
	var canvas_specs = drawTreemap();
	var treemap_index = canvas_specs[3];
	var datapoints = parseDataPoints(raw_datapoints, treemap_index);
	plotDatapoints(datapoints, canvas_specs);
});



//===============================================================
// Data preparation
//===============================================================

function parseDataPoints(compressed, treemap_index) {
	var expanded = [];
	for (var i = 0; i < compressed.length; i += 1) {
		var row = compressed[i];
		var node_id = row[2];
		var node = treemap_index[node_id];
		var p = new DataPoint(row, node);
		expanded.push(p);
	}
	return expanded;
}



function plotDatapoints(datapoints, canvas_specs) {
	var canvas = canvas_specs[0];
	var x_scale = canvas_specs[1];
	var y_scale = canvas_specs[2];
	var datapoint_tooltip = d3.select('#datapointTooltip');


	// Plot the datapoints on top of the treemap
	var points = canvas.selectAll('circle.datapoint')
		.data(datapoints);

	points.enter().append('circle')
		.attr('class', 'datapoint')
		.attr('cx', function (d) { return x_scale(d.x()); })
		.attr('cy', function (d) { return y_scale(d.y()); })
		.attr('r', 2);

	// Set event listeners for clicks/mouseovers on datapoints
	points
		.on('mouseover', function(d) {
			showDatapointTooltip(d, d3.event);
		})
		.on('mouseout', function() {
			hideDatapointTooltip();
		})
		.on('click', function(d) {
			open(d.oedUrl(), 'oed');
		});


	// Display the small pop-up showing details of the data point
	function showDatapointTooltip(d, event) {
		// Populate the pop-up
		var header = '<h2>' + d.lemma() + ' (' + d.year + ')</h2>';
		var text = '<div>' + d.breadcrumb() + '</div>';
		var html = header + text;

		datapoint_tooltip
			.html(html)
			.style('left', (event.pageX) + 'px')
			.style('top', (event.pageY) + 'px')
		datapoint_tooltip.transition()
			.duration(200)
			.style('opacity', 1);
	}

	// Hide the small pop-up showing details of the data point
	function hideDatapointTooltip() {
		datapoint_tooltip.transition()
			.duration(500)
			.style('opacity', 0)
			.each("end", function () {
				datapoint_tooltip.html('');
			});
	}

}

