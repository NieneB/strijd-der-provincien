// Packages
// var d3 = require("d3");
var fs = require("fs");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var ScrollMagic = require('scrollmagic');
var d3 = Object.assign({}, require("d3"), require("graph-scroll"));
var inView = require('in-view');

// ==================================================// 
var provincies = ["Noord-Brabant", "Zuid-Holland", "Provincie_Groningen", "Provincie_Utrecht", "Gelderland", "Noord-Holland", "Flevoland", "Drenthe", "Fryslan", "Limburg", "Zeeland", "Overijssel"];
// var provincies = ["Noord-Brabant", "Zuid-Holland", "Noord-Holland"];
var loader = d3.selectAll('#loader');
var dataset_list = [];
var count = 0;
var width = document.body.clientWidth;
var part = width / 12;
var height = 150;
var dagen = [];
var provinciesSVG;
var path;
// ==================================================//
// start website by requesting data
perProvince(provincies);
// Check untill data is laoded
isloaded();
//  Draw geojson shapes! 
provincieMap();


// Functions
// ==================================================//
// Request per porvince
function perProvince(provincies) {
    provincies.forEach((provincie) => {
        doRequest(provincie);
    });
}

// Timer check if map.style is loaded or not:
function isloaded() {
    var id = setInterval(frame, 40);
    function frame() {
        if (provincies.length == count) {
            // stop timer
            clearInterval(id);
            // remove timer
            d3.selectAll('#loader').remove()    ;
            // Set retrieval data
            d3.select('.tooltiptext').selectAll('span').remove();
            d3.select('.tooltiptext').select('p').append('p').text("van: " + new Date() )
            // Do data crunch en visualization
            makeViz();
            // InViewScroll();
            initScrollMagic();
        } else {
            loader.style("display", "block");
        }
    };
};

// Draw province shapes from geojson
function provincieMap(){
    d3.json('./data/provincies2.json', function(error, data){
        if (error) throw error;
        var features = data.features;
        // PROJECTION
        var projection = d3.geoMercator()
            .fitSize([width, height], data);
        path = d3.geoPath() 
            .projection(projection);
        var svg = d3.select('#graph')
            .append('svg')
            .attr("height", height)
            .attr("width", width);
        provinciesSVG = svg.selectAll('path')
            .data(features)
            .enter()
            .append("path")
            .attr("class", "provincie")
            .attr("d", path)
            .attr("id", function(d){
                return d.properties.statnaam;
            } )
            .attr("stroke", "#0e232e")
            .attr("fill", "#fff")
            ;
    });
};

// URL request per provincie
function doRequest(provincie) {
    var xhr = new XMLHttpRequest();
    var url = 'https://data.overheid.nl/data/api/3/action/package_search?q=maintainer:' + provincie + '&rows=1000';
    xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var myArr = JSON.parse(this.responseText);
            ProvinceDataset(myArr, provincie);
            count ++;
        }
    };
    xhr.open("GET", url, true);
    xhr.send();
};

// Make dataset list from all provinces
function ProvinceDataset(arr, provincie){
    var datasets = arr.result.results;
    // Per provincie, per dataset data ophalen
    for (let i = 0; i < datasets.length; i++) {
        const element = datasets[i];
        dataset_list.push({ "provincie": provincie, "theme": element.theme, "theme2": element.theme_displayname, "name": element.name, "titel": element.title, "source": element.source, "value": element.high_value_dataset, "created": element.modified, "modified": element.metadata_modified, "request_date": new Date() });
    }
};

