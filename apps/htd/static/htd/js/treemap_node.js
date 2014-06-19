/* global $, d3, document_year */
'use strict';

var fill_colours = {1: ['#E5FFE5', '#EDFFED'], 122209: ['#E8FFFF', '#EFFFFF'],
	153072: ['#FFDBFF', '#FFE5FF']};


function TreemapNode(row) {
	this.id = row[0];
	this.root_id = row[1];
	this.level = row[2];
	this.size = row[3];
	this.ratio = row[4];
	this.x = row[5];
	this.y = row[6];
	this.width = row[7];
	this.height = row[8];
	this.sort = row[9];
	this.breadcrumb = row[10];
	this.n = null;
}

TreemapNode.prototype.area = function() {
	return this.width * this.height;
}

TreemapNode.prototype.centreX = function() {
	return this.x + (this.width * .5);
}

TreemapNode.prototype.centreY = function() {
	return this.y + (this.height * .5);
}

TreemapNode.prototype.label = function() {
	if (! this.label_text) {
		var parts = this.breadcrumb.split(/ *\u00bb */);
		this.label_text = parts[parts.length-1];
	}
	return this.label_text;
}

TreemapNode.prototype.fill = function() {
	var shades = fill_colours[this.root_id];
	if (this.n % 2) {
		return shades[0];
	} else {
		return shades[1];
	}
}

TreemapNode.prototype.randomX = function() {
	return (Math.random() * this.width) + this.x;
}

TreemapNode.prototype.randomY = function() {
	return (Math.random() * this.height) + this.y;
}


// Label sizing and positioning, etc. (only used for level-2 labelling)
TreemapNode.prototype.labelFontsize = function() {
	var fontsize = this.height * .15;
	if (fontsize < .02) { fontsize = .02; }
	return fontsize;
}

TreemapNode.prototype.labelX = function() {
	return this.x + .005;
}

TreemapNode.prototype.labelY = function() {
	return this.y + (this.height * .5) + (this.labelFontsize() * .5);
}
