/*global $, d3, raw_datapoints */
'use strict';


//===============================================================
// Functions to run once the page has loaded
//===============================================================

$(document).ready( function() {
	var treemap = new Treemap(treemap_data);
	treemap.drawTreemap(3, true);
	treemap.addLevel2Labels();
	var datapoints = parseDataPoints(raw_datapoints, treemap);
	plotDatapoints(datapoints, treemap);
});



//===============================================================
// Data preparation
//===============================================================

function parseDataPoints(compressed, treemap) {
	var expanded = [];
	for (var i = 0; i < compressed.length; i += 1) {
		var row = compressed[i];
		var node_id = row[2];
		var node = treemap.index[node_id];
		var p = new DataPoint(row, node);
		expanded.push(p);
	}
	return expanded;
}



function plotDatapoints(datapoints, treemap) {
	var canvas = treemap.canvas;
	var x_scale = treemap.x_scale;
	var y_scale = treemap.y_scale;
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

