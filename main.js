// Packages
var d3 = require("d3");
var fs = require("fs");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var ScrollMagic = require('scrollmagic');



// ==================================================// 
var provincies = ["Noord-Brabant", "Zuid-Holland", "Provincie_Groningen", "Provincie_Utrecht", "Gelderland", "Noord-Holland", "Flevoland", "Drenthe", "Fryslan", "Limburg", "Zeeland", "Overijssel"];
// var provincies = ["Noord-Brabant", "Zuid-Holland"];
var loader = d3.selectAll('#loader'),
    dataset_list = [],
    dataset_list_niet_ngr = [],
    count = 0,
    width = document.body.clientWidth - (document.body.clientWidth*0.1) ,
    part = width / 12,
    height = 150,
    provinciesSVG,
    graphPerProvince,
    graph,
    themaGraph,
    path;
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
        if (count == provincies.length) {
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
        if (error) throw error ;
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
        var tooltip = d3.select("body")
            .append("div")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .style("background", "#000")
            .text("a simple tooltip");
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
            .style("fill", "#ffffff")
            .on("mouseover", function(d){
                tooltip.text(d); 
                tooltip.style("visibility", "visible");
                // var coordinates = d3.mouse(this);
                // var x = coordinates[0];
                // var y = coordinates[1];
                // var th = d3.select(this);
                // console.log(x)
                d3.select(this)
                    .transition()
                    .duration(100)
                    .style("fill", "#eee000");
                d3.select(this)
                    .append('svg:title')
                    .attr("class", "halo")
                    .text(d.properties.statnaam)
                    .style("text-anchor", "middle")
                    .style("fill", "#000000")
                    .style("font-size","14px");
            })
            .on("mouseout", function(d){
                d3.select(this)
                    .transition()
                    .duration(10)
                    .style("fill", "#ffffff");
                tooltip.style("visibility", "hidden");
            });
    });
};


// JSONP request per provincie
function jsonp(url, callback) {
    var callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    window[callbackName] = function (data) {
        delete window[callbackName];
        document.body.removeChild(script);
        callback(data);
    };

    var script = document.createElement('script');
    script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
    document.body.appendChild(script);
}


