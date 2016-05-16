//TODO guardar especies quando o user se move
//TODO obter lista de especies e mostrar

function setup() {
    var known = $_GET('known')=='true';
    var div = $("#owned");
    console.log(known);
    $.ajax({
        method: "GET",
        url: "/api/catalog",
        data: {known: known}
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
                + '<p class="text-center">Scientific Name: ' + value.scientificname.trim() + '</p>'
                + '<p class="text-center">Common Name: ' + value.nomevulgar.trim() + '</p>'
                + '</div>'
                + '</div>'
                + '</div>');
        });
    });
}
function $_GET(param) {
    var vars = {};
    window.location.href.replace(location.hash, '').replace(
        /[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
        function (m, key, value) { // callback
            vars[key] = value !== undefined ? value : '';
        }
    );

    if (param) {
        return vars[param] ? vars[param] : null;
    }
    return vars;
}
$(setup);