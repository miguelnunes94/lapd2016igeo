/*load bichos para uma localização*/
function loadSpeciesFromLocation(lat, long) {
    $.ajax({
        method: "GET",
        url: "/api/getSpeciesFromLocation",
        data: {lat: lat, long: long}
    }).done(function (data) {
        console.log(data);
        $("#showSpecies").text("");

        /*
         $("#showSpecies").prepend('<button id="testFogBtn">Test Fog Grid</button>');
         $("#testFogBtn").bind("click",testFog);
         */

        /*data.result.sort(function(a, b){
         return -(a.scientificname.trim().length+a.nomevulgar.trim().length)+(b.scientificname.trim().length+b.nomevulgar.trim().length);
         });*/
        data.result.forEach(function (res, i) {
            var speciesList = $('#showSpecies');
            var cls = "primary";
            if (i % 2 == 0)
                cls = "success";

            var titulo;
            if (res.nomevulgar.trim() != "Não tem") {
                titulo = res.nomevulgar.trim() + ' (' + res.scientificname.trim() + ')';
            } else {
                titulo = res.scientificname.trim();
            }
            speciesList.append('<button data-toggle="modal" data-target="#modal_' + res.specieid + '" type="button" class="showInfo btn btn-' + cls + '">' + titulo + '</button>');
            loadSpecieGBif(speciesList, res, titulo, "map", "modal_");

        });
    });
}
/*load localizacao para uma especie, dado o seu id*/
function loadLocationFromSpecies(especie) {
    //if(especie==undefined)especie=1;//TODO: TEST CODE: Remove this line!!!
    $.ajax({
        method: "GET",
        url: "/api/getLocationFromSpecies",
        data: {especie: especie}
    }).done(function (data) {
        console.log(data);
        data.result.forEach(function (res, i) {
            var poly;
            var obj = jQuery.parseJSON(res.st_asgeojson);
            poly = obj.coordinates[0];
            paintPoly(poly);
            map.setZoom(6);
        });
    });
}

function addUserSpeciesFromLocation(lat, long) {
    $.ajax({
        method: "POST",
        url: "/api/userSpeciesFromLocation",
        data: {lat: lat, long: long}
    });
}

function loadSpecieGBif(speciesList, res, titulo, source, id) {
    console.log("LoadGbifSpecie");
    var gbifUrl = encodeURI("http://api.gbif.org/v1/species?name=" + res.scientificname.trim()) + "&limit=999999999";
    $.ajax({
        method: "GET",
        url: "/api/gbif",
        data: {gbif: gbifUrl}
    }).done(function (data) {
        data = $.parseJSON(data);
        var bichoFinal = [];
        data.results.forEach(function (bicho, i) {
            if (bicho.references) {
                if (bicho.references.indexOf("en.wikipedia.org") > -1) {
                    bichoFinal.references = bicho.references;
                    /*load wikipedia description*/
                    if (!bichoFinal.description) {
                        $.ajax({
                            method: "GET",
                            url: "/api/gbif",
                            data: {gbif: "http://api.gbif.org/v1/species/" + bicho.key + "/descriptions"}
                        }).done(function (descs) {
                            descs = $.parseJSON(descs);
                            descs.results.forEach(function (desc, i) {
                                if (!bichoFinal.description && desc.language == "eng") {
                                    bichoFinal.description = desc.description;
                                    $('#desc_' + id + res.specieid).text(desc.description);
                                }
                            });
                        });
                    }
                }
            }
            if (!bichoFinal.kingdom) {
                bichoFinal.kingdom = bicho.kingdom;
            }
            if (!bichoFinal.phylum) {
                bichoFinal.phylum = bicho.phylum;
            }
            if (!bichoFinal.order) {
                bichoFinal.order = bicho.order;
            }

            if (!bichoFinal.family) {
                bichoFinal.family = bicho.family;
            }

            if (!bichoFinal.genus) {
                bichoFinal.genus = bicho.genus;
            }
            if (!bichoFinal.species) {
                bichoFinal.species = bicho.species;
            }
            if (!bichoFinal.parent) {
                bichoFinal.parent = bicho.parent;
            }
            if (!bichoFinal.scientificName) {
                bichoFinal.scientificName = bicho.scientificName;
            }
            if (!bichoFinal.rank) {
                bichoFinal.rank = bicho.rank;
            }

            if (!bichoFinal.class) {
                bichoFinal.class = bicho.class;
            }

            if (!bichoFinal.references) {
                bichoFinal.references = bicho.references;
            }
            if (!bichoFinal.image && !$('#img_' + id + res.specieid).attr("src")) {
                /*load image*/
                $.ajax({
                    method: "GET",
                    url: "/api/gbif",
                    data: {gbif: "http://api.gbif.org/v1/species/" + bicho.key + "/media"}
                }).done(function (medias) {
                    medias = $.parseJSON(medias);
                    medias.results.forEach(function (media, i) {
                        if (media.format.indexOf("image") > -1) {
                            $.ajax({//verificar se a image existe
                                url: media.identifier,
                                type: 'HEAD',
                                success: function () {
                                    bichoFinal.image = media.identifier;
                                    media.identifier = media.identifier.replace("https","");
                                    media.identifier = media.identifier.replace("http","");
                                    media.identifier = "https"+media.identifier;
                                    $('#img_' + id + res.specieid).attr("src", media.identifier);
                                    $('#img_card_cat_' + res.specieid).attr("src", media.identifier);
                                }
                            });
                        }
                    });
                });
            }
        });
        speciesList.append(getModalString(bichoFinal, res, titulo, id));
        if (source == "search_bar") {
            $("#btn_" + id + res.specieid).bind("click", function () {
                if (window.location.pathname == "/catalog") {
                    window.location.replace("/" + "#" + res.specieid);
                } else {
                    clearMap();
                    $("#results").empty();
                    $("#" + id + res.specieid).modal("hide");
                    loadLocationFromSpecies(res.specieid);
                }
            });
        } else if (source == "catalog") {
            $("#btn_" + id + res.specieid).bind("click", function () {
                $("#results").empty();
                $("#" + id + res.specieid).modal("hide");
                window.location.replace("/" + "#" + res.specieid);
            });
        } else {
            $("#btn_" + id + res.specieid).bind("click", function () {
                clearMap();
                $("#" + id + res.specieid).modal("hide");
                loadLocationFromSpecies(res.specieid);
            });
        }
    });
}

