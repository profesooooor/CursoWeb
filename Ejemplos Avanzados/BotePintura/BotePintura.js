// BotePintura.js

// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    function( callback ){window.setTimeout(callback, 1000 / 60);};
})();

window.addEventListener('load', init);

var canvas=null;
var ctx=null;
var modoMuelle;

// currently active stroke
var stroke = null;
var strokes = []; // Cada uno de los toques simultáneos

function init() {
  canvas = document.querySelector('canvas');
  canvas.width=document.body.clientWidth;
  //canvas.height=document.body.clientHeight;
  canvas.height=window.innerHeight-50;
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

  var paleta=document.getElementById("paleta");
  if (paleta.offsetLeft>window.innerWidth) {
    paleta.style.left="50px";
  }
  /*
  paleta.addEventListener('pointermove', function(event) {
      paleta.style.left = event.pageX-paleta.clientWidth/2 + 'px';
      paleta.style.top = event.pageY-paleta.clientHeight/2 + 'px';
    }, false);
  */

  arrastrar=document.getElementById("arrastrar");
  arrastrar.addEventListener('pointermove', function (event) {
    paleta.style.left = event.pageX-arrastrar.clientWidth/2-arrastrar.offsetLeft + 'px';
    paleta.style.top = event.pageY-arrastrar.clientHeight/2-arrastrar.offsetTop + 'px';
    }, false);

//document.getElementById("escribe").innerHTML="paleta.left";

  boteAzul=document.getElementById("boteAzul");
  boteAzul.addEventListener('pointerdown', function (event) {
    ctx.strokeStyle="blue";  }, false);

  boteVerde=document.getElementById("boteVerde");
  boteVerde.addEventListener('pointerdown', function (event) {
    ctx.strokeStyle="green";  }, false);

  boteRojo=document.getElementById("boteRojo");
  boteRojo.addEventListener('pointerdown', function (event) {
    ctx.strokeStyle="red";  }, false);

  modoMuelle=false;
  muelle=document.getElementById("muelle");
  muelle.addEventListener('pointerdown', function (event) {
    modoMuelle=!modoMuelle;
    }, false);

  mas=document.getElementById("mas");
  mas.addEventListener('pointerdown', function (event) {
    ctx.lineWidth++;  }, false);

  menos=document.getElementById("menos");
  menos.addEventListener('pointerdown', function (event) {
    ctx.lineWidth--;  }, false);


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

  if (!modoMuelle) {
    // Líneas
  	ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
  	for (var i=1; i<this.points.length; i++)
        ctx.lineTo(this.points[i].x, this.points[i].y);
  	ctx.stroke();
  	ctx.closePath();
  } else {
    // Circulitos
    for (var i=1; i<this.points.length; i++) {
       ctx.beginPath();
       // PEDRO FELIP. Yo añado el -offsetLeft y el -offsetTop para que dibuje donde toca.
       // En realidad, habría que ver donde empieza el "canvas", que está desplazado
       // por el objArrastrable.
       ctx.arc(this.points[i].x-canvas.offsetLeft, this.points[i].y-canvas.offsetTop, 20, 0, 2*Math.PI, true);
       ctx.fill();
       ctx.stroke();
    }
  }

  this.points = this.points.slice(-1);
};
