/*
	plataformas.js
	Poblemas conocidos:
	  - si el navegador es Chrome y se ejecuta localmente, getImageData() da error
		  de seguridad y se interrumpe la ejecución. Por eso, si pudiera detectar
			navegador Chrome + ejecución local, utilizaría colision_rectangular() sin más.
			El equipo de PHASER.JS recomienda instalar un servidor web local para ejecutar
			con el protocolo http en lugar de ftp. Yo, para eso, prefiero publicar y
			probar en la web.
		- colision_exacta() debe mejorarse, pues ahora sólo se detecta con colisiones del mismo
		  color, pero un azul puro con un verde puro no chocarían. Esto se podría
			comprobar utilizando como imagen de "personaje" y de "premio" o "enemigo"
			BolaAmarilla.png y los demás de la carpeta "Para depurar".
		- sólo se puede jugar en pantalla grande, porque no es escalable (de momento)
	Mejoras (de más a menos importante):
		- mejorar el interés del juego (que den más ganas de jugar):
		  - en el nivel 3 que se muevan las plataformas horizontalmente
			- en el nivel 4 que se muevan las plataformas verticalmente
			- en el nivel 5 que se mueva el malvado hacia nuestro personaje
			- que se puedan añadir algunas cosas tocando la pantalla. Donde tocas pones un bono se supersaltos
			- probar el rendimiento en un móvil*
			- añadir un pájaro/cuervo (como en varioscanvas.html) que sobrevuela cuando te mueres
			- añadir la clase Sprite y que personaje, malvado y premio sean de esa clase
			- contador de puntos.
			- poner una figura que dé puntos. Podría tener un ctx.rotate que aumenta y
			  disminuye según el número de "frame"
			- podría tener una velocidad máxima
			- cada plataforma podría tener un factor de rozamiento y de salto diferentes.
		- jugabilidad:
			- al morir o terminar un nivel debe ser posible seguir SIN PULSAR INTRO
		- experimentar otra manera de jugar con función táctil:
			- izquierda es pulsar a la izquierda del personaje
			- pulsar sobre el personaje provoca que salte
			- pulsar sobre ciertos objetos con el dedo ofrecen puntos o accesorios
		- dibuja():
			- animar el mensaje de fin de nivel con CSS
		  - imágenes:
				- animar al personaje (posible uso de sprite sheets)
				- que el personaje lleve accesorios cuando corresponda: muelle, alas
				  paracaídas o propulsores al caer, un escudo protector que lo salva de
					una pequeña colisión, botas que lo lastran, ... aunque lo ideal es que
					los lleve encima, podría haber una zona de la pantalla en la que se
					vieran los accesorios (mochila)
			- mostrar el nivel de una forma más vistosa
			- añadir animación de cuando toca al malvado. Podría ser una animación parecida a la que se
			  produce en pong_cssdeck.js cuando la pelota toca una paleta.
			- que las plataformas sean más vistosas, con textura
		  - que, en un nivel, haya un fondo móvil (imagen que se mueve)
			- que se utilice un efecto parallax (fondos a diferentes velocidades). Por
			  ejemplo, las plataformas se podrían mover horizontalmente mientras un
				fondo animado tiene un paisaje que también se mueve

		- accion():
			- que el malvado crezca con el tiempo
			- que el malvado evolucione (varias imágenes)
			- que el malvado se mueva
			- que haya más de un malvado

  Mejorar la velocidad:
	  - Redibujar el fondo (y demás figuras estáticas) sólo al principio de cada nivel, no en
		  cada fotograma. En varioscanvas.html está hecho. Se trata de utilizar ClearRect() para
			borrar la zona que ocupa un Sprite antes de moverlo, en lugar de borrar todo su canvas.



	Estoy construyendo esto a partir de:
	 	- pong_cssdeck.js
		- inspirado en https://youtu.be/DOxHryAFdBs (Simulando la gravedad y los MRUA. "Juegos de plataformas" con Scratch)
		- inspirado también en el gran http://www.juegos.com/juego/super-mario-bros-mezcla-de-estrellas-3
		- sonidos de http://www.sonidosmp3gratis.com/juego
		- http://blog.sklambert.com/html5-canvas-game-panning-a-background y el resto del tutorial
		- colisión con bitmap: https://msdn.microsoft.com/en-us/library/gg589497(v=vs.85).aspx
*/

