/*
	plataformas.js
	Pendiente de hacer:
		- poner una figura que dé puntos. Podría tener un ctx.rotate que aumenta y disminuye según el número de "frame"
		- que se puedan añadir algunas cosas tocando la pantalla. Donde tocas pones un bono se supersaltos
		- probar el aspecto en un móvil
		- probar el rendimiento en un móvil*
		- añadir niveles. Cada nivel se distingue en el número y posición de plataformas, tamaño y posición del premio, uno o más malvados...
		- dibuja(): dar movimiento al personaje. Puede haber 4 fotogramas que van cambiando cuando avanza
		- añadir un pájaro (como en varioscanvas.html) que sobrevuela cuando te mueres
		- añadir la clase Sprite y que personaje, malvado y premio sean de esa clase
		- mostrar el nivel de una forma más vistosa
		- dibuja(): que las plataformas sean más vistosas, con textura
		- dibuja(): que, en un nivel, haya un fondo móvil (imagen que se mueve)
		- colision_exacta(sprite1, sprite2). Una colisión exacta se produce cuando dos sprites se tocan de verdad.
		  Una manera de lograr una colisión exacta que sea rápida de calcular puede consistir en
			lo siguiente:
			   a. Se cumple colision_rectangular(sprite1, sprite2)
				 b. La intersección entre los bits que no son transparentes no es vacía
			Tal vez podría ayudar el situar el canas en un canvas (son su zindex) y los sprites que pueden
			colisionar en otro (u otros).
			Así sí que es posible detectar si un bit es transparente o no lo es.
      El método exacto podría ser el que se utiliza en la función collideTest() que hay
			en https://msdn.microsoft.com/en-us/library/gg589497(v=vs.85).aspx

  Mejorar la velocidad:
	  - *Mirar varioscanvas.html para poner cada cosa en un plano y no redibujar el fondo entero cada vez, sino clearRect para borrar
		  una figura en su antigua posición antes de redibujar la misma en la nueva posición



	Estoy construyendo esto a partir de:
	 	- pong_cssdeck.js
		- inspirado en https://youtu.be/DOxHryAFdBs (Simulando la gravedad y los MRUA. "Juegos de plataformas" con Scratch)
		- inspirado también en el gran http://www.juegos.com/juego/super-mario-bros-mezcla-de-estrellas-3
		- sonidos de http://www.sonidosmp3gratis.com/juego
		- http://blog.sklambert.com/html5-canvas-game-panning-a-background y el resto del tutorial
	Además, estoy estudiando distintos tipos de colisiones. De momento utilizo la rectangular
	Posibilidades en estudio:
	   - utilización de varios "canvas" (zindex) y redibujar sólo lo imprescindible (ctx.clearRect)
		 - ctx.rotate, ctx.translate, ctx.clearRect
*/

var
	terrenoDeJuego = document.getElementById("terrenoDeJuego"),
	ctx = terrenoDeJuego.getContext("2d"),
	nivel,
	personaje,
	malvado,
	premio,
	plataformas = [],
	fuerzas = { gravedad: 0, rozamiento: 0},
	sonidoMuerte,
	sonidoPremio,
	ipc=0,	// Imágenes pendientes de carga
	escenarioPendiente,
	juegoParado;

