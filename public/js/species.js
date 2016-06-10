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
		
		/*
		$("#showSpecies").prepend('<button id="testFogBtn">Test Fog Grid</button>');
		$("#testFogBtn").bind("click",testFog);
		*/
		
		/*data.result.sort(function(a, b){
			return -(a.scientificname.trim().length+a.nomevulgar.trim().length)+(b.scientificname.trim().length+b.nomevulgar.trim().length);
		});*/
		data.result.forEach(function(res, i){
			var cls = "primary";
			if(i%2==0)
				cls = "success";
			i++;
			
			$.ajax( {
				method: "GET",
				url: "http://api.gbif.org/v1/species?name="+res.scientificname.trim().substr(0,res.scientificname.trim().indexOf(' '))+"%20"
					+res.scientificname.trim().substr(res.scientificname.trim().indexOf(' ')+1)
			} ).done( function(data){
				console.log(data);
				/*data.result.forEach( function(res,i){
					var poly;
					var obj = jQuery.parseJSON(res.st_asgeojson);
					poly = obj.coordinates[0];
					paintPoly(poly);
					var obj = jQuery.parseJSON(res.st_asgeojson);
					console.log(obj);
				} );*/
			} );
			$("#showSpecies").append('<button data-toggle="modal" data-target="#modal_'+res.specieid+'" type="button" class="showInfo btn btn-'+cls+'">'+res.nomevulgar.trim()+' ('+res.scientificname.trim()+')</button>');
			
			$("#showSpecies").append('<div id="modal_'+res.specieid+'" class="modal fade" role="dialog">'+
				+'<div class="modal-dialog">'
				+'<div class="modal-content">'
				+'<div class="modal-header">'
				+'<button type="button" class="close" data-dismiss="modal">&times;</button>'
				+'<h4 class="modal-title">'+res.nomevulgar.trim()+' ('+res.scientificname.trim()+')</h4>'
				+'</div>'
				+'<div class="modal-body">'
				+'<button id="btn_'+res.specieid+'">Ver no Mapa</button><br/>'
				+'<p>Falta por aqui a informação do GBIF (detalhes, descrição e imagem da espécie)</p>'
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

function addUserSpeciesFromLocation(lat, long) {
	$.ajax({
		method: "POST",
		url: "/api/userSpeciesFromLocation",
		data: {lat: lat, long:long}
	});
}