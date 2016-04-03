var map;
var lognum=0;
/* inicia o map, esta função é chamada pela callback do google maps*/
function initMap() {
	
	map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 41.1778751, lng: -8.597915999999941},
        zoom: 15
    });
    if (navigator.geolocation) {
		appendLog('geolocation on');
	}
	getUserLocation();

};

/* obter a localização do user e atualizar mapa*/
function getUserLocation(){
	if (navigator.geolocation) {
	    navigator.geolocation.getCurrentPosition(sucessUserLocation,errorUserLocation,{timeout:20000});
	 }else {
	 	appendLog('geolocation off');
	 }
};

/* chamada quando recebemos a localização do goole*/
function sucessUserLocation(position){
	appendLog('geolocation received');
	initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
	map.setCenter(initialLocation);
	console.log(position);

	var marker = new google.maps.Marker({
	    position: initialLocation
	});

	// To add the marker to the map, call setMap();
	marker.setMap(map);

	/* == TRACKING ==*/
	var options;
	options = {
	  enableHighAccuracy: true,
	  timeout: 5000,
	  maximumAge: 0
	};
	navigator.geolocation.watchPosition(success, error, options);
};

/* chamada quando à um erro ao receber a localização do google*/
function errorUserLocation(){
	appendLog('timetout user location');
	getUserLocation();
};

/* chamada quando o user muda de localização */
function success(pos) {
  appendLog('User moved => lat: '+pos.coords.latitude+' long: '+pos.coords.longitude);
};

/* chamada quando dá erro ao pedir para fazer tracking do user */
function error(err) {
	appendLog('ERROR(' + err.code + '): ' + err.message);
  	console.warn('ERROR(' + err.code + '): ' + err.message);
};

/* manda mensagens para aquele div no fim da página que diz: LOG*/
function appendLog(msg){
	lognum++;
	$("#log").text($("#log").text()+'\t|#'+lognum+': '+msg+'|');
}

/* adicionar listeners e isso*/
function setup(){
	$("#logout").on('click',function(){
		window.location.replace("/logout");
	});
};
$(setup);