window.onload = function () {
		// Redimensionar el terreno de juego para que ocupe todo el espacio disponible
		//terrenoDeJuego.height=terrenoDeJuego.parentElement.clientHeight;
		terrenoDeJuego.height=document.getElementById("contenido").clientHeight;
		//terrenoDeJuego.width=terrenoDeJuego.parentElement.clientWidth;
		terrenoDeJuego.width=document.getElementById("contenido").clientWidth;

		// Crear el personaje, que es un "sprite"
		personaje = new Object();
		personaje.imgDerecho = new Image();
		personaje.imgDerecho.src='goomba.png';
		personaje.imgReves = new Image();
		personaje.imgReves.src='goombar.png'
		personaje.img = personaje.imgDerecho;
		// personaje.x=0;
		// personaje.y=0;
		// personaje.vx=0; // Velocidad horizontal
		// personaje.vy=0; // Velocidad vertical
		ipc++;
		personaje.img.onload = function() {
			ipc--;
			personaje.w=120;
			personaje.h=120;
			ctx.drawImage(personaje.img,personaje.x,personaje.y,personaje.w, personaje.h);
		};

		malvado = new Object();
		malvado.img = new Image();
		malvado.img.src = "malvado.png";
		// malvado.y = terrenoDeJuego.height-100;
		ipc++;
		malvado.img.onload = function () {
			ipc--;
			// http://stackoverflow.com/questions/5933230/javascript-image-onload
			// Dice que cuando la imagen se recupera de la caché a veces no se dispara este evento
			malvado.w=malvado.img.width=100;
			malvado.h=malvado.img.height=100;
			// malvado.x = terrenoDeJuego.width-malvado.w*2;
			ctx.drawImage(malvado.img, malvado.x, malvado.y, malvado.w, malvado.h);
		}

		premio = new Object();
		premio.img = new Image();
		premio.img.src="premio.png";
		// premio.x=terrenoDeJuego.width-100;
		// premio.y=10;
		ipc++;
		premio.img.onload = function() {
			ipc--;
			premio.h=100;
			premio.w=100;
			ctx.drawImage(premio.img, premio.x, premio.y, premio.w, premio.h);
		}

		sonidoMuerte = new Audio('ahooga.wav');
		sonidoPremio = new Audio('beso.wav');

		// Esperar así a que se carguen las imágenes colapsaría la CPU y no permitiría su carga:
		// while (ipc) {}

		nivel=1;
		nuevoEscenario(nivel);

		//msjUsuario("Cargado");

		juegoParado=false;
		// Poner en marcha la animación
		bucleAnimacion();

		// Movimientos del usuario
		window.addEventListener('keydown', pulsaTecla, true);

}

function nuevoEscenario(nivel) {
	// Si no se han cargado las imágenes no puedo dibujar el nuevo escenario.
	// Como, además, me faltan datos como, por ejemplo, malvado.h, no puedo hacer nada de momento.
	if (ipc) {
		escenarioPendiente=true;
		return;
	}
	escenarioPendiente=false;

	// Destruir escenario anterior
	plataformas=[];
	// Preparar nuevo escenario
	personaje.x=0;
	personaje.y=0;
	personaje.vx=0; // Velocidad horizontal
	personaje.vy=0; // Velocidad vertical
	if (nivel==1) {
			malvado.x = terrenoDeJuego.width-malvado.w*2;
			malvado.y = terrenoDeJuego.height-malvado.h;
			premio.x=terrenoDeJuego.width-premio.w;
			premio.y=10;
			// Crear plataformas
			plataformas.push(new creaPlataforma(0, 200, 300, 40));
			plataformas.push(new creaPlataforma(300, 240, 200, 40));
			plataformas.push(new creaPlataforma(500, 200, 200, 40));
			plataformas.push(new creaPlataforma(terrenoDeJuego.width-50, 200, 50, 40));
			plataformas.push(new creaPlataforma(0,  terrenoDeJuego.height-25, terrenoDeJuego.width, 25));
			// Gravedad
			fuerzas.gravedad=1;
			fuerzas.rozamiento=0.02;
	}
	if (nivel==2) {
		personaje.w-=20;
		personaje.h-=20;
		malvado.x = terrenoDeJuego.width-100-malvado.img.width;
		malvado.y = terrenoDeJuego.height-100;
		premio.x=terrenoDeJuego.width-100;
		premio.y=10;
		premio.h-=10;
		premio.w-=10;
		// Crear plataformas
		plataformas.push(new creaPlataforma(0, 200, 300, 30));
		plataformas.push(new creaPlataforma(300, 240, 200, 30));
		plataformas.push(new creaPlataforma(500, 200, 100, 30));
		plataformas.push(new creaPlataforma(terrenoDeJuego.width-150, 250, 50, 20));
		plataformas.push(new creaPlataforma(0,terrenoDeJuego.height-25, terrenoDeJuego.width, 25));
		// Gravedad
		fuerzas.gravedad=2;
		fuerzas.rozamiento=0.01;
	}
	if (nivel==3) {
		malvado.h+=5;
		malvado.w+=5;
		malvado.x = terrenoDeJuego.width-malvado.w*2;
		malvado.y = terrenoDeJuego.height-malvado.h;
		premio.h-=10;
		premio.w-=10;
		premio.x=terrenoDeJuego.width-premio.w;
		premio.y=10;
		// Crear plataformas
		plataformas.push(new creaPlataforma(0, 200, 300, 20));
		plataformas.push(new creaPlataforma(300, 240, 200, 20));
		plataformas.push(new creaPlataforma(500, 200, 100, 20));
		plataformas.push(new creaPlataforma(terrenoDeJuego.width-100, 250, 50, 20));
		plataformas.push(new creaPlataforma(0,terrenoDeJuego.height-25, terrenoDeJuego.width, 25));
		// Gravedad
		fuerzas.gravedad+=2;
		fuerzas.rozamiento/=10;
	}
	msjUsuario("Nivel "+nivel);
}



