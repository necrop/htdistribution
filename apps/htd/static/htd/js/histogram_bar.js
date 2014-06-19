/* global $, d3 */
'use strict';

function HistogramBar(row, thesaurus_node, label) {
	this.count = row[1];
	this.ratio_to_element = row[2];
	this.node = thesaurus_node;
	this.label = label;
}

HistogramBar.prototype.breadcrumb = function() {
	return this.node.breadcrumb;
}

HistogramBar.prototype.ratioToClass = function() {
	return this.count / this.node.size ;
}

HistogramBar.prototype.ratioToMaxRatio = function(max_ratio) {
	return this.ratioToClass() / max_ratio ;
}

HistogramBar.prototype.density = function() {
	return this.count / this.node.size ;
}


// Histogram bar coordinates - based on the coordinates of the corresponding
//  thesaurus node, but leaving a little margin around the edge.
HistogramBar.prototype.x = function() {
	return this.node.x + (this.node.width * 0.02);
}

HistogramBar.prototype.y = function() {
	return this.node.y + (this.node.height * 0.1);
}

HistogramBar.prototype.width = function() {
	return this.node.width * 0.9;
}

HistogramBar.prototype.rescaledWidth = function(max_ratio) {
	return this.width() * this.ratioToMaxRatio(max_ratio);
}

HistogramBar.prototype.height = function() {
	return this.node.height * 0.8;
}

