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
    var numVulgar = (value.nomevulgar.trim()=='Não tem') ? '<br>' : value.nomevulgar.trim();
    div.append('<div style="background-color: gray ;'
        + '  padding: 5px; z-index:' + index + '; opacity: ' + opacity + '">'
        + '<div class="w3-card-12" style="background-color: white;">'
        + '<img class="img-responsive center-block" '
        + 'src="http://icons.iconarchive.com/icons/icons8/ios7/256/Very-Basic-Help-icon.png">'
        + '<hr/>'
        + '<div class="w3-container w3-center">'
        + '<p class="text-center">' + value.scientificname.trim() + '</p>'
        + '<p class="text-center">' + numVulgar + '</p>'
        + '</div>'
        + '</div>'
        + '</div>');
}

function updateNumSpecies() {
    $("#numSpecies").text(numKnown + "/" + (numKnown + numUnKnown) + " species found");
}
$(setup);