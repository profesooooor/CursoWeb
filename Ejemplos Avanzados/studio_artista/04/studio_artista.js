/*
	studio_artista.js

  Página web que permite que el alumno utilice el código generado en studio.code.org
  en las actividades "el artista".

  Para que comprenda el código, le propondremos unos ejercicios adicionales
  en los que realizará modificaciones diferentes de las vistas en
  studio.code.org

*/


var
   fondo, ctxfondo,
   x, y,
   ang;

window.onload = function () {
	fondo = document.getElementById("fondo");
	ctxfondo = fondo.getContext("2d");



  inicia_artista();

  penColour('#ff0000');
  for (var count = 0; count < 4; count++) {
    moveForward(100);
    turnRight(90);
  }

  termina_artista();

}

function inicia_artista() {
  ctxfondo.fillStyle="#FF5555";
  ctxfondo.fillRect(0, 0, fondo.width, fondo.height);
  x=fondo.width/2;
  y=fondo.height/2;
  ang=0;
  ctxfondo.beginPath();
  ctxfondo.moveTo(x, y);
}

function penColour(col) {
  ctxfondo.strokeStyle=col;
}

function moveForward(px) {
  x=x+px*Math.cos(ang);
  y=y+px*Math.sin(ang);
  ctxfondo.lineTo(x, y);
}

function turnRight(angulo) {
  ang=ang+angulo*2*Math.PI/360;
}

function termina_artista() {
  ctxfondo.stroke();
}
