// Solución al ejercicio leccion8_1_mouseEvents

// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    function( callback ){window.setTimeout(callback, 1000 / 60);};
})();

window.addEventListener('load', init);

var canvas=null;
var ctx=null;

// currently active stroke
var stroke = null;
var strokes = []; // Cada uno de los toques simultáneos

function init() {
  canvas = document.querySelector('canvas');
  ctx = canvas.getContext("2d");

  // Set the default line style.
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.fillStyle = "#99a7ff";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = "black";

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);

  requestAnimFrame(drawPointers);
}

function onPointerDown(event) {
  //stroke = new Stroke(event.clientX-canvas.offsetLeft, event.clientY-canvas.offsetTop);
  strokes[event.pointerId] = new Stroke(event.clientX-canvas.offsetLeft, event.clientY-canvas.offsetTop);
}

function onPointerMove(event) {
	// Are we currently drawing this pointer?
  stroke = strokes[event.pointerId];
	if (stroke)
		stroke.addPoint(event.clientX-canvas.offsetLeft, event.clientY-canvas.offsetTop);
};

function onPointerUp(event) {
  delete strokes[event.pointerId];
  //stroke=null;
};

function drawPointers() {
  var i;
  // If we have an active stroke, draw any undrawn segments.
  /*
  if (stroke)
    stroke.draw();
  */
  for (i=0; i<strokes.length; i++)
    if (strokes[i])
      strokes[i].draw();

  requestAnimFrame(drawPointers);
};

function Point(x,y) {
	this.x=x; this.y=y;
}

function Stroke(x,y) {
  this.points = [new Point(x,y)];
}

Stroke.prototype.addPoint = function(x,y) {
	this.points.push(new Point(x,y));
};

Stroke.prototype.draw = function() {
	if (this.points.length<2)
		return;

	ctx.beginPath();
  ctx.moveTo(this.points[0].x, this.points[0].y);
	for (var i=1; i<this.points.length; i++)
      ctx.lineTo(this.points[i].x, this.points[i].y);
	ctx.stroke();
	ctx.closePath();
  this.points = this.points.slice(-1);
};
