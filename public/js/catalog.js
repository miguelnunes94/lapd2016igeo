//TODO guardar especies quando o user se move
//TODO obter lista de especies e mostrar
var numKnown = 0;
var numUnKnown = 0;
function setup() {
    showSpecies(true, $("#known"));
    showSpecies(false, $("#unknown"));
}


function showSpecies(known, div) {
    $.ajax({
        method: "GET",
        url: "/api/catalog",
        data: {known: known}
    }).done(function (data) {
        if (known)
            numKnown = data.result.length;
        else numUnKnown = data.result.length;
        $.each(data.result, function (index, value) {
            card(div, value, known);
        });
        updateNumSpecies();
    });
}

function card(div, value, known) {
    var index = known ? 0 : 1;
    var opacity = known ? 1 : 0.3;
    var numVulgar = (value.nomevulgar.trim() == 'Não tem') ? '<br>' : value.nomevulgar.trim();
    var tittle;
    if (value.nomevulgar.trim() != 'Não tem') {
        tittle = '<h4 class="modal-title">' + value.nomevulgar.trim() + ' (' + value.scientificname.trim() + ')</h4>';
    } else {
        tittle = '<h4 class="modal-title">' + value.scientificname.trim() + '</h4>'
    }
    div.append(
        '<div style="background-color: gray ;'
        + '  padding: 5px; z-index:' + index + '; opacity: ' + opacity + '">'
        + '<div class="w3-card-12" style="background-color: white;">'
        + '<img class="img-responsive center-block" '
        + 'src="http://icons.iconarchive.com/icons/icons8/ios7/256/Very-Basic-Help-icon.png">'
        + '<hr/>'
        + '<div class="w3-container w3-center">'
        + '<p class="text-center">' + value.scientificname.trim() + '</p>'
        + '<p class="text-center">' + numVulgar + '</p>'
        + '<button data-toggle="modal" data-target="#modal_cat_' + value.specieid + '" type="button" class="btn btn-default" data-dismiss="modal">Detalhes</button>'
        + '</div>'
        + '</div>'
        + '</div>');

    $("#dialogs").append('<div id="modal_cat_' + value.specieid + '" class="modal fade" role="dialog">' + +'<div class="modal-dialog">'
        + '<div class="modal-content">'
        + '<div class="modal-header">'
        + '<button type="button" class="close" data-dismiss="modal">&times;</button>'
        + tittle
        + '</div>'
        + '<div class="modal-body">'
        + '<button id="btn_c_' + value.specieid + '">Ver no Mapa</button><br/>'
        + '<p>Falta por aqui a informação do GBIF (detalhes, descrição e imagem da espécie)</p>'
        + '</div>'
        + '<div class="modal-footer">'
        + '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '</div>');
    $("#btn_c_"+value.specieid).bind("click",function(){
        $("#results").empty();
        $("#modal_search_"+value.specieid).modal("hide");
        window.location.replace("/"+"#"+value.specieid);
    });
}

function updateNumSpecies() {
    $("#numSpecies").text(numKnown + "/" + (numKnown + numUnKnown) + " species found");
}
$(setup);