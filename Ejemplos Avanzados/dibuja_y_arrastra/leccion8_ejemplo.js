// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    function( callback ){window.setTimeout(callback, 1000 / 60);};
})();

window.addEventListener('load', init); // Yo quito el comentario

var canvas=null;
var ctx=null;

// currently active stroke
var stroke = null;

function init() {
/*    He comentado esto. Funciona sólo con el ratón. */
  canvas = document.querySelector('canvas');
  ctx = canvas.getContext("2d");

  // Set the default line style.
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.fillStyle = "cyan";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = "black";

/*  
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
*/
  // Yo añado esto --->>>
  // Fuente: http://www.desarrolloweb.com/articulos/trabajo-eventos-touch-javascript.html
  // canvas.addEventListener('touchstart', onMouseDown);
  // canvas.addEventListener('touchmove', onMouseMove);
  // canvas.addEventListener('touchend', onMouseUp);
  var obj=document.getElementById("objArrastrable");
  
  var canvas = document.getElementById('objeto'); 
  var ctx= canvas.getContext('2d');
  
  
  obj.addEventListener('touchmove', function(event){
      if (event.targetTouches.length == 1) { 
        var touch = event.targetTouches[0]; 
        // con esto solo se procesa UN evento touch
        obj.style.left = touch.pageX + 'px';
        obj.style.top = touch.pageY + 'px';
        } 
  }, false);        

        
    canvas.addEventListener('touchmove', function(event) { 
     for (var i = 0; i < event.touches.length; i++) { 
    var touch = event.touches[i]; 
     ctx.beginPath();
     // PEDRO FELIP. Yo añado el -offsetLeft y el -offsetTop para que dibuje donde toca.
     // En realidad, habría que ver donde empieza el "canvas", que está desplazado
     // por el objArrastrable.
     ctx.arc(touch.pageX-canvas.offsetLeft, touch.pageY-canvas.offsetTop, 20, 0, 2*Math.PI, true);
     ctx.fill(); 
     ctx.stroke();
     } 
 }, false);    
    

  
  // <<<---
  
  
  requestAnimFrame(drawPointers);
}

function onMouseDown(event) {
	stroke = new Stroke(event.clientX-canvas.offsetLeft, event.clientY-canvas.offsetTop);
}

function onMouseMove(event) {
	// Are we currently drawing this pointer?
	if (stroke)
		stroke.addPoint(event.clientX-canvas.offsetLeft, event.clientY-canvas.offsetTop);
};

function onMouseUp(event) {
  stroke=null;
};

function drawPointers() {
  // If we have an active stroke, draw any undrawn segments.
  if (stroke)
    stroke.draw();

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