var
	terrenoDeJuego = document.getElementById("terrenoDeJuego"),
	ctx = terrenoDeJuego.getContext("2d"),
	nivel,
	personaje,
	malvado,
	premio,
	supersalto,
	plataformas = [],
	fuerzas = { gravedad: 0, rozamiento: 0},
	sonidoMuerte,
	sonidoPremio,
	ipc=0,	// Imágenes pendientes de carga
	escenarioPendiente,
	juegoParado,
	paleta;

var ndepu=0;

window.onload = function () {
	prepararElTerreno();
	prepararPersonaje();
	prepararMalvado();
	prepararPremio();

	sonidoMuerte = new Audio('ahooga.wav');
	sonidoPremio = new Audio('beso.wav');

	// Esperar así a que se carguen las imágenes colapsaría la CPU y no permitiría su carga:
	// while (ipc) {}
	// En lugar de eso, en bucleAnimacion() me espero antes de llamar a dibuja().

	nivel=1;
	nuevoEscenario(nivel);

	juegoParado=false;
	bucleAnimacion();

	// Órdenes del usuario
	window.addEventListener('keydown', pulsaTecla, true);
	prepararPaletaControles();
}

function prepararElTerreno() {
		// Vamos a utilizar varios "canvas" porque, de este modo, el fondo y las
		// figuras que no se mueven sólo las tendremos que dibujar cuando empiece
		// un nuevo nivel.
		// Sin embargo, nuestro personaje no para de moverse y se tiene que redibujar
		// constantemente. Es mejor dibujarlo en un "canvas" que esté por encima
		// del resto.
		// Otro motivo por el que se pueden poner figuras en diferentes "canvas" es
		// que vamos a poder controlar las colisiones con más exactitud, con el método
		// getImageData(). Por eso al malvado lo ponemos en su propio "canvas".
		// Para poder superponer los "canvas" todos deberán tener posicionamiento
		// "absolute". No indicamos ni su "top" ni su "left" porque vamos a dejar
		// que sea HTML/CSS quien decida su posición, simplemente los metemos en
		// un lugar llamado "contenido".
		// Eso sí: nos aseguramos de que coincidan en sus dimensiones.

		// Redimensionar el terreno de juego para que ocupe todo el espacio disponible
		//terrenoDeJuego.height=terrenoDeJuego.parentElement.clientHeight;
		terrenoDeJuego.height=document.getElementById("contenido").clientHeight;
		//terrenoDeJuego.width=terrenoDeJuego.parentElement.clientWidth;
		terrenoDeJuego.width=document.getElementById("contenido").clientWidth;
		terrenoDeJuego.style.border="1 px solid";
		//terrenoDeJuego.style.background-color="rgb(255,0,0)";
		terrenoDeJuego.style.zIndex=0;
		// Para que haga caso del zIndex tiene que tener un posicionamiento "absolute"
		terrenoDeJuego.style.position="absolute";
}

function prepararPersonaje() {
		// Personaje amigo
		var canvasp = document.createElement("canvas");
		canvasp.id = "canvasp";
		canvasp.height=terrenoDeJuego.height;
		canvasp.width=terrenoDeJuego.width;
		canvasp.style.zIndex=5;
		canvasp.style.position="absolute";
		//canvasp.style.top=terrenoDeJuego.offsetTop;
		//canvasp.style.left=terrenoDeJuego.offsetLeft;
		//canvasp.style.border="1 px solid";
		document.getElementById("contenido").appendChild(canvasp);

		ctxPersonaje=canvasp.getContext("2d");

		// Crear el personaje, que es un "sprite"
		personaje = new Object();
		personaje.imgDerecho = new Image();
		personaje.imgDerecho.src='assets/goomba.png';
		personaje.imgReves = new Image();
		personaje.imgReves.src='assets/goombar.png'

		personaje.img = personaje.imgDerecho;

		// personaje.x=0;
		// personaje.y=0;
		// personaje.vx=0; // Velocidad horizontal
		// personaje.vy=0; // Velocidad vertical
		ipc++;
		personaje.img.onload = function() {
			ipc--;
			personaje.w=100;
			personaje.h=100;
			ctxPersonaje.drawImage(personaje.img,personaje.x,personaje.y,personaje.w, personaje.h);
		};
}

