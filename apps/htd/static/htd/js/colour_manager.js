'use strict';

function ColourManager() {
	this.colours = [
		"#3399FF", // blue
		"#CC0000", // red
		"#99CC33", // green
		"#FFCC00", // yellow
		"#666699",
		"#FF9900", // orange
		"#663366", // purple
		"#006666",
		"#99CCFF", // light blue
		"#CCCC99",
		"#666666",
		"#FFCC66",
		"#6699CC",
		"#9999CC", // lilac
		"#336699",
		"#009999",
		"#999933",
		"#CCCCCC",
		"#669999",
		"#CCCC66",
		"#CC6600",
		"#9999FF",
		"#0066CC",
		"#99CCCC",
		"#999999",
		"#999966",
		"#CC9933",
		"#66CCCC",
		"#339966",
		"#CCCC33"
	];

	this.colour_words = {
		"red": "#FF0000",
		"blue": "#66CCFF",
		"green": "#005A04",
		"yellow": "#FFDE00",
		"pink": "#FF0080",
		"orange": "#FF9900",
		"brown": "#7B4A12",
		"purple": "#6600CC",
		"grey": "#C0C0C0",
		"gray": "#C0C0C0",
		"black": "#000000",
		"white": "#FFFFFF",
		"gold": "#FFCC00",
		"silver": "#C0C0C0"
	};

	// Shades from red to blue, used to fill the histogram bars, depending
	//  on the ratio of this bar to the average density; e.g. if more than
	//  2* the average, the bar will be red; if less than 0.2* the average
	//  it will be dark blue.
	this.shades = [
		[2, '#FF0000'], // red shading to...
		[1.8, '#FF1E00'],
		[1.6, '#FF3D00'],
		[1.4, '#FF5B00'],
		[1.2, '#FF7A00'],
		[1, '#FF9900'],  // ...orange
		[.8, '#336699'], // light blue shading to...
		[.6, '#26598C'],
		[.4, '#194C7F'],
		[.2, '#0C3F72'],
		[0, '#003366'] // ...dark blue
	];
}

ColourManager.prototype.chooseColour = function(i, label) {
	label = label.toLowerCase();
	if (this.colour_words[label]) {
		return this.colour_words[label];
	} else if (i < this.colours.length) {
		return this.colours[i];
	} else {
		return this.colours[this.colours.length-1];
	}
}

ColourManager.prototype.chooseShade = function(value) {
	var selection = this.shades[0][1]; // arbitrary initial value
	for (var i = 0; i < this.shades.length; i += 1) {
		var step = this.shades[i][0];
		var shade = this.shades[i][1];
		if (step <= value) {
			selection = shade;
			break;
		}
	}
	return selection;
}