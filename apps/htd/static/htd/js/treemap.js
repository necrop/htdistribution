/*global $, d3 */
'use strict';

function Treemap(raw_data) {
	this.data = uncompressTreemapData(raw_data);
	this.index = indexTreemapData(this.data);
	this.level_nodes = {
		2: getNodesForLevel(this.data, 2),
		3: getNodesForLevel(this.data, 3)
	};
	this.live_nodes = true; // true = thesaurus nodes are highlighted on mouseover
}

Treemap.prototype.totalSize = function() {
	if (! this.total_size) {
		var level1_nodes = getNodesForLevel(this.data, 1);
		this.total_size = d3.sum(level1_nodes, function(d) {
			return d.size;
		});
	}
	return this.total_size;
}

Treemap.prototype.drawTreemap = function(level, live_nodes) {
	this.live_nodes = live_nodes;

	var container_div = $('#chartContainer');
	var canvas_width = container_div.innerWidth() * 0.95;
	var canvas_height = canvas_width * 0.6;

	// x-axis scale
	var x_scale = d3.scale.linear()
		.domain([0, 1])
		.range([0, canvas_width]);

	// y-axis scale
	var y_scale = d3.scale.linear()
		.domain([0, 1])
		.range([0, canvas_height]);

	// Create the SVG element (as a child of the #chartContainer div)
	var canvas = d3.select('#chartContainer').append('svg')
		.attr('width', canvas_width)
		.attr('height', canvas_height)
		.attr('overflow', 'hidden');

	// Add key attributes to the parent Treemap object (so that these are
	// usable by other functions).
	this.canvas = canvas;
	this.width = canvas_width;
	this.height = canvas_height;
	this.x_scale = x_scale;
	this.y_scale = y_scale;
	this.offset = container_div.offset();

	// Draw rectangles for the level-2 or level-3 treemap nodes
	var blocks = this.drawBlocks(this.level_nodes[level], level);
	this.setMouseoverHandlers(blocks, level);

	// Add a frame around the whole canvas (we do this *after* the
	// level-2 or level-3 rectangles, so that it doesn't get obscured)
	canvas.append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', canvas_width)
		.attr('height', canvas_height)
		.attr('class', 'chartBackground');
}


Treemap.prototype.drawBlocks = function(nodes, level) {
	var x_scale = this.x_scale;
	var y_scale = this.y_scale;
	var classname = 'treemapNode' + level;

	var blocks = this.canvas.selectAll('rect.' + classname)
		.data(nodes);

	blocks.enter().append('rect')
		.attr('class', classname)
		.attr('x', function (d) {
			return x_scale(d.x);
		})
		.attr('y', function (d) {
			return y_scale(d.y);
		})
		.attr('width', function (d) {
			return x_scale(d.width);
		})
		.attr('height', function (d) {
			return y_scale(d.height);
		})
		.style('fill', function (d) {
			return d.fill();
		});

	return blocks;
}


Treemap.prototype.setMouseoverHandlers = function(blocks, level) {
	var details_container = $('#classDetails');
	var classname = 'treemapNode' + level;
	var live_nodes = this.live_nodes;

	// tooltip for showing class labels
	var text_height = this.height * 0.02;
	var class_label = d3.tip()
		.attr('class', 'd3-tip')
		.direction('n')
		.offset([0, 0])
		.style('font-size', text_height + 'px')
		.html(function(d) {
			return d.label();
		});
	this.canvas.call(class_label);

	// Set event handlers for thesaurus-node blocks
	blocks
		.on('mouseover', function (d, event) {
			showClassDetails(d);
			if (live_nodes) {
				d3.select(this).attr('class', classname + ' treemapNodeHighlighted');
				class_label.show(d);
			}
		})
		.on('mouseout', function () {
			hideClassDetails();
			if (live_nodes) {
				d3.select(this).attr('class', classname);
				class_label.hide();
			}
		});


	// Display the small class breadcrumb
	function showClassDetails(d) {
		details_container.find('h3').html(d.breadcrumb + ' (' + d.size + ' senses)');
	}

	// Hide the class breadcrumb
	function hideClassDetails() {
		details_container.find('h2').html('');
	}
}


Treemap.prototype.addLevel2Labels = function() {
	var x_scale = this.x_scale;
	var y_scale = this.y_scale;

	// Initialize the level-2 text labels
	var level2_labels = this.canvas.selectAll('.level2Label')
		.data(this.level_nodes[2]);

	// Add the level-2 text labels
	level2_labels.enter().append('text')
		.attr('class', 'level2Label')
		.text(function (d) { return d.label(); })
		.style('font-size', function (d) {
			return y_scale(d.labelFontsize()) + 'px';
		})
		.attr('x', function (d) {
			return x_scale(d.labelX());
		})
		.attr('y', function (d) {
			return y_scale(d.labelY());
		});
}


//===============================================================
// Data preparation
//===============================================================

function uncompressTreemapData(compressed) {
	var expanded = [];
	for (var i = 0; i < compressed.length; i += 1) {
		var row = compressed[i];
		var node = new TreemapNode(row);
		expanded.push(node);
	}
	return expanded;
}

function indexTreemapData(treemap_array) {
	// Index node objects by node ID
	var index = {};
	for (var i = 0; i < treemap_array.length; i += 1) {
		var node = treemap_array[i];
		index[node.id] = node;
	}
	return index;
}

function getNodesForLevel(treemap_array, level) {
	// Get all the thesaurus nodes at a given level in the taxonomy
	var nodes = [];
	var count = 0;
	for (var i = 0; i < treemap_array.length; i += 1) {
		var node = treemap_array[i];
		if (node.level === level) {
			count += 1;
			node.n = count;
			nodes.push(node);
		}
	}
	return nodes;
}