// start getting data insights
function makeViz(){

    // GROUP PER SOURCE
    var datasetsPerSource = d3.nest()
        .key(function (d) { return d.source; })
        .entries(dataset_list)
        .sort(function (a, b) {
            return new Date(b.created - a.created)
        });
    // GROUP PER PROVINCIE
    var datasetsPerProvince = d3.nest()
        .key(function (d) { return d.provincie; })
        .entries(dataset_list)
        .sort(function (a, b) {
            return new Date(b.created - a.created)
        });

    // General Insights
    var totaalAmount = dataset_list.length;
    d3.select("#totaal").text(totaalAmount);
    var obj = findObjectByKey(datasetsPerSource, 'key', "ngr");
    var ngrAmount
     = obj.values.length;
    d3.select("#geo").text(ngrAmount);
    var nonNgrAmount = totaalAmount- ngrAmount;
    d3.select("#nongeo").text(nonNgrAmount);



  
    const noordbrabant = dataset_list.filter(dataset => dataset.provincie == "Noord-Brabant");

    function dagenVerschil(){
        for (let i  = 0; i  < provincies.length; i ++) {
            const provincie = provincies[i];
            var today = new Date();
            var parts = datasetsPerProvince[i].values[0].created.split('-');
            var mydate = "";
            if(parts[0].length == 2){
                mydate = new Date(parts[2], parts[1] - 1, parts[0]);
            }
            else if(parts[0].length == 4){
                mydate = new Date(parts[0], parts[1],parts[2]);
            }
            else {console.log("other date notation.. : " , parts)}
            dagen.push({ "provincie" : provincie, "dagen": Math.round((today - mydate) / (1000 * 60 * 60 * 24))})
            // console.log(provincie, " dagen ", today, mydate,  Math.round((today - mydate) / (1000 * 60 * 60 * 24)));
        }
    }
    // Aantal dagen sinds laatste publicatie
    dagenVerschil();
    // console.log(dagen)
};

function setRest() {
    var datasetsPerProvince = d3.nest()
        .key(function (d) { return d.provincie; })
        .entries(dataset_list)
        .sort(function (a, b) {
            return new Date(b.created - a.created)
        });

    var aantallen = d3.select("#content_2")
        .append("svg")
        .attr("width", width);

    // aantallen.selectAll('text')
    //     .data(datasetsPerProvince)
    //     .enter()
    //     .append('text')
    //     .transition()
    //     .each(function (d) {
    //         console.log(d)
    //         // console.log(d3.selectAll('svg').select('#' + d.provincie + '.provincie'));
    //         var prov = d3.selectAll('svg').select('#' + d.key + '.provincie');
    //         // console.log(prov.attr("transform"));
    //         var trans = prov.attr("transform");
    //         // prov.transform(d3.select(this.parentNode);
    //         var centroid = path.centroid(prov.datum()),
    //             x = centroid[0],
    //             y = centroid[1];

    //         var node = prov.node();
    //         var bbox = node.getBBox();
    //         var matrix = node.getTransformToElement(node.nearestViewportElement);
    //         //p defaults to 0,0
    //         var p = node.nearestViewportElement.createSVGPoint();
    //         var sp = p.matrixTransform(matrix);

    //         d3.select(this)
    //             .attr("x", x - 20)
    //             .attr("y", 100)
    //             .attr("transform", "translate(" + sp.x + ", 0)");
    //     })
    //     .text(function (d) {
    //         return d.values.length
    //     })
    //     .style("fill", "#fff");
};


// Find object by key https://www.linkedin.com/pulse/javascript-find-object-array-based-objects-property-rafael/
function findObjectByKey(array, key, value) {
    for (var i = 0; i < array.length; i++) {
        if (array[i][key] === value) {
            return array[i];
        }
    }
    return null;
};


