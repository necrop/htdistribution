/* global $, d3, document_year */
'use strict';

function DataPoint(row, thesaurus_node) {
	this.sense_id = row[0];
	this.year = row[1];
	this.node = thesaurus_node;
	this.xcoord = null;
	this.ycoord = null;
	this.s = null; // sense data
}

DataPoint.prototype.x = function() {
	if (! this.xcoord) {
		this.xcoord = this.node.randomX();
	}
	return this.xcoord;
}

DataPoint.prototype.y = function() {
	if (! this.ycoord) {
		this.ycoord = this.node.randomY();
	}
	return this.ycoord;
}

DataPoint.prototype.breadcrumb = function() {
	return this.node.breadcrumb;
}

DataPoint.prototype.sensedata = function() {
	if (! this.s) {
		senseAjaxCall(this);
	}
	return this.s;
}

DataPoint.prototype.lemma = function() {
	return this.sensedata()[0];
}

DataPoint.prototype.entryID = function() {
	return this.sensedata()[1];
}

DataPoint.prototype.lexid = function() {
	return this.sensedata()[2];
}

DataPoint.prototype.oedUrl = function() {
	return 'http://www.oed.com/view/Entry/' + this.entryID() + '#eid' + this.lexid();
}



function senseAjaxCall(p) {
	$.ajax({
		type: 'GET',
		dataType: 'json',
		url: sense_url + p.sense_id,
		success: function(data) { p.s = data; },
		fail: function(data) {p.s = ['', 0, 0]; },
		async: false
	});
}