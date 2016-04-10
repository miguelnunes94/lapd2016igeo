var map;
var lognum=0;
var mapDraw;
/* inicia o map, esta função é chamada pela callback do google maps*/
function initMap() {
	
	map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 41.1778751, lng: -8.597915999999941},
        zoom: 15
    });
    enableMapDraw();
    if (navigator.geolocation) {
		log('geolocation on');
	}
	waitingDialog.show('Requesting your location...');
	getUserLocation();

};

/* activar a API de desenhos no mapa */
function enableMapDraw(){
	mapDraw = new google.maps.drawing.DrawingManager({
		drawingMode: google.maps.drawing.OverlayType.MARKER,
		drawingControl: true, //TODO: Mudar isto para False para desactivar os controlos manuais.
		drawingControlOptions: {
			position: google.maps.ControlPosition.TOP_CENTER,
			drawingModes: [
				google.maps.drawing.OverlayType.MARKER,
				google.maps.drawing.OverlayType.CIRCLE,
				google.maps.drawing.OverlayType.POLYGON,
				google.maps.drawing.OverlayType.POLYLINE,
				google.maps.drawing.OverlayType.RECTANGLE
			]
		},
		circleOptions: {
			fillColor: '#ffff00',
			fillOpacity: 1,
			strokeWeight: 5,
			clickable: false,
			editable: true,
			zIndex: 1
		}
	});
	mapDraw.setMap(map);
}

/* obter a localização do user e atualizar mapa*/
function getUserLocation(){
	if (navigator.geolocation) {
	    navigator.geolocation.getCurrentPosition(sucessUserLocation,errorUserLocation,{ timeout: 5000, enableHighAccuracy: true, maximumAge: 90000 });
	 }else {
	 	log('geolocation off');
	 }
};

/* chamada quando recebemos a localização do goole*/
function sucessUserLocation(position){
	log('geolocation received');
	initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
	map.setCenter(initialLocation);
	console.log(position);

	var marker = new google.maps.Marker({
	    position: initialLocation
	});

	// To add the marker to the map, call setMap();
	marker.setMap(map);
	waitingDialog.hide();
	/* == TRACKING ==*/
	var options;
	options = {
	  enableHighAccuracy: true,
	  timeout: 5000,
	  maximumAge: 0
	};
	navigator.geolocation.watchPosition(success, error, options);
	log("coords: "+position.coords.latitude + " " + position.coords.longitude);
	loadSpeciesFromLocation(position.coords.latitude,position.coords.longitude);
};

/* chamada quando à um erro ao receber a localização do google*/
function errorUserLocation(err){
	log(err.message);
	getUserLocation();
	//window.location.replace('/');
};

/* chamada quando o user muda de localização */
function success(crd) {
  log('Sua posição atual é: Latitude : ' + crd.latitude + 'Longitude: ' + crd.longitude  
  	+ 'Mais ou menos ' + crd.accuracy + ' metros.');
};

/* chamada quando dá erro ao pedir para fazer tracking do user */
function error(err) {
	log('ERROR(' + err.code + '): ' + err.message);
  	console.warn('ERROR(' + err.code + '): ' + err.message);
};

/* manda mensagens para aquele div no fim da página que diz: LOG*/
function log(msg){
	lognum++;
	console.log('\t|#'+lognum+' '+arguments.callee.caller.name+': '+msg+'|');
}

/* adicionar listeners e isso*/
function setup(){
	$("#logout").on('click',function(){
		window.location.replace("/logout");
	});
};

/*load bichos para uma localização*/
function loadSpeciesFromLocation(lat, long){
	var species ;
	$.ajax({
		method: "GET",
		url: "/api/getSpeciesFromLocation",
		data: {lat: lat, long:long}
	}).done(function (data){
		console.log(data);
		$("#showSpecies").text("");
		/*data.result.sort(function(a, b){
			return -(a.scientificname.trim().length+a.nomevulgar.trim().length)+(b.scientificname.trim().length+b.nomevulgar.trim().length);
		});*/
		data.result.forEach(function(res, i){
			var cls = "primary";
			if(i%2==0)
 				cls = "success";
			i++;
			$("#showSpecies").append('<button data-toggle="modal" data-target="#modal_'+res.specieid+'" type="button" class="showInfo btn btn-'+cls+'">'+res.nomevulgar.trim()+' ('+res.scientificname.trim()+')</button>');
			
			$("#showSpecies").append('<div id="modal_'+res.specieid+'" class="modal fade" role="dialog">'+
				  +'<div class="modal-dialog">'
				    +'<div class="modal-content">'
				     +'<div class="modal-header">'
				        +'<button type="button" class="close" data-dismiss="modal">&times;</button>'
				        +'<h4 class="modal-title">'+res.nomevulgar.trim()+' ('+res.scientificname.trim()+')</h4>'
				      +'</div>'
				      +'<div class="modal-body">'
				        +'<p><button id="'+res.specieid+'">Ver no Mapa</button>FALTA IR AO GBIFES BUSCAR A INFO E A IMAGEM PARA POR AQUI!</p>'
				      +'</div>'
				      +'<div class="modal-footer">'
				        +'<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'
				      +'</div>'
				    +'</div>'
				  +'</div>'
				+'</div>');
			$("#btn_"+res.specieid).bind("click",function(){
				clearMap();
				loadLocationFromSpecies(res.specieid);
			});
		});
	});
}

