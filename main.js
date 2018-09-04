// Packages
var d3 = require("d3");
var fs = require("fs");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var ScrollMagic = require('scrollmagic');



// ==================================================// 
var provincies = ["Noord-Brabant", "Zuid-Holland", "Provincie_Groningen", "Provincie_Utrecht", "Gelderland", "Noord-Holland", "Flevoland", "Drenthe", "Fryslan", "Limburg", "Zeeland", "Overijssel"];
// var provincies = ["Noord-Brabant", "Zuid-Holland", "Noord-Holland"];
var loader = d3.selectAll('#loader');
var dataset_list = [];
dataset_list_niet_ngr = [];
var count = 0;
var width = document.body.clientWidth - (document.body.clientWidth*0.1) ;
var part = width / 12;
var height = 150;
var provinciesSVG;
var graphPerProvince;
var graph;
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
            // Enable scrolling
            d3.select('body').style("overflow-y", "scroll");
            // Show scroll trigger
            d3.select('#scroll').style("height", "45px").style("visibility", 'visible').style("display", "block");
            // stop timer
            clearInterval(id);
            // remove timer
            d3.selectAll('#loader').remove();
            // Set retrieval data
            d3.select('.tooltiptext').selectAll('span').remove();
            d3.select('.tooltiptext').select('#replace').append('span').text("Gegevens opgehaald op: " + new Date() )
            // Do data crunch en visualization
            setViz();
            initScrollMagic();
        } else {
            loader.style("display", "block");
        }
    };
};

