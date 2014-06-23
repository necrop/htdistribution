/*global $, d3, element_stats, treemap_data */
'use strict';


//===============================================================
// Functions to run once the page has loaded
//===============================================================

$(document).ready( function() {
	var treemap = new Treemap(treemap_data);
	treemap.drawTreemap(2, false);
	treemap.addLevel2Labels();
	var cs = new CollectionStats(element_stats, treemap);
	cs.compileNodeSets();
	for (var i = 0; i < cs.node_sets.length; i += 1) {
		var node_set = cs.node_sets[i];
		node_set.setHistogramPositions('count');
	}


});