/*load localizacao para uma especie, dado o seu id*/
function loadLocationFromSpecies(especie){
	//if(especie==undefined)especie=1;//TODO: TEST CODE: Remove this line!!!
	$.ajax( {
		method: "GET",
		url: "/api/getLocationFromSpecies",
		data: {especie: especie}
	} ).done( function(data){
		console.log(data);
		data.result.forEach( function(res,i){
			var poly;
			var obj = jQuery.parseJSON(res.st_asgeojson);
			poly = obj.coordinates[0];
			paintPoly(poly);
		} );
	} );
}

/*converter coordenadas de um array do loadLocationFromSpecies para coordenadas do google (lat+lng).*/
function ctoc(arr_c){
	var ret = [];
	for(var i=0;i<arr_c.length;i++){
		ret.push( {lat: arr_c[i][0], lng: arr_c[i][1]} );
	}
	return ret;
}

/*pintar poligonos*/
var polys = [];
function paintPoly(coords_real){
	//var N =[38.410695633953928, -8.9952367211616338, 38.498230970741282, -9.020671694551849, 38.475719880830212, -9.1320904314978346, 38.388218770143105, -9.1065232425462455, 38.410695633953928, -8.9952367211616338];
	var coords = ctoc(coord_real);
	var poly = new google.maps.Polygon({
		paths: coords,
		strokeColor: '#FF0000',
		strokeOpacity: 0.8,
		strokeWeight: 2,
		fillColor: '#FF0000',
		fillOpacity: 0.35
	});
	poly.setMap(map);
	polys.push(poly);
}

/*limpar os poligonos para fora do mapa*/
function clearMap(){
	for(var i=0;i<polys.length;i++){
		polys[i].setMap(null);
	}
	polys=[];
}

$(setup);


/**
 * Module for displaying "Waiting for..." dialog using Bootstrap
 *
 * @author Eugene Maslovich <ehpc@em42.ru>
 */

var waitingDialog = waitingDialog || (function ($) {
    'use strict';

	// Creating modal dialog's DOM
	var $dialog = $(
		'<div class="modal fade" data-backdrop="static" data-keyboard="false" tabindex="-1" role="dialog" aria-hidden="true" style="padding-top:15%; overflow-y:visible;">' +
		'<div class="modal-dialog modal-m">' +
		'<div class="modal-content">' +
			'<div class="modal-header"><h3 style="margin:0;"></h3></div>' +
			'<div class="modal-body">' +
				'<div class="progress progress-striped active" style="margin-bottom:0;"><div class="progress-bar" style="width: 100%"></div></div>' +
			'</div>' +
			'<div class="modal-body"><p>If it takes too long please refresh </p></div>' +
		'</div></div></div>');

	return {
		/**
		 * Opens our dialog
		 * @param message Custom message
		 * @param options Custom options:
		 * 				  options.dialogSize - bootstrap postfix for dialog size, e.g. "sm", "m";
		 * 				  options.progressType - bootstrap postfix for progress bar type, e.g. "success", "warning".
		 */
		show: function (message, options) {
			// Assigning defaults
			if (typeof options === 'undefined') {
				options = {};
			}
			if (typeof message === 'undefined') {
				message = 'Loading';
			}
			var settings = $.extend({
				dialogSize: 'm',
				progressType: '',
				onHide: null // This callback runs after the dialog was hidden
			}, options);

			// Configuring dialog
			$dialog.find('.modal-dialog').attr('class', 'modal-dialog').addClass('modal-' + settings.dialogSize);
			$dialog.find('.progress-bar').attr('class', 'progress-bar');
			if (settings.progressType) {
				$dialog.find('.progress-bar').addClass('progress-bar-' + settings.progressType);
			}
			$dialog.find('h3').text(message);
			// Adding callbacks
			if (typeof settings.onHide === 'function') {
				$dialog.off('hidden.bs.modal').on('hidden.bs.modal', function (e) {
					settings.onHide.call($dialog);
				});
			}
			// Opening dialog
			$dialog.modal();
		},
		/**
		 * Closes dialog
		 */
		hide: function () {
			$dialog.modal('hide');
		}
	};

})(jQuery);