function creaPlataforma(x, y, w, h) {
	this.x=x;
	this.y=y;
	this.w=w;
	this.h=h;
}

function msjUsuario(msj) {
	document.getElementById("estado").innerHTML=msj;
	}

function bucleAnimacion() {
	init = requestAnimFrame(bucleAnimacion);
	if (ipc) return; // Si quedan imágenes por cargar (onload) no intento dibujar nada.
	if (escenarioPendiente) nuevoEscenario(nivel);
	dibuja();
	accion();
}

function pulsaTecla(e) {
		switch (e.keyCode) {
			case 13:
				// Intro reinicia el juego, si está parado
				if (juegoParado) {
					juegoParado=false;
					nuevoEscenario(nivel);
					bucleAnimacion();
				}
				break;
			case 37:
				// Flecha izquierda
				if (personaje.vx>-5) personaje.vx-=0.5;
				break;
			case 39:
				// Flecha derecha
				if (personaje.vx<5) personaje.vx+=0.5;
				break;
			case 40:
				// Flecha abajo
				// personaje.vx=0; // Frenazo en seco
				// personaje.vy++; // Caer más deprisa
				break;
			case 38:
				// Flecha arriba
				personaje.vy=-60; // Suficiente como para subirse a una plataforma
				break;
			default:
				// msjUsuario("Sólo valen las fechas y tú has pulsado "+e.keyCode)
		}
}

function dibuja() {
	// Dibujar según las coordenadas actuales de cada cosa

	// Dibujar el terreno de juego
	ctx.clearRect(0, 0, terrenoDeJuego.width, terrenoDeJuego.height);

	// Dibujar plataformas
	for(var i = 0; i < plataformas.length; i++) {
		p = plataformas[i];
		ctx.fillStyle = "brown";
		ctx.fillRect(p.x, p.y, p.w, p.h);
	}

	//ctx.rotate(1); Sólo afecta a lo que se dibuja después
	//ctx.fillRect(malvado.x, malvado.y, malvado.w, malvado.h);
	ctx.drawImage(malvado.img, malvado.x, malvado.y, malvado.w, malvado.h);
	//ctx.rotate(-1);

	//ctx.fillRect(premio.x, premio.y, premio.w, premio.h);
	ctx.drawImage(premio.img, premio.x, premio.y, premio.w, premio.h);

	// Dibujar personaje
	if (personaje.vx>0) personaje.img=personaje.imgDerecho;
	if (personaje.vx<0) personaje.img=personaje.imgReves;
	//ctx.fillRect(personaje.x, personaje.y, personaje.w, personaje.h);
	ctx.drawImage(personaje.img,personaje.x,personaje.y,personaje.w,personaje.h);
}

function accion() {
	// Actualizar la posición de todos los objetos móviles
	// Aquí está toda la lógica del juego

	if (sobre_una_plataforma()) {
		if (personaje.vy<0) personaje.y+=personaje.vy; // Saltar
		if (personaje.vx-fuerzas.rozamiento>0) personaje.vx-=fuerzas.rozamiento;
		if (personaje.vx+fuerzas.rozamiento<0) personaje.vx+=fuerzas.rozamiento;
	}
	else {
		if (sobrevuela_cerca_plataforma(fuerzas.gravedad))
			// Está sobrevolando muy cerca, pero no está sobre_una_plataforma.
			personaje.y++;
	  else
		  personaje.y+=fuerzas.gravedad;
	}
	if (personaje.vy<0) personaje.vy++; // Si estás saltando, baja poco a poco

	if (personaje.vx<0) {
		// Intenta ir hacia la izquierda
		// Hay que comprobar que no se sale del terreno por la izquierda y que no hay una
		// plataforma justo a su izquierda que le impida seguir.
		if (personaje.x>0 && !(tocando_derecha_plataforma())) {
			personaje.vx=corrije_velocidad_izquierda(personaje.vx);
		  personaje.x+=personaje.vx;
		}	else
		   personaje.vx=0;
	}

	if (personaje.vx>0) {
		// Intenta ir hacia la derecha
		if ((personaje.x+personaje.w<terrenoDeJuego.width) && !(tocando_izquierda_plataforma())) {
			personaje.vx=corrije_velocidad_derecha(personaje.vx);
			personaje.x+=personaje.vx;
		} else
			personaje.vx=0;
	}
	if (colision_malvado()) {
		gameOver('M');
		nivel=1; // Volvemos al nivel inicial
		}
	if (colision_premio()) {
		gameOver('P');
		nivel++;
	}

}

