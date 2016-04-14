
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
	var coords = ctoc(coords_real);
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

/*pintar quadrado de 'fog'*/
var fogs = [];
var fo=[
		[0,1],
		[1,1],
		[1,0],
		[0,0]
	];

var dtor = Math.PI/180;

var fmult = 2;

var ff1=0.1128/fmult, fa1=10.6365, ff2=0.0914/fmult, fa2=106.1622;
fo[0][0] = ff1*Math.sin(fa1*dtor);
fo[0][1] = ff1*Math.cos(fa1*dtor);
fo[2][0] = ff2*Math.sin(fa2*dtor);
fo[2][1] = ff2*Math.cos(fa2*dtor);
fo[1][0] = fo[0][0]+fo[2][0];
fo[1][1] = fo[0][1]+fo[2][1];

function updMap(){
	fo[0][0] = ff1*Math.sin(fa1*dtor);
	fo[0][1] = ff1*Math.cos(fa1*dtor);
	fo[2][0] = ff2*Math.sin(fa2*dtor);
	fo[2][1] = ff2*Math.cos(fa2*dtor);
	fo[1][0] = fo[0][0]+fo[2][0];
	fo[1][1] = fo[0][1]+fo[2][1];
	clearFog();
	fogBorder(0.5);
	fogInner(0.5);
}

function rdyUpdMap(){
	$("#showSpecies").prepend('X_L:<input type="text" id="u_1" value="0.1164"><br/>'+
							  'X_A:<input type="text" id="u_2" value="10.6365"><br/>'+
							  'Y_L:<input type="text" id="u_3" value="0.0912"><br/>'+
							  'Y_A:<input type="text" id="u_4" value="106.1522"><br/>');
	$("#u_1").bind("change",function(){ff1=parseFloat($("#u_1").val());updMap();});
	$("#u_2").bind("change",function(){fa1=parseFloat($("#u_2").val());updMap();});
	$("#u_3").bind("change",function(){ff2=parseFloat($("#u_3").val());updMap();});
	$("#u_4").bind("change",function(){fa2=parseFloat($("#u_4").val());updMap();});
}

var fx = 41.66162721430806,
	fy = -10.41229248046875;
var flx = 35*fmult, fly = 57*fmult;
//x:0,y:0 to x:35,y:57
function paintFog(x,y,f){
	if(f==undefined)f=0.5;
	if(f>0){
		var sx = fx-y*fo[2][0]+x*fo[0][0],
			sy = fy-y*fo[2][1]+x*fo[0][1];
		var P = [];
		for(var i=0;i<5;i++){
			var n=i%4;
			P.push( {lat: sx+fo[n][0], lng: sy+fo[n][1]} );
		}
		var fog = new google.maps.Polygon({
			paths: P,
			strokeColor: '#000000',
			strokeOpacity: f,
			strokeWeight: 1,
			fillColor: '#000000',
			fillOpacity: f
		});
		fog.setMap(map);
		fogs.push(fog);
	}
}

/*Border à volta do país todo com fog:*/
function fogBorder(f){
	if(f==undefined)f=1;
	for(var y=0;y<=fly;y++)
		for(var x=0;x<=flx;x++)
			if(x==0||x==flx||y==0||y==fly)
				paintFog(x,y,f);
}

/*Tudo EXCEPTO a border.*/
function fogInner(f){
	if(f==undefined)f=0.5;
	for(var y=0;y<=fly;y++)
		for(var x=0;x<=flx;x++)
			if(x!=0&&x!=flx&&y!=0&&y!=fly)
				paintFog(x,y,f);
}

/*Test clicking coordinates.*/
function addClick(){
	google.maps.event.addListener(map, 'click', function(e) {
		console.log(e.latLng.lat()+","+e.latLng.lng());
	});
}

/*test fog*/
function testFog(){
	clearFog();
	clearMap();
	fogBorder(0.6);
	fogInner();
	loadLocationFromSpecies(202);
}

/*limpar TODO o fog*/
function clearFog(){
	for(var i=0;i<fogs.length;i++){
		fogs[i].setMap(null);
	}
	fogs=[];
}