function getModalString(bicho, res, titulo, id) {
    var img = '<img class="col-md-8 col-xs-12 col-lg-6 img-responsive center-block" id="img_' + id + res.specieid + '" src="' + bicho.image + '">';
    if (bicho.image) {
        img = '<img class="col-md-8 col-xs-12 col-lg-6 img-responsive center-block" id="img_' + id + res.specieid + '" src="' + bicho.image + '">';
    }
    return '<div id="' + id + res.specieid + '" class="modal fade" role="dialog">' + +'<div class="modal-dialog">'
        + '<div class="modal-content">'
        + '<div class="modal-header">'
        + '<button type="button" class="close" data-dismiss="modal">&times;</button>'
        + '<h4 class="modal-title">' + titulo + '</h4>'
        + '</div>'
        + '<div class="modal-body">'
        + img
        + '<br/>'
        + '<p id="desc_' + id + res.specieid + '"></p>'
        + '<table class="table">'
        + '<tbody>'
        + '<tr>'
        + '<th>Scientific Name</th>'
        + '<td>' + bicho.scientificName + '</td>'
        + '</tr>'
        + '<tr>'
        + '<tr>'
        + '<th>Phylum</th>'
        + '<td>' + bicho.phylum + '</td>'
        + '</tr>'
        + '<tr>'
        + '<th>Order</th>'
        + '<td>' + bicho.order + '</td>'
        + '</tr>'
        + '<tr>'
        + '<th>Family</th>'
        + '<td>' + bicho.family + '</td>'
        + '</tr>'
        + '<tr>'
        + '<th>Genus</th>'
        + '<td>' + bicho.genus + '</td>'
        + '</tr>'
        + '<tr>'
        + '<th>Species</th>'
        + '<td>' + bicho.species + '</td>'
        + '</tr>'
        + '<tr>'
        + '<th>Parent</th>'
        + '<td>' + bicho.parent + '</td>'
        + '</tr>'
        + '<tr>'
        + '<th>Class</th>'
        + '<td>' + bicho.class + '</td>'
        + '</tr>'
        + '<tr>'
        //+ '<th>Rank</th>'
        //+ '<td>'+bicho.rank+'</td>'
        //+ '</tr>'
        + '<tr>'
        + '<th>Kingdom</th>'
        + '<td>' + bicho.kingdom + '</td>'
        + '</tr>'
        // + '<th>Reference</th>'
        // + '<td><a href="' + bicho.references + '">' + bicho.references + '</a></td>'
        // + '</tr>'
        + '</tbody>'
        + '</table>'
        + '<button class="btn btn-default" id="btn_' + id + res.specieid + '">Ver no Mapa</button><br/>'
        + '</div>'
        + '<div class="modal-footer">'
        + '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '</div>';
}