function colision_plataformas() {
	// Comprobar si hay colisión del personaje con alguna de las plataformas
	// Es como decir si hay intersección entre dos rectángulos
	for(var i = 0; i < plataformas.length; i++) {
		p = plataformas[i];
		if (personaje.x<=p.x+p.w && personaje.x+personaje.w>=p.x		 // Colisión en eje X
				&& personaje.y<=p.y+p.h && personaje.y+personaje.h>=p.y) // Colisión en eje Y
				return true;
	}
	return false;
}

function colision_malvado() {
  return colision_rectangular(personaje, malvado);
	/*
	  Si hay una colisión rectangular, hay que mirar mejor dentro de la intersección.
		Esa intersección tiene estos parámetros:
	*/
	col.x=Math.max(personaje.x, malvado.x);
	col.y=Math.max(personaje.y, malvado.y);
	col.finx=Math.min(personaje.x+personaje.w, malvado.x+malvado.w);
	col.finy=Math.min(personaje.y+personaje.h, malvado.y+malvado.h);
	col.w=col.finx-col.x;
	col.h=col.finy-col.y;
	/*
		Ahora hay que mirar byte a byte todo el rectángulo que define la intersección
		para ver si un mismo byte está ocupado por ambos sprites, es decir, si ambos
		tienen un color (r, g o b) en la misma coordenada.
		Esta manera de trabajar sólo es posible si cada sprite está situado en un
		canvas diferente, pues de lo contrario el fondo nos impediría trabajar.
		Además, se recomienda que el fondo no sea del mismo color que uno de los sprites,
		pues parecerá que no chocan cuando realmente sí que lo están haciendo.
	*/
	var interP=ctxPersonaje.getImageData(col.x, col.y, col.w, col.h);
	var interM=ctxMalvado.getImageData(col.x, col.y, col.w, col.h);
	for (i=0; i<col.w*col.h*4; i+=4) {
		// El cuarto byte es la transparencia. 0 indica transparencia total.
		if (interP.data[i+3]==0 || interM.data[i+3]==0) continue;
		if (interP.data[i] && interM.data[i]) return true; // Colisión en color rojo
		if (interP.data[i+1] && interM.data[i+1]) return true; // Colisión en color verde
		if (interP.data[i+2] && interM.data[i+2]) return true; // Colisión en color azul
	}


}

function colision_rectangular(a, b) {
	return a.x<=b.x+b.w && a.x+a.w>=b.x	// Colisión en eje X
	    && a.y<=b.y+b.h && a.y+a.h>=b.y // Colisión en eje Y
}

function colision_premio() {
  //return colision_rectangular(personaje.x, personaje.y, personaje.w, personaje.h,														  premio.x, premio.y, premio.w, premio.h);
	return colision_rectangular(personaje, premio);
}

function sobre_una_plataforma() {
	// Comprobar si el personaje está encima de una plataforma
	// Es como decir si la parte de más abajo del personaje (personaje.y+personaje.h)
	// está sobre la parte de más arriba de la plataforma (plataformas[i].y)
	for(var i = 0; i < plataformas.length; i++) {
		p = plataformas[i];
		if (personaje.x<=p.x+p.w && personaje.x+personaje.w>=p.x		// Colisión en eje X
				// && personaje.y+personaje.h==p.y) // Si no fueran números enteros habría que redondear
				&& personaje.y+personaje.h <= p.y												// Encima de la plataforma
				&& personaje.y+personaje.h >= p.y-0.5)									// A 0.5 píxeles o menos
				return true;
	}
	return false;
}

function sobrevuela_cerca_plataforma(px) {
	// Comprobar si el personaje está encima de una plataforma a una distancia inferior a px píxeles
	for(var i = 0; i < plataformas.length; i++) {
		p = plataformas[i];
		if (personaje.x<=p.x+p.w && personaje.x+personaje.w>=p.x		// Colisión en eje X
				// && personaje.y+personaje.h==p.y) // Si no fueran números enteros habría que redondear
				&& personaje.y+personaje.h <= p.y												// Encima de la plataforma
				&& personaje.y+personaje.h >= p.y-px)									// A 0.5 píxeles o menos
				return true;
	}
	return false;
}

