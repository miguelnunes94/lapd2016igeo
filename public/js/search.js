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

            $("#search_dialogs").append('<div id="modal_search_'+res.specieid+'" class="modal fade" role="dialog">'+
                +'<div class="modal-dialog">'
                +'<div class="modal-content">'
                +'<div class="modal-header">'
                +'<button type="button" class="close" data-dismiss="modal">&times;</button>'
                +tittle
                +'</div>'
                +'<div class="modal-body">'
                +'<button id="btn_s_'+res.specieid+'">Ver no Mapa</button><br/>'
                +'<p>Falta por aqui a informação do GBIF (detalhes, descrição e imagem da espécie)</p>'
                +'</div>'
                +'<div class="modal-footer">'
                +'<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'
                +'</div>'
                +'</div>'
                +'</div>'
                +'</div>');
            $("#btn_s_"+res.specieid).bind("click",function(){
                console.log(window.location);
                if(window.location.pathname=="/catalog"){
                    window.location.replace("/"+"#"+res.specieid);
                }else{
                    clearMap();
                    $("#results").empty();
                    $("#modal_search_"+res.specieid).modal("hide");
                    loadLocationFromSpecies(res.specieid);
                }
            });
        });
    });
}