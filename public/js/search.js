$(setup);

function setup() {
    $("#form-search").submit(function (event) {
        event.preventDefault();
    });
    var input = $("#form-search-input");
    var lastText = "";
    input.keyup(function () {
        $("#results").empty();

        if (input.val().length < 3)
            return;
        lastText = input.val();
        doSearch(lastText)

    });
    $("body").append('<div id="search_dialogs"></div>');
}

function doSearch(text) {
    $.ajax({
        method: "GET",
        url: "/api/search",
        data: {text: text}
    }).done(function (data) {
        if (text != $("#form-search-input").val())
            return;
        $("#results").empty();
        console.log(data);
        var results = $("#results");
        data.result.forEach(function (res, i) {
            var nomevulgar = res.nomevulgar.trim();
            var tittle;
            if(nomevulgar!="Não tem"){
                results.append('<li><a href="#" data-toggle="modal" data-target="#modal_search_'+res.specieid+'" type="button">'+
                    res.scientificname.trim()+'('+nomevulgar+')'+'</a></li>');
                tittle = '<h4 class="modal-title">'+res.nomevulgar.trim()+' ('+res.scientificname.trim()+')</h4>';
            }else{
                results.append('<li><a href="#" data-toggle="modal" data-target="#modal_search_'+res.specieid+'" type="button">'+
                    res.scientificname.trim()+'</a></li>');
                tittle = '<h4 class="modal-title">'+res.scientificname.trim()+'</h4>'
            }

            loadSpecieGBif($("#search_dialogs"),res, tittle,"search_bar","modal_search_");

        });
    });
}