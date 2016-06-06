var map;
var lognum = 0;
var initialLocation;
var marker;

/* inicia o map, esta função é chamada pela callback do google maps*/
function initMap() {

	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 41.1778751, lng: -8.597915999999941},
		zoom: 15
	});
	if (navigator.geolocation) {
		log('geolocation on');
	}

	initFog();

	waitingDialog.show('Requesting your location...');
	getUserLocation();
}

/* obter a localização do user e atualizar mapa*/
function getUserLocation() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(sucessUserLocation, errorUserLocation, {
			timeout: 5000,
			enableHighAccuracy: false,
			maximumAge: 90000
		});
	} else {
		log('geolocation off');
	}
}

/* chamada quando recebemos a localização do google */
function sucessUserLocation(position) {
	log('geolocation received');
	initialLocation = new google.maps.LatLng(
		position.coords.latitude,
		position.coords.longitude
	);

	map.setCenter(initialLocation);
	console.log(position);

	marker = new google.maps.Marker({
		position: initialLocation
	});

	// To add the marker to the map, call setMap();
	marker.setMap(map);
	waitingDialog.hide();
	/* == TRACKING ==*/
	var t_options = {
		enableHighAccuracy: false,
		timeout: 5000,
		maximumAge: 0
	};
	navigator.geolocation.watchPosition(t_success, function(err){/* do nothing on errors, just wait for the next success.*/}, t_options);
	
	log("coords: " + position.coords.latitude + " " + position.coords.longitude);
	loadSpeciesFromLocation(position.coords.latitude, position.coords.longitude);
	addUserSpeciesFromLocation(position.coords.latitude, position.coords.longitude);
	
	var heyListen = google.maps.event.addListener(map, "idle", function () {
		map_light(initialLocation);
		google.maps.event.removeListener(heyListen);
	});
}

/* chamada quando à um erro ao receber a localização do google*/
function errorUserLocation(err) {
	log(err.message);
	alert("errorUserLocation "+err.message);
	//getUserLocation();
	//window.location.replace('/');
}

/* chamada quando o user muda de localização */
function t_success( coords ){
	log("coords: " + coords.latitude + " " + coords.longitude);
	var latlng = new google.maps.LatLng( coords.latitude, coords.longitude );
	marker.setPosition( latlng );
	map_light( latlng );
	updateServerArray();
	//log('Sua posição atual é: Latitude : ' + crd.latitude + ',Longitude: ' + crd.longitude + ',Mais ou menos ' + crd.accuracy + ' metros.');
};

/* manda mensagens para aquele div no fim da página que diz: LOG*/
function log(msg) {
	lognum++;
	console.log('\t|#' + lognum + ' ' + arguments.callee.caller.name + ': ' + msg + '|');
}

/* adicionar listeners e isso*/
function setup() {
	$("#logout").on('click', function () {
		window.location.replace("/logout");
	});
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
			 *				options.dialogSize - bootstrap postfix for dialog size, e.g. "sm", "m";
			 *				options.progressType - bootstrap postfix for progress bar type, e.g. "success", "warning".
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