// ===========================================//
//SCROLL MAGIC
function initScrollMagic() {
    var controller = new ScrollMagic.Controller();

    // Provincies bij elkaar
    var scene_1 =  new ScrollMagic.Scene({
        triggerElement: "#graph",
        triggerHook: "onCenter",
    })
        .on("change update progress start end enter leave", function () {
            // Provincies bij elkaar! 
            provinciesSVG
                .each(function (d) {
                    var element = d3.select(this);
                    element
                        .transition()
                        .duration(3500)
                        .attr("transform", "translate(0,0)")
                        .style("fill","#fff");
                })
        })
        .addTo(controller);

     // Provincie highlight
    var scene_2 = new ScrollMagic.Scene({
        triggerElement: "#content_2",
        triggerHook: "onCenter",
        duration: 500 
    })
        .on("progress", function (event) {
            console.log("Scene progress changed to " + event.progress);
        })
        .on("enter ", function (event) {
            // Laatste dataset publiceerd text 
            dataset_list.sort((a, b) => {
                return new Date(b.created) - new Date(a.created);
            });
            // console.log(dataset_list[0]);
            var nieuwstetext = dataset_list[0].created;
            d3.select("#nieuwstedatum").text(nieuwstetext);
            var nieuwstedataset = dataset_list[0].titel;
            d3.select("#nieuwsteset").text(nieuwstedataset);

            // animatie op svg
            console.log(dataset_list[0].provincie)
            d3.selectAll('svg').select('#' + dataset_list[0].provincie)
                .transition()
                .duration(100)
                .style("fill", "#5d9840")
        })
        .on("leave", function () {
            console.log(dataset_list[0].provincie)
            d3.selectAll('svg').select('#' + dataset_list[0].provincie)
                .transition()
                .duration(100)
                .style("fill", "#ffffff")
        })

        .addTo(controller);
    
    var scene_3 =  new ScrollMagic.Scene({
        triggerElement: "#content_3",
        triggerHook: "onEnter",
        offset: 400,
        duration: 1000 
    })
        // .setPin("#content_2")
        .on("start", function () {
            // align provinces along line
            provinciesSVG
                .each( function (d, i) {
                    var element = d3.select(this);
                    element
                        .transition()
                        .duration(3500)
                        .attr("transform", function (d) {
                            var centroid = path.centroid(d),
                                x = centroid[0],
                                y = centroid[1];
                            return "translate(" + ((-x + (part * i)) + part / 2) + "," + (-y + height / 2) + ")"; //distribute horizontaly objects along one line. 
                        });
                        
                })
               


            // text label aantal per provincie
            // provinciesSVG.each(function(d) {
            //     d3.select(this)
            //         .append('text')
            //         .text(function (d) {
            //             var aantal = dataset_list.filter(dataset => dataset.provincie == d.properties.statnaam);
            //             console.log(aantal.length)
            //             return aantal.length
            //         })
            //         .attr("x", function (d) {
            //             return path.centroid(d)[0];
            //         })
            //         .attr("y", function (d) {
            //             return path.centroid(d)[1];
            //         })
            //         .style("color", "#517fa7")
            //         .attr("text-anchor", "middle");
            // });

           
            
        })
        .on("leave", function(){
            setRest();
        })
        .addTo(controller);


    var scene_4 = new ScrollMagic.Scene({
        triggerElement: "#content_3",
        triggerHook: "onEnter"

    })
        // .setPin("#content_2")
        .on("start", function () {
            var graph = d3.select('#content_4')
                .append('svg')
                .attr("width", width)
                .attr("height", 3000);

            graph
                .selectAll('rect')
                .data(dagen)
                .enter()
                .append('rect')
                .attr("class", "chart")
                .attr("y", 0)
                .attr("width", "40px")
                .attr("height", "0px")
                .style("fill", "#fff");
            graph.each(function (d) {
                    // console.log(d.provincie)
                    // console.log(d3.selectAll('svg').select('#' + d.provincie + '.provincie'));
                    var prov = d3.selectAll('svg').select('#' + d.provincie + '.provincie');
                    // console.log(prov.attr("transform"));
                    var trans = prov.attr("transform");
                    // prov.transform(d3.select(this.parentNode);
                    var centroid = path.centroid(prov.datum()),
                        x = centroid[0],
                        y = centroid[1];

                    var node = prov.node();
                    var bbox = node.getBBox();
                    var matrix = node.getTransformToElement(node.nearestViewportElement);
                    //p defaults to 0,0
                    var p = node.nearestViewportElement.createSVGPoint();
                    var sp = p.matrixTransform(matrix);

                    d3.select(this)
                        .attr("x", x - 20)
                        .attr("y", 0)
                        .attr("transform", "translate(" + sp.x + ", 0)");
                })
                .transition()
                .duration(7000)
                .attr("height", function (d) { return d.dagen * 10 + "px"; })
                ;

            // graph
            //     .selectAll('rect')
            //     .data(dagen)
            //     .enter()
            //     .append("text")
            //     .text(function (d) {
            //         return d.dagen;
            //     })
            //     .style("color", "#0e232e")
            //     .attr("text-anchor", "top")
            })
        .addTo(controller);
};