// Draw province shapes from geojson
function provincieMap(){
    d3.json('https://raw.githubusercontent.com/NieneB/strijd-der-provincien/master/data/provincies2.json', function(error, data){
        if (error) throw error;
        // DATA
        var features = data.features;
        // PROJECTION
        var projection = d3.geoMercator()
            .fitSize([width, height], data);
        //  PATH
        path = d3.geoPath() 
            .projection(projection);
        // APPEND SVG
        var svg = d3.select('#graph')
            .append('svg')
            .attr("height", height)
            .attr("width", width);
        // PATH PER PROVINCE
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
            .on("mouseover", function(d){
                // var coordinates = d3.mouse(this);
                // var x = coordinates[0];
                // var y = coordinates[1];
                // var th = d3.select(this);
                // console.log(x)
                d3.select(this).append( 'text')
                    .attr("class", "halo")
                    .text(d.properties.statnaam)
                    // .attr('transform', function (d) {
                    //     return "translate(" + path.centroid(d) + ")";
                    // })
                    .attr("x", 30)
                    .attr("y", 50)
                    .style("text-anchor", "middle")
                    .attr("fill", "black")
                    .style("color", "#eee000")
                    .style("font-size","14px");
            })
            .on("mouseout", function(d){
                // d3.select(this).selectAll('text').remove();
            })
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

// Make ONE dataset list from all provinces
function ProvinceDataset(arr, provincie){
    var datasets = arr.result.results;
    // Per provincie, per dataset data ophalen
    for (let i = 0; i < datasets.length; i++) {
        const element = datasets[i];
        // Date in right format
        var parts = element.modified.split('-');
        var mydate = "";
        if (parts[0].length == 2) {
            mydate = new Date(parts[2], parts[1] - 1, parts[0]);
        }
        else if (parts[0].length == 4) {
            mydate = new Date(parts[0], parts[1], parts[2]);
        }
        else { console.log("other date notation.. : ", parts) }

        // Create main dataset list
        dataset_list.push({ "provincie": provincie, "theme": element.theme, "theme2": element.theme_displayname, "name": element.name, "titel": element.title, "source": element.source, "created": new Date(element.metadata_created), "meta_modified": new Date(element.metadata_modified), "modified": new Date(element.modified), "request_date": new Date() });
    }
};

// start getting data insights
function setViz(){
    // CONTENT 1 TOTAL AMOUNT OVERVIEW
    var totaalAmount = dataset_list.length;
    d3.select("#totaal").text(totaalAmount);
    // GROUP PER SOURCE
    var datasetsPerSource = d3.nest()
        .key(function (d) { return d.source; })
        .entries(dataset_list)
        .sort(function (a, b) {
            return new Date(b.created) - new Date(a.created)
        });
    var obj = findObjectByKey(datasetsPerSource, 'key', "ngr");
    var ngrAmount = obj.values.length;
    d3.select("#geo").text(ngrAmount);
    var nonNgrAmount = totaalAmount - ngrAmount;
    d3.select("#nongeo").text(nonNgrAmount);

    dataset_list_niet_ngr = findObjectByKey(datasetsPerSource, 'key', "dataplatform");
    console.log(dataset_list_niet_ngr);
    dataset_list_niet_ngr.values.sort((a, b) => {
        return new Date(b.created) - new Date(a.created);
    });
    // CONTENT 2 LATEST DATASETS PUBLISHED
    dataset_list.sort((a, b) => {
        return new Date(b.created) - new Date(a.created);
    });
    d3.select("#nieuwstedatum1").text(dataset_list[0].created.yyyymmdd());
    d3.select("#nieuwsteset1").text(dataset_list[0].titel + '  -  ' + dataset_list[0].provincie);
    d3.select("#nieuwstedatum2").text(dataset_list_niet_ngr.values[0].created.yyyymmdd());
    d3.select("#nieuwsteset2").text(dataset_list_niet_ngr.values[0].titel + '  -  ' + dataset_list_niet_ngr.values[0].provincie);
    d3.select("#nieuwstedatum3").text(dataset_list[2].created.yyyymmdd());
    d3.select("#nieuwsteset3").text(dataset_list[2].titel + '  -  ' + dataset_list[2].provincie);

    // CONTENT 3 TOTAAL PER PROVINCIE
    var datasetsPerProvince = d3.nest()
        .key(function (d) { return d.provincie; })
        .entries(dataset_list)
        .sort(function (a, b) {
            return new Date(b.created) - new Date(a.created);
        });
   
    graphPerProvince = d3.select('#content_3')
        .append('svg')
        .attr("width", width)
        .attr("height", 300);
    graphPerProvince
        .selectAll('text')
        .data(datasetsPerProvince)
        .enter()
        .append('text')
        .attr("id", function(d){
            return d.key; 
        })
        .text(function(d){
            return d.values.length;
        })
        .style('color', '#0e232e')
        .each(function(d){
            var prov = d3.selectAll('svg').select('#' + d.key + '.provincie');
            var trans = prov.attr("transform");
            var centroid = path.centroid(prov.datum()),
                x = centroid[0],
                y = centroid[1];
            var node = prov.node();
            var bbox = node.getBBox();
            var matrix = node.getTransformToElement(node.nearestViewportElement);
            var p = node.nearestViewportElement.createSVGPoint();
            var sp = p.matrixTransform(matrix);
            d3.select(this)
                .attr("x", x - 20)
                .attr("y", 150)
                .attr("transform", "translate(" + sp.x + ", 0)");
        });

    // CONTENT 4 AANTAL DAGEN SINDS LAATSTE PUB
    // console.log(datasetsPerProvince);

    var dagen = dagenVerschil(datasetsPerProvince);
    var max =  Math.max(...dagen.map(function (key) { return key.dagen; }));
    console.log(dagen);
    var scaleHeight = d3.scaleLinear()
        .domain([0,max])
        .range([0,500])

    graph = d3.select('#content_4')
        .append('svg')
        .attr("width", width)
        .attr("height", 500);
    graph
        .selectAll('rect')
        .data(dagen)
        .enter()
        .append('rect')
        .attr("class", "chart")
        .attr("y", 0)
        .attr("width", "40px")
        .style("fill", "#fff")
        .attr("height", function (d) { return scaleHeight(d.dagen) + "px"; })
        .each(function (d) {
            var prov = d3.selectAll('svg').select('#' + d.provincie + '.provincie');
            var trans = prov.attr("transform");
            var centroid = path.centroid(prov.datum()),
                x = centroid[0],
                y = centroid[1];
            var node = prov.node();
            var bbox = node.getBBox();
            var matrix = node.getTransformToElement(node.nearestViewportElement);
            var p = node.nearestViewportElement.createSVGPoint();
            var sp = p.matrixTransform(matrix);
            d3.select(this)
                .attr("x", x - 20)
                .attr("y", 0)
                .attr("transform", "translate(" + sp.x + ", 0)")
        });
    // graph.selectAll('rect')
    //     .append('text')
    //     .text(function (d) {
    //         return d.dagen
    //     })
    //     .style("color", "#0e232e")
    //     .attr("x", function(d,i){
    //        return i * 10
    //     })
    //     .attr("y", 5);

    // CONTENT 5 THEMAS TOP 10 Themas. en per provincie wat ze meeste doen. 
    var datasetsPerThema = d3.nest()
        .key(function (d) { return d.theme; })
        .entries(dataset_list)
        .sort(function (a, b) {
            return new Date(b.created - a.created)
        });
    console.log(datasetsPerThema);

    // CONTENT 6 Publicatie datum over tijd. 

    // ....
    // ....
    // ....
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

// =========================================
// Overige functies

// Find object by key https://www.linkedin.com/pulse/javascript-find-object-array-based-objects-property-rafael/
function findObjectByKey(array, key, value) {
    for (var i = 0; i < array.length; i++) {
        if (array[i][key] === value) {
            return array[i];
        }
    }
    return null;
};

// dagen verschil met huidige datum
function dagenVerschil(datasetsPerProvince){
    var dagen = [];
    for (let i = 0; i < datasetsPerProvince.length; i++) {
        var prov = datasetsPerProvince[i];
        // console.log(prov.key)
        // console.log(prov.values)
        var today = new Date();
        var mydate = new Date(prov.values[0].created);
        dagen.push({ "provincie": prov.key, "dagen": Math.round((today - mydate) / (1000 * 60 * 60 * 24)) })
        // console.log(provincie, " dagen ", today, mydate, Math.round((today - mydate) / (1000 * 60 * 60 * 24)));
    }
    return dagen;
};

// mooie datum notatie
// https://stackoverflow.com/questions/3066586/get-string-in-yyyymmdd-format-from-js-date-object
Date.prototype.yyyymmdd = function () {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();
    return [this.getFullYear(),
    (mm > 9 ? '' : '0') + mm,
    (dd > 9 ? '' : '0') + dd
    ].join('-');
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
           reverseSpreadProvincies();
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
            d3.selectAll('svg').select('#' + dataset_list[0].provincie)
                .transition()
                .duration(100)
                .style("fill", "#5d9840")
        })
        .addTo(controller);
    
        var scene_2_2 = new ScrollMagic.Scene({
            triggerElement: "#content_2_2",
            triggerHook: "onCenter",
            duration: 500
        })
        .on("enter ", function (event) {
            // animatie op svg
            d3.selectAll('svg').select('#' + dataset_list_niet_ngr.values[0].provincie)
                .transition()
                .duration(100)
                .style("fill", "#5d9840")
        })
        .addTo(controller);
    
        var scene_2_3 = new ScrollMagic.Scene({
            triggerElement: "#content_2_3",
            triggerHook: "onCenter",
            duration: 500
        })
        .on("progress", function (event) {
            console.log("Scene progress changed to " + event.progress);
        })
        .on("enter ", function (event) {
            d3.selectAll('svg').select('#' + dataset_list[2].provincie)
                .transition()
                .duration(100)
                .style("fill", "#5d9840")
        })
        // .on("leave", function () {
        //     d3.selectAll('svg')
        //         .transition()
        //         .duration(100)
        //         .style("fill", "#ffffff")
        // })
        .addTo(controller);

    var scene_3 =  new ScrollMagic.Scene({
        triggerElement: "#content_3",
        triggerHook: "onEnter",
        offset: 400,
        duration: 1000 
    })
        .on("start", function () {
            // align provinces along line
            spreadProvincies();
        })
        .addTo(controller);

};



// =================================
//  SPREAD SVG

function spreadProvincies(){
    provinciesSVG
        .each(function (d, i) {
            var element = d3.select(this);
            element
                .transition()
                .duration(1000)
                .attr("transform", function (d) {
                    var centroid = path.centroid(d),
                        x = centroid[0],
                        y = centroid[1];
                    return "translate(" + ((-x + (part * i)) + part / 2) + "," + (-y + height / 2) + ")"; 
                    //distribute horizontaly objects along one line. 
                })
                .on("end", function(){
                    graph.selectAll('rect')
                        
                        .each(function (d) {
                            var prov = d3.selectAll('svg').select('#' + d.provincie + '.provincie');
                            var trans = prov.attr("transform");
                            var centroid = path.centroid(prov.datum()),
                                x = centroid[0],
                                y = centroid[1];
                            var node = prov.node();
                            var bbox = node.getBBox();
                            var matrix = node.getTransformToElement(node.nearestViewportElement);
                            var p = node.nearestViewportElement.createSVGPoint();
                            var sp = p.matrixTransform(matrix);
                            d3.select(this)
                                .transition()
                                .duration(1000)
                                .attr("x", x - 20)
                                .attr("y", 0)
                                .attr("transform", "translate(" + sp.x + ", 0)")
                        });
                    graphPerProvince.selectAll('text')
                        .each(function (d) {
                            var prov = d3.selectAll('svg').select('#' + d.key + '.provincie');
                            var trans = prov.attr("transform");
                            var centroid = path.centroid(prov.datum()),
                                x = centroid[0],
                                y = centroid[1];
                            var node = prov.node();
                            var bbox = node.getBBox();
                            var matrix = node.getTransformToElement(node.nearestViewportElement);
                            var p = node.nearestViewportElement.createSVGPoint();
                            var sp = p.matrixTransform(matrix);
                            d3.select(this)
                                .transition()
                                .duration(1000)
                                .attr("x", x - 20)
                                .attr("y", 150)
                                .attr("transform", "translate(" + sp.x + ", 0)");
                        });
                });
        });
};


function reverseSpreadProvincies(){
    provinciesSVG
        .each(function (d) {
            var element = d3.select(this);
            element
                .transition()
                .duration(3000)
                .attr("transform", "translate(0,0)")
                .style("fill", "#fff");
        })
}