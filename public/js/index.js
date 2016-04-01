var map;
function initMap() {
	
	map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 41.1778751, lng: -8.597915999999941},
        zoom: 15
    });
	
	if (navigator.geolocation) {
		window.alert('geolocation on');
	     navigator.geolocation.getCurrentPosition(function (position) {
	         initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
	         map.setCenter(initialLocation);
	         console.log(position);

	        var marker = new google.maps.Marker({
			    position: initialLocation
			});

			// To add the marker to the map, call setMap();
			marker.setMap(map);
	     });
	 }else {
	 	window.alert('geolocation off');
	 }
};


