/* global $, d3 */
'use strict';


function ElementStats(compressed, treemap, element_label, element_id) {
	this.element_label = element_label;
	this.element_id = element_id;
	this.data = [];
	for (var i = 0; i < compressed.length; i += 1) {
		var row = compressed[i];
		var node_id = row[0];
		var node = treemap.index[node_id];
		var datum = new Datum(row, node);
		this.data.push(datum);
	}
	this.computeGlobalValues(treemap);
	this.addGlobalReferences();
}

ElementStats.prototype.findNodeData = function(node) {
	// Find the datum object that corresponds to a given thesaurus node ID
	if (! this.index) {
		this.index = {};
		for (var i = 0; i < this.data.length; i += 1) {
			var datum = this.data[i];
			this.index[datum.node.id] = datum;
		}
	}
	return this.index[node.id];
}

ElementStats.prototype.computeGlobalValues = function(treemap) {
	// Compute various values that apply to the element as a whole
	this.total = 0;
	this.max_density = 0;
	for (var i = 0; i < this.data.length; i += 1) {
		this.total += this.data[i].count;
		if (this.data[i].density() > this.max_density) {
			this.max_density = this.data[i].density();
		}
	}
	this.average_density = this.total / treemap.totalSize();
}

ElementStats.prototype.addGlobalReferences = function() {
	// Add references to each Datum object pointing back to the
	// element-wide data (so that each Datum object knows about the
	// element-wide values)
	this.global_values = {
		'element_id': this.element_id,
		'element_label': this.element_label,
		'element_total': this.total,
		'average_density': this.average_density,
		'max_density': this.max_density
	};
	for (var i = 0; i < this.data.length; i += 1) {
		this.data[i].g = this.global_values;
	}
}

ElementStats.prototype.addGlobalProperty = function(name, value) {
	this.global_values[name] = value;
}



function Datum(row, thesaurus_node) {
	this.count = row[1];
	this.node = thesaurus_node;
	this.g = {};
}

Datum.prototype.global = function(property) {
	return this.g[property];
}

Datum.prototype.element_label = function() {
	return this.global('element_label');
}

Datum.prototype.element_id = function() {
	return this.global('element_id');
}

Datum.prototype.breadcrumb = function() {
	return this.node.breadcrumb;
}

Datum.prototype.density = function() {
	return this.count / this.node.size ;
}

Datum.prototype.ratioToMaxDensity = function() {
	return this.density() / this.global('max_density');
}

Datum.prototype.ratioToAverageDensity = function() {
	return this.density() / this.global('average_density');
}

Datum.prototype.ratioToTotal = function() {
	return this.count / this.global('element_total');
}

// Histogram bar coordinates
Datum.prototype.x = function() {
	return this.node.innerX();
}

Datum.prototype.y = function() {
	return this.node.innerY();
}

Datum.prototype.width = function() {
	return this.node.innerWidth();
}

Datum.prototype.rescaledWidth = function() {
	return this.width() * this.ratioToMaxDensity();
}

Datum.prototype.height = function() {
	return this.node.innerHeight();
}



/*
--------------------------------------------------------------
Arrays of ElementStats compiled for a collections of elements
--------------------------------------------------------------
 */

function CollectionStats(compressed, treemap) {
	var cm = new ColourManager();
	this.data = [];
	for (var i = 0; i < compressed.length; i += 1) {
		var row = compressed[i];
		var element_id = row[0];
		var element_label = row[1];
		var colour = cm.chooseColour(i, element_label);
		var element_stats = new ElementStats(row[2], treemap, element_label, element_id);
		element_stats.addGlobalProperty('colour', colour);
		this.data.push(element_stats)
	}
}

CollectionStats.prototype.compileNodeSets = function() {
	// Get an arbitrary ElementStats object, so that we can extract
	// a set of level-2 treemap nodes
	var thesaurus_nodes = [];
	var sample_stats = this.data[0];
	for (var i = 0; i < sample_stats.data.length; i += 1) {
		var datum = sample_stats.data[i];
		thesaurus_nodes.push(datum.node);
	}

	this.node_sets = [];
	for (var i = 0; i < thesaurus_nodes.length; i += 1) {
		var node = thesaurus_nodes[i];
		var nset = this.makeNodeSet(node);
		this.node_sets.push(nset);
	}
}

CollectionStats.prototype.makeNodeSet = function(node) {
	// Return the set of datum objects corresponding to a given thesaurus node
	var nset = [];
	for (var i = 0; i < this.data.length; i += 1) {
		var element = this.data[i];
		nset.push(element.findNodeData(node));
	}
	return new NodeSet(node, nset);
}




function NodeSet(node, data) {
	// Set of datum objects from different elements, all of which
	// correspond to a give thesaurus node.
	this.data = data;
	this.node = node;
}

NodeSet.prototype.sumCount = function() {
	var sum = 0;
	for (var i = 0; i < this.data.length; i += 1) {
		sum += this.data[i].count;
	}
	return sum;
}

NodeSet.prototype.sumRatioToAverageDensity = function() {
	var sum = 0;
	for (var i = 0; i < this.data.length; i += 1) {
		sum += this.data[i].ratioToAverageDensity();
	}
	return sum;
}

NodeSet.prototype.maxRatioToAverageDensity = function() {
	var max = 0;
	for (var i = 0; i < this.data.length; i += 1) {
		if (this.data[i].ratioToAverageDensity() > max) {
			max = this.data[i].ratioToAverageDensity();
		}
	}
	return max;
}

NodeSet.prototype.setHistogramPositions = function(mode) {
	// Create positions for each datum as segments of a horizontal histogram
	var sum;
	if (mode === 'count') {
		sum = this.sumCount();
	} else if (mode === 'density') {
		sum = this.sumRatioToAverageDensity();
	}

	// First, figure out position within a unit space (this will later
	// be rescaled to fit in the treemap space)
	var running_x = 0;
	for (var i = 0; i < this.data.length; i += 1) {
		var datum = this.data[i];
		var value;
		if (mode === 'count') {
			value = this.count;
		} else if (mode === 'density') {
			value = this.ratioToAverageDensity();
		}
		var ratio = value / sum;
		// datum.bar will contain the data needs to draw the segment
		// of the bar representing the datum.
		datum.bar = {
			'ratio': value / sum,
			'x': running_x,
			'width': ratio
		};
		running_x += ratio;
	}
}