function prepararMalvado() {
		// Personaje Malvado
		var canvasm = document.createElement("canvas");
		canvasm.id = "canvasm";
		canvasm.height=terrenoDeJuego.height;
		canvasm.width=terrenoDeJuego.width;
		canvasm.style.zIndex=5;
		canvasm.style.position="absolute";
		//canvasm.style.top=terrenoDeJuego.offsetTop;
		//canvasm.style.left=terrenoDeJuego.offsetLeft;
		//canvasm.style.border="1 px solid";
		document.getElementById("contenido").appendChild(canvasm);

		ctxMalvado=canvasm.getContext("2d");

		malvado = new Object();
		malvado.img = new Image();
		malvado.img.src = "assets/malvado.png";
		// malvado.y = terrenoDeJuego.height-100;
		ipc++;
		malvado.img.onload = function () {
			ipc--;
			// http://stackoverflow.com/questions/5933230/javascript-image-onload
			// Dice que cuando la imagen se recupera de la caché a veces no se dispara este evento
			malvado.w=malvado.img.width=100;
			malvado.h=malvado.img.height=100;
			// malvado.x = terrenoDeJuego.width-malvado.w*2;
			ctxMalvado.drawImage(malvado.img, malvado.x, malvado.y, malvado.w, malvado.h);
		}
}

function prepararPremio() { // Y SUPERSALTO, que va en el mismo "canvas"
	// Sprite "premio"
	var canvaspr = document.createElement("canvas");
	canvaspr.id = "canvaspr";
	canvaspr.height=terrenoDeJuego.height;
	canvaspr.width=terrenoDeJuego.width;
	canvaspr.style.zIndex=5;
	canvaspr.style.position="absolute";
	//canvaspr.style.top=terrenoDeJuego.offsetTop;
	//canvaspr.style.left=terrenoDeJuego.offsetLeft;
	//canvaspr.style.border="1 px solid";
	document.getElementById("contenido").appendChild(canvaspr);

	ctxPremio=canvaspr.getContext("2d");

	premio = new Object();
	premio.img = new Image();
	premio.img.src="assets/premio.png";
	// premio.x=terrenoDeJuego.width-100;
	// premio.y=10;
	ipc++;
	premio.img.onload = function() {
		ipc--;
		premio.h=100;
		premio.w=100;
		ctxPremio.drawImage(premio.img, premio.x, premio.y, premio.w, premio.h);
	}

	supersalto = new Object();
	supersalto.img = new Image();
	supersalto.img.src="assets/supersalto.svg";

	ipc++;
	supersalto.img.onload = function() {
		ipc--;
		supersalto.h=50;
		supersalto.w=50;
		ctxPremio.drawImage(supersalto.img, supersalto.x, supersalto.y, supersalto.w, supersalto.h);
	}

}

