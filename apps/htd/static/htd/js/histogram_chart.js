/*global $, d3, raw_bar_data*/
'use strict';


//===============================================================
// Functions to run once the page has loaded
//===============================================================

$(document).ready( function() {
	var treemap = new Treemap(treemap_data);
	treemap.drawTreemap(2);
	var bar_data = parseRawData(raw_bar_data, treemap);
	plotHistogramBars(bar_data, treemap);
	treemap.addLevel2Labels();
});


function parseRawData(compressed, treemap) {
	var expanded = [];
	for (var i = 0; i < compressed.length; i += 1) {
		var row = compressed[i];
		var node_id = row[0];
		var node = treemap.index[node_id];
		var hbar = new HistogramBar(row, node, element_name);
		expanded.push(hbar);
	}
	return expanded;
}



function plotHistogramBars(bar_data, treemap) {
	var canvas = treemap.canvas;
	var x_scale = treemap.x_scale;
	var y_scale = treemap.y_scale;
	var datapoint_tooltip = d3.select('#datapointTooltip');

	// Find the highest ratio of element count to thesaurus class size
	var max_ratio = d3.max(bar_data, function(d) {
		return d.ratioToClass();
	});
	// Find the average distribution ratio
	var average_density = d3.sum(bar_data, function(d) {
		return d.count;
	}) / treemap.totalSize();

	// Plot the datapoints on top of the treemap
	var histogram_bars = canvas.selectAll('rect.hbar')
		.data(bar_data);

	histogram_bars.enter().append('rect')
		.attr('class', 'hbar')
		.attr('x', function (d) { return x_scale(d.x()); })
		.attr('y', function (d) { return y_scale(d.y()); })
		.attr('width', function (d) { return x_scale(d.rescaledWidth(max_ratio)); })
		.attr('height', function (d) { return y_scale(d.height()); })
		.attr('fill', 'red');

	// Set event listeners for clicks/mouseovers on histogram bars
	histogram_bars
		.on('mouseover', function(d) {
			showDatapointTooltip(d);
		})
		.on('mouseout', function() {
			hideDatapointTooltip();
		})
		.on('click', function(d) {
			open(d.oedUrl(), 'oed');
		});


	// Display the small pop-up showing details of the data point
	function showDatapointTooltip(d) {
		var density = Math.floor(d.density() * 100000) / 100000;
		var density_ratio = Math.floor((d.density() / average_density) * 100);

		// Populate the pop-up
		var header = '<h2>' + d.label + '</h2>';
		var text = '<div>' + d.breadcrumb() + '</div>';
		text += '<div>Senses: ' + d.count + '</div>';
		text += '<div>Density: ' + density + ' (' + density_ratio + '% of average)</div>';
		var html = header + text;

		datapoint_tooltip
			.html(html)
			.style('left', (treemap.offset.left + x_scale(d.x())) + 'px')// x_scale(d.x()))// (event.pageX) + 'px')
			.style('top', (treemap.offset.top  + y_scale(d.y())) + 'px');//y_scale(d.y()));//(event.pageY) + 'px')
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
