/*global $, d3, element_stats, treemap_data */
'use strict';


//===============================================================
// Functions to run once the page has loaded
//===============================================================

$(document).ready( function() {
	var mode = 'density'; // 'density' or 'count'
	var treemap = new Treemap(treemap_data);
	treemap.drawTreemap(2, false);

	var cs = new CollectionStats(element_stats, treemap);
	var node_sets = cs.histogramStacks();
	// Serialize the node sets into a single sequence of data points
	var data_points = [];
	for (var i = 0; i < node_sets.length; i += 1) {
		var node_set = node_sets[i];
		for (var j = 0; j < node_set.data.length; j += 1) {
			var datum = node_set.data[j];
			data_points.push(datum);
		}
	}
	var histogram_bars = plotBars(data_points, treemap, mode);
	histogram_bars.attr('fill', function (d) {
		return d.global('colour');
	});

	treemap.addLevel2Labels();

	// Listeners for buttons to switch between count and density
	$('#histogramControls > button').click( function(event) {
		$('#histogramControls > button')
			.removeClass('btn-primary')
			.addClass('btn-info');
		$(this)
			.removeClass('btn-info')
			.addClass('btn-primary');
		var new_mode = $(this).attr('value');
		if (new_mode != mode) {
			mode = new_mode;
			histogram_bars.transition()
				.duration(500)
				.attr('x', function(d) {
					return treemap.x_scale(d.bar[mode].x);
				})
				.attr('width', function(d) {
					return treemap.x_scale(d.bar[mode].width);
				});
		}
	});
});
