/*global $, d3, raw_bar_data*/
'use strict';

// Shades from red to blue, used to fill the histogram bars
var bar_shades = [
	[2, '#FF0000'], // red shading to...
	[1.8, '#FF1E00'],
	[1.6, '#FF3D00'],
	[1.4, '#FF5B00'],
	[1.2, '#FF7A00'],
	[1, '#FF9900'],  // ...orange
	[.8, '#336699'], // light blue shading to...
	[.6, '#26598C'],
	[.4, '#194C7F'],
	[.2, '#0C3F72'],
	[0, '#003366'] // ...dark blue
];


//===============================================================
// Functions to run once the page has loaded
//===============================================================

$(document).ready( function() {
	var treemap = new Treemap(treemap_data);
	treemap.drawTreemap(2, false);
	var element_stats = new ElementStats(raw_bar_data, treemap, element_name, element_id);
	plotHistogramBars(element_stats.data, treemap);
	treemap.addLevel2Labels();
});


function plotHistogramBars(bar_data, treemap) {
	var canvas = treemap.canvas;
	var x_scale = treemap.x_scale;
	var y_scale = treemap.y_scale;
	var datapoint_tooltip = d3.select('#datapointTooltip');

	// Plot the datapoints on top of the treemap
	var histogram_bars = canvas.selectAll('rect.hbar')
		.data(bar_data);

	histogram_bars.enter().append('rect')
		.attr('class', 'hbar')
		.attr('x', function(d) { return x_scale(d.x()); })
		.attr('y', function(d) { return y_scale(d.y()); })
		.attr('width', function(d) { return x_scale(d.rescaledWidth()); })
		.attr('height', function(d) { return y_scale(d.height()); })
		.attr('fill', function(d) { return fill_colour(d); });

	// Set event listeners for clicks/mouseovers on histogram bars
	histogram_bars
		.on('mouseover', function(d) {
			showDatapointTooltip(d);
		})
		.on('mouseout', function() {
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

	function fill_colour(d) {
		var fill_col = bar_shades[0][1]; // arbitrary initial value
		var density_ratio = d.ratioToAverageDensity();
		for (var i = 0; i < bar_shades.length; i += 1) {
			var ratio = bar_shades[i][0];
			var shade = bar_shades[i][1];
			if (ratio <= density_ratio) {
				fill_col = shade;
				break;
			}
		}
		return fill_col;
	}

}