// URL request per provincie
function doRequest(provincie) {
    var url = 'https://data.overheid.nl/data/api/3/action/package_search?q=maintainer:' + provincie + '&rows=1000';

    jsonp(url, function (data) {
        var myArr = data;
        // JSON.parse(data);
        ProvinceDataset(myArr, provincie);
        // alert(data);
        count++;

    });

    // var xhr = new XMLHttpRequest();
    // xhr.onreadystatechange = function () {
    //     // console.log(this)
    //     if (this.readyState == 4 && this.status == 200) {
    //         var myArr = JSON.parse(this.responseText);
    //         ProvinceDataset(myArr, provincie);
    //         count ++;
    //     } 
    //     // if (this.readyState == 1 && this.status == 0){
    //     //     console.log("request failed")
    //     //     count ++;
    //     // }
       
    // };
    // xhr.open("GET", url, true);
    // xhr.send();
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
    // console.log(dataset_list_niet_ngr);
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
        .key(function(d){ return d.provincie; })
        .entries(dataset_list)
        .sort(function (a, b) {
            return new Date(b.created) - new Date(a.created);
        });
    console.log(datasetsPerProvince);
        
    graphPerProvince = d3.select('#content_3')
        .append('svg')
        .attr("width", width)
        .attr("height", 300)
        .style("visibility", "hidden");
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
    var dagen = dagenVerschil(datasetsPerProvince);
    var max =  Math.max(...dagen.map(function (key) { return key.dagen; }));
    var scaleHeight = d3.scaleLinear()
        .domain([0,max])
        .range([20,650]);

    graph = d3.select('#content_4')
        .append('svg')
        .attr("width", width)
        .attr("height", 650)
        .style("visibility", "hidden");

    var graph_groups = graph
        .selectAll('g')
        .data(dagen)
        .enter()
        .append('g');
        
    graph_groups
        .append('rect')
        .attr("id", function (d) {
            return d.provincie;
        })
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
    graph_groups.append('text')
        .text(function(d){return d.dagen})
        .style("color", "#0e232e")
        .style("font-size", "20px")
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
                .attr("y", 10)
                .attr("transform", "translate(" + sp.x + 15 + ", 10)")
        });
    
    // CONTENT 5 THEMAS TOP 10 Themas. en per provincie wat ze meeste doen. 
    var datasetsPerProvincieThema = d3.nest()
        .key(function (d) { return d.provincie; })
        .key(function (d) { return d.theme2; })
        .rollup(function (leaves) { return leaves.length })
        .entries(dataset_list)
        .sort(function (a, b) { return d3.descending(a.values.length, b.values.length); });
    console.log(datasetsPerProvincieThema)

    var datasetsPerThema = d3.nest()
        .key(function (d) { return d.theme2;})
        .rollup(function (leaves) { return leaves.length })
        .entries(dataset_list)
        .sort(function (a, b) { return d3.descending(a.value, b.value); });
    // datasetsPerThema.slice(0,3);

    var accent = d3.scaleOrdinal()
        .domain(d3.values(datasetsPerThema).map(function (d) {
            return d.key;
        }))
        .range(d3.schemeCategory10);

    d3.select("#top1")
        .text(datasetsPerThema[0].key)
        .style("color", accent(datasetsPerThema[0].key));
    d3.select("#top2").text(datasetsPerThema[1].key).style("color", accent(datasetsPerThema[1].key));
    d3.select("#top3").text(datasetsPerThema[2].key).style("color", accent(datasetsPerThema[2].key));

    d3.select("#top1waarde").text(datasetsPerThema[0].value);
    d3.select("#top2waarde").text(datasetsPerThema[1].value);
    d3.select("#top3waarde").text(datasetsPerThema[2].value);

    themaGraph = d3.select('#content_5')
        .append('svg')
        .attr("width", width)
        .attr("height", 650)
        .style("visibility", "visible");

    var themaGraphGroups = themaGraph
        .selectAll('g')
        .data(datasetsPerProvincieThema)
        .enter()
        .append('g')
        .attr("id", function (d) {
            return d.key;
        })
        .attr("y", 50)
        .attr("x", 0)
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
                .attr("x", x)
                .attr("y", 0)
                .attr("transform", "translate(" + sp.x + ", 50)")
        });

    var scaleCircle = d3.scaleLinear()
        .domain([0, 550])
        .range([5, 150])

    themaGraphGroups
        .selectAll('circle')
        .data(function (d) { return d.values.slice(0, 3).sort(function (a, b) { return d3.descending(a.value, b.value); })})
        .enter()
        .append('circle')
        .attr("id", function (d) {
            return d.key;
        })
        .attr("r", function(d){
            return scaleCircle(d.value)
        })
        .style("opacity", 0.85)
        .style("fill", function (d) {
            return accent(d.key)
        })
        .attr("cy", function(d,i){
            return (i*70)
        })
        .each(function (d) {
            // console.log(this.parentNode.__data__.key)
            var prov = d3.selectAll('svg').select('#' + this.parentNode.__data__.key + '.provincie');
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
                .attr("x", x)
                .attr("transform", "translate(" + sp.x + ", 60)")
        });

    var simulation = d3.forceSimulation(datasetsPerProvincieThema)
        .force("charge", d3.forceManyBody().strength([-50]))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .on("tick", ticked);

    function ticked(e) {
        themaGraphGroups.attr("cx", function (d) { return d.x; })
            .attr("cy", function (d) { return d.y; });
    }

    themaGraphGroups
        .selectAll('text')
        .data(function (d) { return d.values.slice(0, 3).sort(function (a, b) { return d3.descending(a.value, b.value); }) })
        .enter()
        .append('text')
        .text(function (d) { return d.value })
        .style("color", "#0e232e")
        .style("font-size", "20px")
        .attr("y", function (d, i) {
            return (i * 70)
        })
        .attr("cy", function (d, i) {
            return (i * 70)
        })
        .each(function (d) {
            var prov = d3.selectAll('svg').select('#' + this.parentNode.__data__.key + '.provincie');
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
                .attr("x", x -10)
                .attr("transform", "translate(" + sp.x + ", -10)")
        });

    

    // CONTENT 6 Publicatie datum over tijd. 

    var datasetsPerTime = d3.nest()
        .key(function (d) { return d.created; })
        .entries(dataset_list)
        .sort(function (a, b) {
            return new Date(b.created) - new Date(a.created);
        });
    // console.log(datasetsPerTime);
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
            // console.log("Scene progress changed to " + event.progress);
        })
        .on("enter ", function (event) {
            d3.select("#graph").selectAll('svg').select('#' + dataset_list[0].provincie)
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
            d3.select("#graph").selectAll('svg').select('#' + dataset_list_niet_ngr.values[0].provincie)
                .transition()
                .duration(100)
                .style("fill", "#5d9840")
        })
        .addTo(controller);
    
        // var scene_2_3 = new ScrollMagic.Scene({
        //     triggerElement: "#content_2_3",
        //     triggerHook: "onCenter",
        //     duration: 500
        // })
        // .on("progress", function (event) {
        //     // console.log("Scene progress changed to " + event.progress);
        // })
        // .on("enter ", function (event) {
        //     d3.selectAll('svg').select('#' + dataset_list[2].provincie)
        //         .transition()
        //         .duration(100)
        //         .style("fill", "#5d9840")
        // })
        // .on("leave", function () {
        //     d3.selectAll('svg')
        //         .transition()
        //         .duration(100)
        //         .style("fill", "#ffffff")
        // })
        // .addTo(controller);

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
            //distribute horizontaly objects along one line. 
            element
                .transition()
                .duration(1000)
                .attr("transform", function (d) {
                    var centroid = path.centroid(d),
                        x = centroid[0],
                        y = centroid[1];
                    return "translate(" + ((-x + (part * i)) + part / 2) + "," + (-y + height / 2) + ")"; 
                // Text 
            // element.append('text')

                })
                .on("end", function(){
                    graphPerProvince.selectAll('text')
                        .style("visibility", "visible")
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
                    graph.selectAll('g')
                        .style("visibility", "visible")
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
                    themaGraph.selectAll('circle, text')
                            .style("visibility", "visible")
                            .each(function (d) {
                                var prov = d3.selectAll('svg').select('#' + this.parentNode.__data__.key + '.provincie');
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
                                    .attr("x", x )
                                    .attr("cx", x)
                                    .attr("transform", "translate(" + sp.x + ", 0)")
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