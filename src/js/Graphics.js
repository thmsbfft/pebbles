function Graphics(parameters) {

	this.el = document.querySelector('main');
	this.canvas = document.querySelector('canvas');
	this.ct = 0;

	this.isRetina = window.matchMedia('screen and (min-resolution: 2dppx)').matches;
	this.debug = {};

	window.matchMedia('screen and (min-resolution: 2dppx)').addListener(function(e) {
		if (e.matches) {
			this.isRetina = true;
		} 
		else {
			this.isRetina = false;
		}
		
		this.draw();

    }.bind(this));

	paper.setup(this.canvas);

	this.init();
	this.draw();

}

Graphics.prototype.init = function() {

	window.addEventListener('resize', function(e) {
		this.draw();
	}.bind(this));

	this.voronoi = new Voronoi();

}

Graphics.prototype.draw = function() {

	paper.project.activeLayer.removeChildren();

	// View resize
	this.canvas.style = '';
	if(this.isRetina) {
		paper.view.viewSize = new paper.Size(window.innerWidth*2, window.innerHeight*2);
		this.canvas.style.transform = "scale(0.5) translate(-" + window.innerWidth + "px, -" + window.innerHeight + "px)";
	}
	else {
		paper.view.viewSize = new paper.Size(window.innerWidth, window.innerHeight);
	}

	// Debug
	this.debug.target = new paper.Path.Circle(new paper.Point(paper.view.center), paper.view.size.height/3);
	// this.debug.target.strokeColor = 'blue';

	// Voronoi
	this.sites = this.generateBeeHivePoints(paper.view.size / 200, true);

	var margin = 0;
	this.bbox = {
		xl: this.debug.target.bounds.topLeft.x,
		xr: this.debug.target.bounds.topRight.x,
		yt: this.debug.target.bounds.topLeft.y,
		yb: this.debug.target.bounds.bottomLeft.y
	};

	// var margin = 0;
	// this.bbox = {
	// 	xl: margin,
	// 	xr: paper.view.bounds.width - margin,
	// 	yt: margin,
	// 	yb: paper.view.bounds.height - margin
	// };

	this.diagram = this.voronoi.compute(this.sites, this.bbox);
	if(this.diagram) {
		for (var i = 0, l = this.sites.length; i < l; i++) { // this.sites.length
			var cell = this.diagram.cells[this.sites[i].voronoiId];
			if (cell) {
				var halfedges = cell.halfedges,
					length = halfedges.length;
				if (length > 2) {
					var points = [];
					for (var j = 0; j < length; j++) {
						v = halfedges[j].getEndpoint();
						points.push(new paper.Point(v));
					}
					this.createPath(points, this.sites[i]);
				}
			}
		}
	}

	// Debug
	// for (var i = 0; i < this.sites.length; i++) {
	// 	var site = new paper.Path.Circle(this.sites[i], 2);
	// 	site.fillColor = 'grey';
	// }
	console.log(this.ct);

	paper.view.draw();

}

Graphics.prototype.generateBeeHivePoints = function(size, loose) {
	
	var points = [];
	var number = 2000;

	for (var i = 0; i < number; i++) {

		while(true) {
			var dart = new paper.Point(this.debug.target.bounds.width, this.debug.target.bounds.height).multiply(paper.Point.random()).add(this.debug.target.bounds.topLeft);
			if(this.debug.target.contains(dart)) {
				points.push(dart);
				break;
			}
		}

	}

	return points;

}

Graphics.prototype.createPath = function(points, center) {

	var path = new paper.Path();
	path.strokeColor = 'grey';
	path.closed = true;

	for (var i = 0, l = points.length; i < l; i++) {
		var point = points[i];
		var next = points[(i + 1) == points.length ? 0 : i + 1];
		var vector = (next.subtract(point)).divide(2);
		path.add({
			point: point.add(vector),
			handleIn: vector.multiply(-1),
			handleOut: vector
		});
		// var p = new paper.Path.Circle(point, 2);
		// p.fillColor = 'black';
	}
	// path.scale(0.95);
	// path.smooth();
	this.removeSmallBits(path);

	if(path.intersects(this.debug.target)) {
		path.remove();
		return;
	}

	// if(!path.isInside(this.debug.target.bounds)) {
	// 	path.remove();
	// 	return;
	// }

	// Use area center ?
	var areaCenter = new paper.Shape.Circle(path.bounds.center, 0);
	areaCenter.fillColor = 'pink';
	this.ct++;

	while(!path.intersects(areaCenter)) {
		areaCenter.radius += 1;
	}

	// // Use center
	// var dot = new paper.Shape.Circle(center, 0);
	// dot.fillColor = 'pink';
	// while(!path.intersects(dot)) {
	// 	dot.radius += 1;
	// }
	// this.ct++;
}

Graphics.prototype.removeSmallBits = function(path) {

	var averageLength = path.length / path.segments.length;
		var min = path.length / 50;
		for(var i = path.segments.length - 1; i >= 0; i--) {
			var segment = path.segments[i];
			var cur = segment.point;
			var nextSegment = segment.next;
			var next = nextSegment.point.add(nextSegment.handleIn);
			if (cur.getDistance(next) < min) {
				segment.remove();
			}
		}

}