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
	// Data point representing the part of an element that maps on to
	// a specific thesaurus node
	this.count = row[1];
	this.node = thesaurus_node;
	this.g = {}; // container for any global (element-wide) properties
	this.bar = {}; // container for x-position + width for histogram bar
}

Datum.prototype.signature = function() {
	return this.element_id() + '_' + this.node.id;
}

Datum.prototype.global = function(property) {
	return this.g[property];
}

Datum.prototype.property = function(property) {
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

// Histogram bar width
Datum.prototype.rescaledWidth = function() {
	return this.node.innerWidth() * this.ratioToMaxDensity();
}

Datum.prototype.setDensityBarDimensions = function() {
	// Set position/dimension used when displaying this datum as a
	// single bar on the treemap
	this.bar['density'] = {
		'x': this.node.innerX(),
		'y': this.node.innerY(),
		'width': this.rescaledWidth(),
		'height': this.node.innerHeight()
	};
}



/*
--------------------------------------------------------------
Arrays of ElementStats compiled for a collections of elements
--------------------------------------------------------------
 */

function CollectionStats(compressed, treemap) {
	// Compile a set of element stats for each element in the collection...
	var elementstats_list = this.compileElementSets(compressed, treemap);
	// Then re-map these to node sets, once for each thesaurus node
	this.node_sets = this.compileNodeSets(elementstats_list);
}

CollectionStats.prototype.compileElementSets = function(compressed, treemap) {
	// Compile a set of element stats for each element in the collection
	var cm = new ColourManager();
	var elementstats_list = [];
	for (var i = 0; i < compressed.length; i += 1) {
		var row = compressed[i];
		var element_id = row[0];
		var element_label = row[1];
		var colour = cm.chooseColour(i, element_label);
		var element_stats = new ElementStats(row[2], treemap, element_label, element_id);
		element_stats.addGlobalProperty('colour', colour);
		elementstats_list.push(element_stats);
	}
	return elementstats_list;
}

CollectionStats.prototype.compileNodeSets = function(elementstats_list) {
	// Get an arbitrary ElementStats object, so that we can extract
	// a set of level-2 treemap nodes
	var thesaurus_nodes = [];
	var sample_stats = elementstats_list[0];
	for (var i = 0; i < sample_stats.data.length; i += 1) {
		var datum = sample_stats.data[i];
		thesaurus_nodes.push(datum.node);
	}

	var node_sets = [];
	for (var i = 0; i < thesaurus_nodes.length; i += 1) {
		var node = thesaurus_nodes[i];
		var nset = this.makeNodeSet(node, elementstats_list);
		node_sets.push(nset);
	}
	return node_sets;
}

CollectionStats.prototype.makeNodeSet = function(node, elementstats_list) {
	// Return the set of datum objects corresponding to a given thesaurus node
	var nset = [];
	for (var i = 0; i < elementstats_list.length; i += 1) {
		var element_stats = elementstats_list[i];
		nset.push(element_stats.findNodeData(node));
	}
	return new NodeSet(node, nset);
}

CollectionStats.prototype.maxDensity = function() {
	// Return the highest density of any node set
	if (! this.max_density) {
		this.max_density = 0;
		for (var i = 0; i < this.node_sets.length; i += 1) {
			var node_set = this.node_sets[i];
			var local_density = node_set.density();
			if (local_density > this.max_density) {
				this.max_density = local_density;
			}
		}
	}
	return this.max_density;
}

CollectionStats.prototype.histogramStacks = function() {
	for (var i = 0; i < this.node_sets.length; i += 1) {
		var node_set = this.node_sets[i];
		node_set.setHistogramPositions('count', this.maxDensity());
		node_set.setHistogramPositions('density', this.maxDensity());
	}
	return this.node_sets;
}


function NodeSet(node, data) {
	// Set of datum objects from different elements, all of which
	// correspond to a give thesaurus node.
	this.data = data;
	this.node = node;
}

NodeSet.prototype.sumCount = function() {
	if (! this.sum) {
		this.sum = 0;
		for (var i = 0; i < this.data.length; i += 1) {
			this.sum += this.data[i].count;
		}
	}
	return this.sum;
}

NodeSet.prototype.density = function() {
	return this.sumCount() / this.node.size;
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

NodeSet.prototype.setHistogramPositions = function(mode, max_density) {
	// Create positions for each datum as segments of a horizontal histogram

	var sum;
	if (mode === 'count') {
		sum = this.sumCount();
	} else if (mode === 'density') {
		sum = this.sumRatioToAverageDensity();
	}

	// First, figure out position and width of each datum segment within
	// a unit space. (This will later be rescaled to fit in the
	// treemap space.)
	var running_x = 0;
	for (var i = 0; i < this.data.length; i += 1) {
		var datum = this.data[i];
		var value;
		if (mode === 'count') {
			value = datum.count;
		} else if (mode === 'density') {
			value = datum.ratioToAverageDensity();
		}
		var ratio = value / sum;
		datum.bar[mode] = {
			'ratio': ratio,
			'x': running_x,
			'width': ratio
		};
		running_x += ratio;
	}

	// Rescale so that the bar as a whole is sized to represent the
	// overall density of this node set (relative to the node set with
	// the maximum density).
	var scale_factor = this.density() / max_density;
	for (var i = 0; i < this.data.length; i += 1) {
		var datum_bar = this.data[i].bar[mode];
		datum_bar.x = datum_bar.x * scale_factor;
		datum_bar.width = datum_bar.width * scale_factor;
	}

	// Now fit the bar into the treemap node's inner rectangle area
	var inner_x = this.node.innerX();
	var inner_width = this.node.innerWidth();
	for (var i = 0; i < this.data.length; i += 1) {
		var datum_bar = this.data[i].bar[mode];
		datum_bar.x = (datum_bar.x * inner_width) + inner_x;
		datum_bar.width = datum_bar.width * inner_width;
	}

	// Add y-position + height
	var inner_y = this.node.innerY();
	var inner_height = this.node.innerHeight();
	for (var i = 0; i < this.data.length; i += 1) {
		var datum_bar = this.data[i].bar[mode];
		datum_bar.y = inner_y;
		datum_bar.height = inner_height;
	}

}
