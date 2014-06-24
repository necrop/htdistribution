/*global $, d3 */
'use strict';

function plotBars(bar_data, treemap, mode) {
	// Plot histogram bars onto the treemap

	var canvas = treemap.canvas;
	var x_scale = treemap.x_scale;
	var y_scale = treemap.y_scale;
	var datapoint_tooltip = d3.select('#datapointTooltip');

	// Plot the datapoints onto the treemap
	var bars = canvas.selectAll('rect.hbar')
		.data(bar_data);

	bars.enter().append('rect')
		.attr('class', 'hbar')
		.attr('x', function(d) { return x_scale(d.bar[mode].x); })
		.attr('y', function(d) { return y_scale(d.bar[mode].y); })
		.attr('width', function(d) { return x_scale(d.bar[mode].width); })
		.attr('height', function(d) { return y_scale(d.bar[mode].height); })
		.attr('fill',  'red'); // default colour; should be overwritten

	// Set event listeners for clicks/mouseovers on histogram bars
	bars
		.on('mouseover', function (d) {
			showDatapointTooltip(d);
		})
		.on('mouseout', function () {
			hideDatapointTooltip();
		});


	// Display the small pop-up showing details of the data point
	function showDatapointTooltip(d) {
		var density = Math.floor(d.density() * 100000) / 100000;
		var density_ratio = Math.floor(d.ratioToAverageDensity() * 100);

		// Populate the pop-up
		var header = '<h2>' + d.element_label() + '</h2>';
		var text = '<div>' + d.breadcrumb() + '</div>';
		text += '<div>Senses: ' + d.count + '</div>';
		text += '<div>Density: ' + density + ' (' + density_ratio + '% of average density for ' + d.element_label() + ')</div>';
		var html = header + text;

		datapoint_tooltip
			.html(html)
			.style('left', (treemap.offset.left + x_scale(d.bar[mode].x)) + 'px')
			.style('top', (treemap.offset.top + y_scale(d.bar[mode].y)) + 'px');
		datapoint_tooltip.transition()
			.duration(200)
			.style('opacity', 0.8);
	}

	// Hide the small pop-up showing details of the data point
	function hideDatapointTooltip() {
		datapoint_tooltip.transition()
			.duration(500)
			.style('opacity', 0)
			.each('end', function () {
				datapoint_tooltip.html('');
			});
	}

	return bars;
}
