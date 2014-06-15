/*global $, d3, treemap_data*/
'use strict';


function drawTreemap() {
	var treemap_nodes = uncompressTreemapData(treemap_data);
	var treemap_index = indexTreemapData(treemap_nodes);
	var canvas_specs = makeTreemap(treemap_nodes);
	return [canvas_specs[0], canvas_specs[1], canvas_specs[2],
		treemap_index];
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



function makeTreemap(treemap_nodes) {
	var container_div = $('#chartContainer');
	var details_container = $('#classDetails');

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

	// coefficient used to set the radius of balloons
	var dotscaler = canvas_width * 0.005;

	// Create the SVG element (as a child of the #scatterChart div)
	var canvas = d3.select('#chartContainer').append('svg')
		.attr('width', canvas_width)
		.attr('height', canvas_height)
		.attr('overflow', 'hidden');

	// tooltip for showing the level-3 class label
	var text_height = canvas_height * 0.02;
	var class_label = d3.tip()
		.attr('class', 'd3-tip')
		.direction('n')
		.offset([0, 0])
		.style('font-size', text_height + 'px')
		.html(function(d) {
			return d.label();
		});
	canvas.call(class_label);


	// Get all the thesaurus nodes at level 2 in the taxonomy - these are the
	// ones we'll write labels for
	var level2_nodes = [];
	for (var i = 0; i < treemap_nodes.length; i += 1) {
		var node = treemap_nodes[i];
		if (node.level === 2) {
			level2_nodes.push(node);
		}
	}


	// Get all the thesaurus nodes at level 3 in the taxonomy - these are the
	// ones we'll draw rectangles for
	var level3_nodes = [];
	var count = 0;
	for (var i = 0; i < treemap_nodes.length; i += 1) {
		var node = treemap_nodes[i];
		if (node.level === 3) {
			count += 1;
			node.n = count;
			level3_nodes.push(node);
		}
	}

	// Draw rectangles for the level-3 treemap nodes
	var blocks = canvas.selectAll('rect.level3square')
		.data(level3_nodes);

	blocks.enter().append('rect')
		.attr('class', 'level3square')
		.attr('x', function (d) { return x_scale(d.x); })
		.attr('y', function (d) { return y_scale(d.y); })
		.attr('width', function (d) { return x_scale(d.width); })
		.attr('height', function (d) { return y_scale(d.height); })
		.style('fill', function (d) { return d.fill(); });


	// Set event handlers for level-3 rectangles
	blocks
		.on('mouseover', function (d, event) {
			d3.select(this).attr('class', 'level3square highlighted');
			showClassDetails(d);
			class_label.show(d);
		})
		.on('mouseout', function () {
			d3.select(this).attr('class', 'level3square');
			hideClassDetails();
			class_label.hide();
		})


	// Display the small class breadcrumb
	function showClassDetails(d) {
		details_container.find('h3').html(d.breadcrumb + ' (' + d.size + ' senses)');
	}

	// Hide the class breadcrumb
	function hideClassDetails() {
		details_container.find('h2').html('');
	}


	// Add a frame around the whole canvas (we have to do this *after* the
	// level-3 rectangles, or it gets obscured)
	canvas.append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', canvas_width)
		.attr('height', canvas_height)
		.attr('class', 'chartBackground');


	// Initialize the level-2 text labels
	var level2_labels = canvas.selectAll('.level2Label')
		.data(level2_nodes);

	// Add the level-2 text labels
	level2_labels.enter().append('text')
		.attr('class', 'level2Label')
		.text(function (d) { return d.label(); })
		.style('font-size', function (d) { return y_scale(d.labelFontsize()) + 'px'; })
		.attr('x', function (d) { return x_scale(d.labelX()); })
		.attr('y', function (d) { return y_scale(d.labelY()); });

	// Return specs for the canvas - these will be needed for anything
	// else that gets added on top
	return [canvas, x_scale, y_scale];
}

