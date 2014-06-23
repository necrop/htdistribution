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
