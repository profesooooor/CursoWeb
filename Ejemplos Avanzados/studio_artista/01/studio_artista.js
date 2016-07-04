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
   vx, vy;

window.onload = function () {
	fondo = document.getElementById("fondo");
	ctxfondo = fondo.getContext("2d");



  inicia_artista();

  moveForward(100);
  turnRight(90);
  moveForward(100);

  termina_artista();

}

function inicia_artista() {
  ctxfondo.fillStyle="#FF5555";
  ctxfondo.fillRect(0, 0, fondo.width, fondo.height);
  x=fondo.width/2;
  y=fondo.height/2;
  vx=1; // -1 izquierda, 1 derecha, 0 si no hay movimiento horizontal
  ctxfondo.beginPath();
  ctxfondo.moveTo(x, y);
  vy=0; // -1 arriba, 1 abajo, 0 si no hay movimiento vertical
}

function moveForward(px) {
  x=x+px*vx;
  y=y+px*vy;
  ctxfondo.lineTo(x, y);
}

function turnRight(angulo) {
  if (angulo==90) {
    if (vx==1 && vy==0) {
      vx=0;
      vy=1;
    }
  }
}

function termina_artista() {
  ctxfondo.stroke();
}
