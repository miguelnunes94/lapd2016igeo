
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
        '<div class="" style="background-color: gray ;'
        + '  padding: 2px; z-index:' + index + '; opacity: ' + opacity + '">'
        + '<div class="w3-card-12" style="background-color: white;">'
        + '<img id="img_card_cat_'+value.specieid+'" class="img-responsive center-block" '
        + 'src="http://icons.iconarchive.com/icons/icons8/ios7/256/Very-Basic-Help-icon.png">'
        + '<hr/>'
        + '<div class="w3-container w3-center">'
        + '<p class="text-center">' + value.scientificname.trim() + '</p>'
        + '<p class="text-center">' + numVulgar + '</p>'
        + '<button data-toggle="modal" data-target="#modal_cat_' + value.specieid + '" type="button" class="btn btn-default" data-dismiss="modal">Detalhes</button>'
        + '</div>'
        + '</div>'
        + '</div>');

    loadSpecieGBif($("#search_dialogs"),value, tittle,"catalog","modal_cat_");
}

function updateNumSpecies() {
    $("#numSpecies").text(numKnown + "/" + (numKnown + numUnKnown) + " species found");
}
$(setup);