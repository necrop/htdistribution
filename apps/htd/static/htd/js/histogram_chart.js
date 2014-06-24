/*global $, d3, raw_bar_data*/
'use strict';


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
	var colour_manager = new ColourManager();

	for (var i = 0; i < bar_data.length; i += 1) {
		bar_data[i].setDensityBarDimensions();
	}
	var histogram_bars = plotBars(bar_data, treemap, 'density');
	histogram_bars.attr('fill', function(d) {
		return fill_colour(d);
	});

	function fill_colour(d) {
		var density_ratio = d.ratioToAverageDensity();
		return colour_manager.chooseShade(density_ratio);
	}

}