function tocando_derecha_plataforma() {
	// Comprobar si el personaje está justo a la derecha de una plataforma
	for(var i = 0; i < plataformas.length; i++) {
		p = plataformas[i];
		if (personaje.x>=p.x+p.w																		 // A la derecha
		    && personaje.x<=p.x+p.w+0.5														   // A 0.5 píxeles o menos
				&& personaje.y<=p.y+p.h	&& personaje.y+personaje.h>=p.y) // Colisión en eje Y
				return true;
	}
	return false;
}

function tocando_izquierda_plataforma() {
	// Comprobar si el personaje está justo a la izquierda de una plataforma
	for(var i = 0; i < plataformas.length; i++) {
		p = plataformas[i];
		if (personaje.x+personaje.w<=p.x														// Estás más a la izquierda
		    && personaje.x+personaje.w>=p.x-0.5											// A 0.5 pixeles o menos
				&& personaje.y<=p.y+p.h	&& personaje.y+personaje.h>=p.y) // Colisión en eje Y
				return true;
	}
	return false;
}


function corrije_velocidad_izquierda(vx) {
	// Sabemos que vx<0 (estrictamente) y no queremos saltar tanto a la izquierda
	// que nos salgamos de la pantalla o nos metamos dentro de una plataforma a la izquierda
	// Esta función devuelve el menor de (vx, distancia a límite izquierdo)
	// SI QUISIÉRAMOS REBOTE, DEVOLVERÍAMOS SIEMPRE -vx O 1 Y LISTO
	if (personaje.x+vx<0) return -personaje.x;
	for(var i = 0; i < plataformas.length; i++) {
		p = plataformas[i];
		if (personaje.x>=p.x+p.w																		 // A la derecha
		    && personaje.x<=p.x+p.w+(-vx) 												   // A vx píxeles o menos
				&& personaje.y<=p.y+p.h	&& personaje.y+personaje.h>=p.y) // Colisión en eje Y
				return (p.x+p.w)-personaje.x;  // Estamos muy cerca, devolvemos la distancia justa

	}
	return vx;
}

function corrije_velocidad_derecha(vx) {
	// Ver comentarios de corrige_velocidad_izquierda()
	if (personaje.x+personaje.width+vx>terrenoDeJuego.width) return terrenoDeJuego.width-(personaje.x+personaje.width);
	for(var i = 0; i < plataformas.length; i++) {
		p = plataformas[i];
		if (personaje.x+personaje.w<=p.x														// Estás más a la izquierda
		    && personaje.x+personaje.w>=p.x-vx											// A vx pixeles o menos
				&& personaje.y<=p.y+p.h	&& personaje.y+personaje.h>=p.y) // Colisión en eje Y
				return p.x-(personaje.x+personaje.w);
	}
	return vx;
}

function gameOver(motivo) {
	ctx.fillStyle = "purple";
	ctx.fillRect(terrenoDeJuego.width/3.5, terrenoDeJuego.height/2.5, terrenoDeJuego.width/2.5, 120);
	ctx.fillStyle = "white";
	ctx.font = "20px Arial, sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	if (motivo=='M') {
		ctx.fillText("Game Over", terrenoDeJuego.width/2, terrenoDeJuego.height/2 );
		msjUsuario("Fin del juego. ESTAS MUERTO.");
		sonidoMuerte.play();
		ctx.fillText("PULSA INTRO PARA REINICIAR", terrenoDeJuego.width/2, terrenoDeJuego.height/2 + 25 );
	}
	if (motivo=='P') {
		ctx.fillText("Nivel Completado", terrenoDeJuego.width/2, terrenoDeJuego.height/2 );
		msjUsuario("Fin del juego. ¡LO CONSEGUISTE! Pasas al nivel siguiente");
		sonidoPremio.play();
		ctx.fillText("PULSA INTRO PARA SEGUIR", terrenoDeJuego.width/2, terrenoDeJuego.height/2 + 25 );
	}


	// Stop the Animation
	cancelRequestAnimFrame(init);

	juegoParado=true;
}

// 60 FPS utilizando el mejor método disponible
window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame    ||
		window.oRequestAnimationFrame      ||
		window.msRequestAnimationFrame     ||
		function( callback ){
			return window.setTimeout(callback, 1000 / 60);
		};
})();

window.cancelRequestAnimFrame = ( function() {
	return window.cancelAnimationFrame          ||
		window.webkitCancelRequestAnimationFrame    ||
		window.mozCancelRequestAnimationFrame       ||
		window.oCancelRequestAnimationFrame     ||
		window.msCancelRequestAnimationFrame        ||
		clearTimeout
} )();
