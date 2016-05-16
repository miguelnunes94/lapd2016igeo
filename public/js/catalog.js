//TODO guardar especies quando o user se move
//TODO obter lista de especies e mostrar

function setup() {
    var div = $("#owned");
    $.ajax({
        method: "GET",
        url: "/api/catalog"
    }).done(function (data) {
        console.log(data);
        $.each(data.result, function (index, value) {
            console.log(value);
            div.append('<div class="col-md-12 col-xs-12 col-lg-12" style="background-color: gray">'
                + '<div class="w3-card-12" style="background-color: white; margin: 1%">'
                + '<img class="img-responsive center-block" '
                + 'src="http://icons.iconarchive.com/icons/icons8/ios7/256/Very-Basic-Help-icon.png">'
                + '<hr/>'
                + '<div class="w3-container w3-center">'
                + '<p class="text-center">Scientific Name: '+value.scientificname.trim()+'</p>'
                + '<p class="text-center">Common Name: '+value.nomevulgar.trim()+'</p>'
                + '</div>'
                + '</div>'
                + '</div>');
        });
    });
}

$(setup);