function prepararPaletaControles() {
	paleta=document.getElementById("paleta");
	// paleta.style.left="50px";	// <-- Así cambiaríamos la paleta de sitio

	// La paleta debe estar encima de todo lo demás, o no podremos pulsar sobre ella
	// Aunque podría parecer más lógico poner el zIndex en plataformas.html, si
	// lo hacemos veremos que no funciona, así que lo ponemos aquí:
	paleta.style.zIndex=6;
	paleta.arrastreActivado=false;

	arrastrar=document.getElementById("arrastrar");
	arrastrar.addEventListener('pointerdown', function (event) {
		paleta.arrastreActivado=true;
		}, false);
	arrastrar.addEventListener('pointermove', function (event) {
		if (paleta.arrastreActivado) {
			paleta.style.left = event.pageX-arrastrar.clientWidth/2-arrastrar.offsetLeft + 'px';
			paleta.style.top = event.pageY-arrastrar.clientHeight/2-arrastrar.offsetTop + 'px';
		}
		}, false);
	arrastrar.addEventListener('pointerup', function (event) {
		paleta.arrastreActivado=false;
		}, false);

	izq=document.getElementById("izq");
  izq.addEventListener('pointerdown', function (event) { ordenUsuario(37); }, false);

	der=document.getElementById("der");
  der.addEventListener('pointerdown', function (event) { ordenUsuario(39); }, false);

	salto=document.getElementById("salto");
	salto.addEventListener('pointerdown', function (event) { ordenUsuario(38); }, false);
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
			supersalto.x=-100;	// Fuera de la pantalla
			supersalto.y=-100;
			// Crear plataformas
			plataformas.push(new creaPlataforma(0, 200, 300, 40));
			plataformas.push(new creaPlataforma(300, 240, 200, 40));
			plataformas.push(new creaPlataforma(500, 210, 200, 40));
			plataformas.push(new creaPlataforma(850,250,150,40));
			plataformas.push(new creaPlataforma(terrenoDeJuego.width-100, 220, 100, 40));
			plataformas.push(new creaPlataforma(0, terrenoDeJuego.height-25, terrenoDeJuego.width, 25));
			// Gravedad
			fuerzas.gravedad=1;
			fuerzas.rozamiento=0.02;
			fuerzas.potenciaSalto=70;
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
		supersalto.x=140;
		supersalto.y=terrenoDeJuego.height-supersalto.h-40;
		// Crear plataformas
		plataformas.push(new creaPlataforma(0, 200, 300, 30));
		plataformas.push(new creaPlataforma(300, 240, 200, 30));
		plataformas.push(new creaPlataforma(500, 200, 100, 30));
		plataformas.push(new creaPlataforma(800, 450, 100, 30));
		plataformas.push(new creaPlataforma(900, 420, 70, 30));
		plataformas.push(new creaPlataforma(950, 390, 50, 30));
		plataformas.push(new creaPlataforma(1000, 360, 50, 30));
		plataformas.push(new creaPlataforma(1050, 330, 50, 30));
		plataformas.push(new creaPlataforma(950, 290, 50, 30));
		plataformas.push(new creaPlataforma(terrenoDeJuego.width-150, 250, 50, 20));
		plataformas.push(new creaPlataforma(0,terrenoDeJuego.height-25, terrenoDeJuego.width, 25));
		// Gravedad
		fuerzas.gravedad=2;
		fuerzas.rozamiento=0.01;
		fuerzas.potenciaSalto=50;
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
		fuerzas.potenciaSalto=50;
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

function msjDepura(msj) {
	document.getElementById("depura").innerHTML=msj;
	}

function bucleAnimacion() {
	init = requestAnimFrame(bucleAnimacion);
	if (ipc) return; // Si quedan imágenes por cargar (onload) no intento dibujar nada.
	if (escenarioPendiente) nuevoEscenario(nivel);
	dibuja();
	accion();
}

function pulsaTecla(e) {
	ordenUsuario(e.keyCode);
}

function ordenUsuario(codigoOrden) {
		switch (codigoOrden) {
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
				personaje.vy=-fuerzas.potenciaSalto; // Suficiente como para subirse a una plataforma
				break;
			default:
				// msjUsuario(" Orden no válida "+codigoOrden);
		}
}

function dibuja() {
	// Dibujar según las coordenadas actuales de cada cosa

	// Dibujar el terreno de juego
	ctx.clearRect(0, 0, terrenoDeJuego.width, terrenoDeJuego.height);

	// Dibujar plataformas

	var grad;
	for(var i = 0; i < plataformas.length; i++) {
		p = plataformas[i];
		// ctx.fillStyle = "brown";
		grad=ctx.createLinearGradient(p.x,p.y,p.x+p.w,p.y+p.h);
		grad.addColorStop(0,"black");
		grad.addColorStop(0.5,"red");
		grad.addColorStop(1, "white");
		ctx.fillStyle = grad;
		ctx.fillRect(p.x, p.y, p.w, p.h);
	}

	// Dibujar personaje
	if (personaje.vx>0) personaje.img=personaje.imgDerecho;
	if (personaje.vx<0) personaje.img=personaje.imgReves;
	//ctx.fillRect(personaje.x, personaje.y, personaje.w, personaje.h); // Ver contorno rectangular
	ctxPersonaje.clearRect(0, 0, terrenoDeJuego.width, terrenoDeJuego.height); // Optimizable
	ctxPersonaje.drawImage(personaje.img,personaje.x,personaje.y,personaje.w,personaje.h);

	//ctx.rotate(1); Sólo afecta a lo que se dibuja después
	//ctx.fillRect(malvado.x, malvado.y, malvado.w, malvado.h); // Ver contorno rectangular
	ctxMalvado.drawImage(malvado.img, malvado.x, malvado.y, malvado.w, malvado.h);
	//ctx.rotate(-1);

	// Si se ha movido el supersalto o el premio de sitio hay que redibujar
	ctxPremio.clearRect(0, 0, terrenoDeJuego.width, terrenoDeJuego.height); // Optimizable

	//ctx.fillRect(premio.x, premio.y, premio.w, premio.h);
	ctxPremio.drawImage(premio.img, premio.x, premio.y, premio.w, premio.h);

	ctxPremio.drawImage(supersalto.img, supersalto.x, supersalto.y, supersalto.w, supersalto.h);

}

function accion() {
	/*
		Aquí está toda la lógica del juego.
		Primero, detectar si se dan las condiciones de fin del juego.
		Depués, calcular el próximo movimiento de cada objeto móvil.
	*/

	if (colision_malvado()) {
		gameOver('M');
		nivel=1; // Volvemos al nivel inicial
		}
	if (colision_premio()) {
		gameOver('P');
		nivel++;
	}

	if (colision_supersalto()) {
		fuerzas.potenciaSalto*=2;
		//supersalto.x=-100; // Fuera de la pantalla
		supersalto.x-=100; // Ponemos el "premio" de supersalto más a la izquierda
										   // Si queda dentro de la pantalla tendrá un segundo supersalto
	}

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
	return colision_perfecta(personaje, malvado, ctxPersonaje, ctxMalvado);
}


function colision_premio() {
	//return colision_rectangular(personaje, premio);
	return colision_perfecta(personaje, premio, ctxPersonaje, ctxPremio);
}

function colision_supersalto() {
	return colision_perfecta(personaje, supersalto, ctxPersonaje, ctxPremio);
}

function colision_perfecta(a, b, ctxA, ctxB) {
	/*
		Vamos a ver si hay una colisión entre dos Sprites, el A y el B.
		Esta función sólo puede utilizarse si ambos Sprites están en dos "canvas"
		diferentes, cuyos contextos 2d son ctaA y ctxB.
	*/
	var col={};
	if (!colision_rectangular(a, b)) return false;
	// msjDepura("hay colisión rectangular "+(++ndepu));
	/*
	  Hay una colisión rectangular, es decir, que el rectángulo que reodea a cada
		una de las dos figuras toca con el de la otra figura.
		Cuando se tocan es porque hay una intersección entre esos dos rectágulos.
		Esa intersección es, también, un rectángulo.
		Vamos a mirar bien en esa intersección para ver si, realmente, se están
		tocando píxeles del personaje bueno y del malvado.
	*/
	/*
		La intersección es el rectángulo definido por col.x, col.y, col.w, col.h.
	*/
	col.x=Math.max(a.x, b.x);
	col.y=Math.max(a.y, b.y);
	col.finx=Math.min(a.x+a.w, b.x+b.w);
	col.finy=Math.min(a.y+a.h, b.y+b.h);
	col.w=col.finx-col.x;
	col.h=col.finy-col.y;
	if (col.w<1 || col.h<1) return;
	/*
		Ahora hay que mirar byte a byte todo el rectángulo que define la intersección
		para ver si un mismo byte está ocupado por ambos sprites, es decir, si ambos
		tienen un color (r, g o b) en la misma coordenada (y que no sea transparente).
		Esta manera de trabajar sólo es posible si cada sprite está situado en un
		canvas diferente, pues de lo contrario el fondo nos impediría trabajar.
		Además, se recomienda que el fondo no sea del mismo color que uno de los sprites,
		pues parecerá que no chocan cuando realmente sí que lo están haciendo.
	*/

	//var inter=ctx.getImageData(col.x, col.y, col.w, col.h);
	//msjDepura("Colisión rectangular ("+col.x+", "+col.y+", "+col.w+", "+col.h+")");
	var interA=ctxA.getImageData(col.x, col.y, col.w, col.h);
	var interB=ctxB.getImageData(col.x, col.y, col.w, col.h);

	// i=col.w*col.h;
	// alert("Tamaño del cuadro: "+i+" que es 4 veces menos que "+interP.data.length);
	//
	// //for (i=0; i<col.w*col.h*4; i+=4) {interP.data[i]=255; interP.data[i+2]=150;}
	// ctx.putImageData(inter,0,0);
	// ctxPersonaje.putImageData(interP,0,200);
	// ctxMalvado.putImageData(interM,0,400);

	for (i=0; i<col.w*col.h*4; i+=4) {
		// El cuarto byte es la transparencia. 0 indica transparencia total.
		if (interA.data[i+3]==0 || interB.data[i+3]==0) continue;
		if (interA.data[i] && interB.data[i]) 		return true; // Colisión en color rojo
		if (interA.data[i+1] && interB.data[i+1]) return true; // Colisión en color verde
		if (interA.data[i+2] && interB.data[i+2]) return true; // Colisión en color azul
	}
	return false;
}

function colision_rectangular(a, b) {
	return a.x<=b.x+b.w && a.x+a.w>=b.x	// Colisión en eje X
	    && a.y<=b.y+b.h && a.y+a.h>=b.y // Colisión en eje Y
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
