
function assignment9(){
    var filePath="data.csv";
    question0(filePath);
    geomap(filePath);

    stream(filePath);
    scatter(filePath);
    box(filePath);
    
}

var question0=function(filePath){
    d3.csv(filePath).then(function(data){
        console.log(data)
    });
}

var geomap=function(filePath) {
    // color of block and legend stroke when hover
    var hoverColor = 'rgb(124, 179, 192)'

    var parseTime = d3.timeParse("%Y-%m-%d")
    var rowConverter = function(d) {
        return {
            'gsp': parseInt(d['PC.REALGSP.STATE']),
            'date': parseTime(d['OUTAGE.START.DATE']),
            'year': parseInt(d['YEAR']),
            'state': (d['U.S._STATE']),
            'res': parseFloat(d['RES.PRICE']),
            'com': parseFloat(d['COM.PRICE']),
            'ind': parseFloat(d['IND.PRICE'])
        }
    }
    var stateSym = {
        AZ: 'Arizona',
        AL: 'Alabama',
        AK: 'Alaska',
        AR: 'Arkansas',
        CA: 'California',
        CO: 'Colorado',
        CT: 'Connecticut',
        DC: 'District of Columbia',
        DE: 'Delaware',
        FL: 'Florida',
        GA: 'Georgia',
        HI: 'Hawaii',
        ID: 'Idaho',
        IL: 'Illinois',
        IN: 'Indiana',
        IA: 'Iowa',
        KS: 'Kansas',
        KY: 'Kentucky',
        LA: 'Louisiana',
        ME: 'Maine',
        MD: 'Maryland',
        MA: 'Massachusetts',
        MI: 'Michigan',
        MN: 'Minnesota',
        MS: 'Mississippi',
        MO: 'Missouri',
        MT: 'Montana',
        NE: 'Nebraska',
        NV: 'Nevada',
        NH: 'New Hampshire',
        NJ: 'New Jersey',
        NM: 'New Mexico',
        NY: 'New York',
        NC: 'North Carolina',
        ND: 'North Dakota',
        OH: 'Ohio',
        OK: 'Oklahoma',
        OR: 'Oregon',
        PA: 'Pennsylvania',
        RI: 'Rhode Island',
        SC: 'South Carolina',
        SD: 'South Dakota',
        TN: 'Tennessee',
        TX: 'Texas',
        UT: 'Utah',
        VT: 'Vermont',
        VA: 'Virginia',
        WA: 'Washington',
        WV: 'West Virginia',
        WI: 'Wisconsin',
        WY: 'Wyoming'
    };
    d3.csv(filePath, rowConverter).then(data=>{
        var width=700;
        var height=550;
        var padding=20;
        // data = d3.rollup(data, v => v.length, d => d.year, d => d.state)
        data = d3.rollup(data, 
                        v =>  {return {
                            count: v.length, 
                            res: d3.mean(v, d => d.res), 
                            com: d3.mean(v, d => d.com), 
                            ind: d3.mean(v, d => d.ind)}
                        },
                        d => d.year, 
                        d => d.state)
       
        console.log(data)
        var max_price = 0
        var max_count = 0
        data.forEach((value, key) => {
            value.forEach((value2, key2) => {
                max_price = d3.max([max_price, value2.res, value2.com, value2.ind])
                max_count = d3.max([max_count, value2.count])
            })
        })
        console.log(max_price)
        console.log(max_count)
        // State Symbol dictionary for conversion of names and symbols.
        var svg1 = d3.select("#mapVis")
            .append("svg").attr("width", width)
            .attr("height", height);
        //TO DO: Create projection and pathgeo variables for US
        var proj_scale = 800
        const projection1  = d3.geoAlbersUsa()
            .scale(proj_scale)
            .translate([width/2, height/2]) //chain translate and scale

        const pathgeo1 = d3.geoPath().projection(projection1); 
        //TO DO: Load JSON file and create the map
        const statesmap = d3.json("us-states.json");
        
        statesmap.then(function (json){
            
            
 
            year = 2000
            

            // var colors = d3.schemeBlues[9]
            // var colors = ['rgb(252, 234, 126)', 'rgb(237, 219, 109)', 'rgb(214, 197, 88)', 'rgb(191, 175, 69)', 'rgb(156, 141, 45)', 'rgb(122, 110, 29)', 'rgb(97, 87, 19)', 'rgb(64, 57, 11)', 'rgb(59, 53, 9)']
            var colors = ['rgb(252, 234, 126)', 'rgb(237, 219, 109)', 'rgb(214, 197, 88)', 'rgb(191, 175, 69)', 'rgb(156, 141, 50)', 'rgb(122, 110, 40)', 'rgb(97, 87, 30)', 'rgb(64, 57, 20)', 'rgb(59, 53, 20)']
            
            var color = d3.scaleQuantize()
                            .domain([0, max_count / 2.5])
                            .range(colors)
            console.log(color)


            data.forEach((value, year) => {
                value.forEach((value2, state) => {
                    for (var j = 0; j < json.features.length; j++) {
                        var jsonState = json.features[j].properties.name

                        if (state === stateSym[jsonState]) {
                            
                            if (json.features[j].properties.hasOwnProperty('yearCount')) {
                                json.features[j].properties.yearCount[year] = value2['count']

                                json.features[j].properties.yearPrice[year] = [
                                                                                {price: value2['res'], cat: 'res'},
                                                                                {price: value2['com'], cat: 'com'},
                                                                                {price: value2['ind'], cat: 'ind'},
                                                                                ]
                                
                            }
                            else {
                                json.features[j].properties.yearCount = {[year]: value2['count']}
                                json.features[j].properties.yearPrice = {[year]: [
                                    {price: value2['res'], cat: 'res'},
                                    {price: value2['com'], cat: 'com'},
                                    {price: value2['ind'], cat: 'ind'},
                                    ]
                                }
                            }
                            break
                            
                        }
                    }
                })
            })

            var inner_width = width / 6
            var inner_height = height / 4
            var inner_padding = padding / 1.5
            var tooltip = d3.select("#inner_plot").append("div")
                        .style("opacity", 0)
                        .attr("class", "tooltip")
                        .html("<p></p><div id='tipDiv'></div>");

            

            var mouseover = function(e, d) {
                tooltip
                .style("opacity", 1)
                // locate which rect
                
                if (d.properties.hasOwnProperty('yearCount') && d.properties.yearCount.hasOwnProperty(year)) {

                    var count = d.properties.yearCount[year]
                    var c = color(count)
                }
                else {
                    var count = 0
                    var c = color(count)
                }

                // legend hover color
                d3.select(`[id="${c}"]`)
                    .style('stroke', hoverColor)
                // legend hover text
                d3.select(`[id="${colors.indexOf(c)}"]`)
                    .text(count + ' times')
                d3.select(`[id="${colors.indexOf(c) + 1}"]`)
                    .text('')

                d3.select(this)
                .transition()
                .duration(100)
                .style("stroke", "white")
                .attr('fill', hoverColor)

                if (d.properties.hasOwnProperty('yearPrice')) {
                    if (d.properties.yearPrice.hasOwnProperty(year)) {
                        
                        var innersvg = d3.select("#tipDiv")
                            .append("svg")
                            .attr("width", inner_width)
                            .attr("height", inner_height)
        
                        var inner_x = ['res', 'com', 'ind']
                        var inner_xScale = d3.scaleBand()
                                .domain(inner_x)
                                .range([inner_padding, inner_width - inner_padding])
                                .padding(0.1);
                        var inner_yScale = d3.scaleLinear()
                                .domain([0, max_price])
                                .range([inner_height - inner_padding, inner_padding]);
                        var x_axis = d3.axisBottom(inner_xScale).tickSize(1)
                        var y_axis = d3.axisLeft(inner_yScale).tickSize(1);
                        innersvg.append("g")
                            .attr('transform', `translate(${1 * inner_padding},0)`)
                            .attr("class","inner_axis")
                            .call(y_axis)
                            .append("text")
                            .attr("dx", "-.1em")
                            .attr("dy", "0.71em")
                            .attr("text-anchor", "end")
                        innersvg.append('g')
                            .attr('transform', `translate(0,${inner_height - inner_padding})`)
                            .attr("class","inner_axis")
                            .call(x_axis)
                            .selectAll("text")
                            .style("text-anchor", "center")

     

                        innersvg.append('g')
                            .selectAll('rect')
                            .data(d.properties['yearPrice'][year]
                            )
                            .enter()
                            .append('rect')
                            .attr('fill', '#3cabcf')
                            .attr('opacity', 0.9)
                            .attr('x', (dd, i) => {
                                return inner_xScale(dd['cat'])
                                }
                            )
                            .attr('y', (dd, i) => {
                                    return inner_yScale(dd['price'])
                            })
                            .attr('height', dd => {
                                
                                    return inner_yScale(0) - inner_yScale(dd['price'])
                            })
                            .attr('width', inner_xScale.bandwidth())
                        
                        innersvg.append("text")
                            .attr("transform", "translate(" + (inner_width / 2) + ',' +  (inner_padding/ 1.5) + ")")
                            .style("text-anchor", "middle")
                            .attr("fill", "#3cabcf")
                            .attr("font-size", 10)
                            .text("Electricity Prices");
                            
                            
                    }
                    else {
                        d3.select("#tipDiv").append('text').text('No Outage thus no Data')
                    }
                }
                else {
                    d3.select("#tipDiv").append('text').text('No Outage thus no Data')
                }
            }
            var mousemove = function(e, d) {
                tooltip
                    .style("left", (e.pageX+30) + "px")
                    .style("top", (e.pageY+30) + "px")

            }

            var mouseleave = function(e, d) {

                if (d.properties.hasOwnProperty('yearCount') && d.properties.yearCount.hasOwnProperty(year)) {
                    var c = color(d.properties.yearCount[year])
                }
                else {var c = color(0)}
                d3.select(`[id="${c}"]`)
                    .style('stroke', 'none')
                
                // legend hover text
                d3.select(`[id="${colors.indexOf(c)}"]`)
                    .text('')
                d3.select(`[id="0"]`)
                    .text('less')
                d3.select(`[id="${colors.length - 1}"]`)
                    .text('more')
                


                tooltip
                .style("opacity", 0)
                d3.select(this)
                .transition()
                .duration(100)
                .style("stroke", "white")
                .attr('fill', c)
                
                d3.select("#tipDiv").select('text').remove()
                d3.select("#tipDiv").select('svg').remove()
                


            }
            
            // main map
            svg1.selectAll("path").data(json.features).enter().append('path')
                    .attr("d", pathgeo1)
                    .attr('fill', (d) => {
                        if (d.properties.hasOwnProperty('yearCount') && d.properties.yearCount.hasOwnProperty(year)) {
                            return color(d.properties.yearCount[year])
                        }
                        else {return color(0)}
                        
                    })
                    .attr('stroke', 'white')
                    .on('mouseover', mouseover)
                    .on('mousemove', mousemove)
                    .on('mouseleave', mouseleave)
            // plot title
            svg1.append("text")
                .attr("transform", "translate(" + (width / 2) + ',' +  (3 * padding) + ")")
                .style("text-anchor", "middle")
                .attr("font-size", 20)
                .attr('fill', '#3cabcf')
                .text("Outage Frequency from 2000 to 2015");
            
            
            // legend
            var legend_xScale = d3.scaleBand()
                .domain(colors)
                .range([padding, 15 * padding])
                //.padding(1.7)

            svg1.selectAll()
                .data(colors)
                .enter()
                .append("rect")
                .attr('id', d => d)
                .attr("x", function(d) { return legend_xScale(d)})
                .attr("y", height - 3 * padding)
                .attr("rx", 2)
                .attr("ry", 2)
                .attr("width", 27)
                .attr("height", 24 )
                .style("fill", function(d) { return d} )
                .style("stroke-width", 3)
                .style("stroke", "none")
            // legend description
            svg1.selectAll()
                .data(colors)
                .enter()
                .append("text")
                .attr('id', (d, i) => i)
                .attr("transform", function(d, i) {return "translate(" + (legend_xScale(d)) + ',' +  (height - 1 * padding) + ")"})
                .style("text-anchor", "start")
                .attr("fill", "white")
                .attr("font-size", 13)
                .text((d, i)=> {
                    if (i === 0) {
                        return 'less'
                    }
                    else if (i === 8) {
                        return 'more'
                    }
                });

            var slider = d3.select('#yearSlider')
                    .on("change", function (d) {
                        console.log(d)
                        console.log(d.target.oninput)
                        year = d.target.value
                        svg1.selectAll("path").data(json.features)
                            .transition()
                            .duration(500)
                            .attr('fill', (d) => {
                                if (d.properties.hasOwnProperty('yearCount') && d.properties.yearCount.hasOwnProperty(year)) {
                                    return color(d.properties.yearCount[year])
                                }
                                else {return color(0)}
                                
                            })
                            .attr('stroke', '#E9E9E9')
                        })
                
        })

    })
    
}

var stream=function(filePath) {
    
    var parseTime = d3.timeParse("%Y-%m-%d")
    var rowConverter = function(d) {
        return {
            // 'date': parseTime(d['OUTAGE.START.DATE']),
            'year': parseInt(d['YEAR']),
            'region': (d['CLIMATE.REGION']),
            'affected': parseInt(d['CUSTOMERS.AFFECTED'])
        }
    }
    d3.csv(filePath, rowConverter).then(data=>{
        var width=670;
        var height=560;
        var padding=20;
        data = data.filter(function(d){
            if(isNaN(d.affected)){
                return false;
            }
            return true;
        });
        
        data = d3.rollup(data, 
                        v => d3.sum(v, d => d.affected),
                        d => d.year, 
                        d => d.region)
        console.log(data)
        clean = []
        keys = ['East North Central', 'Central', 'South', 'Northwest', 'Southwest', 'Northeast', 'Southeast', 'West', 'West North Central']

        data.forEach((value, year) => {
            var yearly = {'year' : year}
            keys.forEach((region, i) => {

                if (value.has(region)) {

                    yearly[region] = value.get(region)
                }
                else {
                    yearly[region] = 0
                }
            })
            clean.push(yearly)
        })
        clean.sort((a, b) => {
            if (b.year > a.year) {
                return -1
            }
            if (b.year < a.year) {
                return 1
            }
            return 0
            }) 


        var svg = d3.select("#stream").append("svg")
			            .attr("width", width)
			            .attr("height", height)

        var years = Array.from(data.keys()).sort()
        console.log(years)

        var xScale = d3.scaleBand()
            .domain(years)
            .range([padding, width - padding])
            .paddingOuter(0)


        
        console.log(876)
        var largest = d3.max(clean, function(d){ 
            var maximum = 0
            keys.forEach((dd) => {
                maximum += d[dd]
            })

            return 1.1 * maximum
        })
        var yScale = d3.scaleLinear()
                        .domain([-largest * 0.4, largest])
                        .range([height-padding, padding])
        
        let xAxis = d3.axisBottom().scale(xScale).tickSize(-height*.7)



        svg.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0, ${height - 3 * padding})`)
            .call(xAxis)
            .select(".domain").remove()


        
        var color = d3.scaleOrdinal()
            .domain(keys)
            .range(d3.schemeDark2)


        var Tooltip = svg
        .append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr('fill', 'white')
        .style("opacity", 0)
        .style("font-size", 17)
        .attr('transform', `translate(${padding * 2}, ${height / 3})`)
    
        // Three function that change the tooltip when user hover / move / leave a cell
        var mouseover = function(d) {
            Tooltip.style("opacity", 1)
            d3.selectAll(".streamArea").style("opacity", .2)
            d3.select(this)
                .style("stroke", "black")
                .style("opacity", 1)
        }
        var mousemove = function(e,d) {

        Tooltip.text(d.key)
        }
        var mouseleave = function(d) {
        Tooltip.style("opacity", 0)
        d3.selectAll(".streamArea").style("opacity", 0.8).style("stroke", "none")
        }

		var series = d3.stack()
		    .offset(d3.stackOffsetWiggle)
		    .keys(keys)

		var stack = series(clean)


		svg.selectAll('layers')
                .data(stack).enter().append('path')
                .attr("class", "streamArea")
                .style('fill', d => color(d.key))
                .attr('d', d3.area()
                	.x(function(d) {  
                        return xScale(d.data.year); })
                	.y0(function(d) { 
                        return yScale(d[0]); })
                	.y1(function(d) {
                         return yScale(d[1]); })
                )
                .attr('transform', `translate(${xScale.bandwidth() / 2}, 0)`)
                .style("opacity", 0.8)
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave)

            // plot title
            svg.append("text")
                .attr("transform", "translate(" + (width / 2) + ',' +  (4 * padding) + ")")
                .style("text-anchor", "middle")
                .attr("font-size", 20)
                .attr('fill', '#3cabcf')
                .text("Population Affected across the Years");
                

    
    })
}
var scatter=function(filePath) {
    
    var rowConverter = function(d) {
        return {
            // 'date': parseTime(d['OUTAGE.START.DATE']),
            'duration': parseInt(d['OUTAGE.DURATION']),
            'res': parseFloat(d['RES.PRICE'])
        }
    }
    d3.csv(filePath, rowConverter).then(data=>{     
        var margin = {top: 100, right: 50, bottom: 50, left: 80},
            width = 700 - margin.left - margin.right,
            height = 600 - margin.top - margin.bottom;
    
        // append the svg object to the body of the page
        var svg = d3.select("#scatter")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");
        
        var x = d3.scaleLinear()
            .domain(d3.extent(data, d => d.res))
            .range([ 0, width ]);
            svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));
        
            // Add Y axis
        var range = d3.extent(data, d => d.duration)
        var y = d3.scaleSqrt()
            .domain(range)
            .range([ height, 0]);

        var y_1 = d3.scaleLinear()
            .domain(range)
            .range([ height, 0]);


        svg.append("g")
            .attr('id', 'scatter-yaxis')
            .call(d3.axisLeft(y));
        
            // Add dots
        var dot = svg.append('g')
            .attr('id', 'scatter-dots')
            .selectAll("dot")
            .data(data)
            .enter()
            .append("circle")
                .attr("cx", function (d) { return x(d.res); } )
                .attr("cy", function (d) { return y(d.duration); } )
                .attr("r", 1.5)
                .style("fill", "#69b3a2")
         // x title
         svg.append("text")
         .attr("transform", "translate(" + (width / 2) + ',' +  (height + margin.bottom / 1.5) + ")")
         .style("text-anchor", "middle")
         .text("Residential Electicity Price")
         .attr('fill', '#3cabcf')

        // y title
        svg.append("text")
                .attr("transform", "translate(" + (- margin.left / 1.5) + ',' +  (height / 2) + ") rotate(-90)")
                .style("text-anchor", "middle")
                .text("Outage Duration (mins)")
                .attr('fill', '#3cabcf')
        // plot title
        svg.append("text")
                .attr("transform", "translate(" + (width / 2) + ',' +  (-margin.top/2) + ")")
                .style("text-anchor", "middle")
                .attr("font-size", 20)
                .attr('fill', '#3cabcf')
                .text("Does Outage Recover Faster in High Price Regions?");
                    

        var radio = d3.select('#radio_part3').attr('name', 'transformation')
        .on("change", function (d) {
            console.log(d.target.value)
            var current_transformation = d.target.value; 
            var transtime = 500
            if (current_transformation === 'original') {
                
                svg.select('#scatter-yaxis')
                    .transition()
                    .duration(transtime)
                    .call(d3.axisLeft(y_1));
                dot
                    .style("opacity", 0)
                    .data(data)
                    .transition()
                    .duration(transtime)
                    .attr("cx", function (d) { return x(d.res); } )
                    .attr("cy", function (d) { 
                        console.log(y_1(d.duration))
                        return y_1(d.duration); 
                    } )
                    .attr("r", 1.5)
                    .style("fill", "#69b3a2")
                    .style("opacity", 1)
            }
            else if (current_transformation === 'sqrt') {
                svg.select('#scatter-yaxis')
                    .transition()
                    .duration(transtime)
                    .call(d3.axisLeft(y));
                dot
                    .style("opacity", 0)
                    .data(data)
                    .transition()
                    .duration(transtime)
                    .attr("cx", function (d) { return x(d.res); } )
                    .attr("cy", function (d) { 
                        return y(d.duration); 
                    } )
                    .attr("r", 1.5)
                    .style("fill", "#69b3a2")

                    .style("opacity", 1)
            }
        
        })
            
    })
}
// When the user scrolls down 20px from the top of the document, show the button

var box=function(filePath) {
    var rowConverter = function(d) {
        return {
            'climate': (d['CLIMATE.CATEGORY']),
            'duration': parseInt(d['OUTAGE.DURATION'])
        }
    }
    var margin = {top: 50, right: 50, bottom: 100, left: 80},
    width = 700 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
    
    var svg = d3.select("#box")
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
    d3.csv(filePath, rowConverter).then(data=>{
        var sumstat = d3
            .rollup(
                data, 
                function(d) {
                    q1 = d3.quantile(d.map(function(g) { return g.duration;}).sort(d3.ascending),.25)
                    median = d3.quantile(d.map(function(g) { return g.duration;}).sort(d3.ascending),.5)
                    q3 = d3.quantile(d.map(function(g) { return g.duration;}).sort(d3.ascending),.75)
                    interQuantileRange = q3 - q1
                    min = d3.min(d, d => d.duration)
                    max = d3.max(d, d => d.duration)
                    return({q1: q1, median: median, q3: q3, interQuantileRange: interQuantileRange, min: min, max: max})
                },
                d => d.climate  
            )
        console.log(sumstat)

         // Show the Y scale
        var y = d3.scaleBand()
            .range([ height, 0 ])
            .domain(["cold", "normal", "warm"])
            .padding(.4);

        svg.append("g")
            .attr("transform", "translate(" + -margin.left / 10 + ",0)")
            .call(d3.axisLeft(y).tickSize(0))
            .select(".domain").remove()

        // Show the X scale
        var range = d3.extent(data, d => d.duration )
        var x = d3.scaleSqrt()
            .domain(range)
            .range([0, width])
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).ticks(5))
            .select(".domain").remove()

        // Color scale
        var myColor = d3.scaleSequential()
            .interpolator(d3.interpolateInferno)
            .domain([range[0], Math.log(range[1])])

        
        // Show the main vertical line
        svg
        .selectAll("vertLines")
        .data(sumstat)
        .enter()
        .append("line")
            .attr("x1", function(d){return x(d[1].min)})
            .attr("x2", function(d){return(x(d[1].max))})
            .attr("y1", function(d){return(y(d[0]) + y.bandwidth()/2)})
            .attr("y2", function(d){
                return(y(d[0]) + y.bandwidth()/2)
            })
            .attr("stroke", "#3cabcf")
            .style("width", 30)

        // rectangle for the main box
        svg
        .selectAll("boxes")
        .data(sumstat)
        .enter()
        .append("rect")
            .attr("x", function(d){return(x(d[1].q1))}) // console.log(x(d.value.q1)) ;
            .attr("width", function(d){ ; return(x(d[1].q3)-x(d[1].q1))}) //console.log(x(d.value.q3)-x(d.value.q1))
            .attr("y", function(d) { return y(d[0]); })
            .attr("height", y.bandwidth() )
            .attr("stroke", "#3cabcf")
            .style("fill", "#69b3a2")
            .style("opacity", 0.4)

        // Show the median
        svg
        .selectAll("medianLines")
        .data(sumstat)
        .enter()
        .append("line")
            .attr("y1", function(d){return(y(d[0]))})
            .attr("y2", function(d){return(y(d[0]) + y.bandwidth()/2)})
            .attr("x1", function(d){return(x(d[1].median))})
            .attr("x2", function(d){return(x(d[1].median))})
            .attr("stroke", "#3cabcf")
            .style("width", 100)

        // create a tooltip
        var tooltip = d3.select("#tooltip-box")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip-box")
            .style("font-size", "16px")
        // Three function that change the tooltip when user hover / move / leave a cell
        var mouseover = function(e, d) {
            tooltip
            .style("opacity", 1)
          d3.select(this)
            .attr('r', 8)
            .style("stroke", "#3cabcf")
            .style("stroke-width", 3)
        }
        var mousemove = function(e, d) {
        console.log(e.pageY+30)
            
        tooltip
            .style("left", (e.pageX+30) + "px")
            .style("top", (e.pageY+30) + "px")
            .text("Duration: " + d.duration + " mins")
        }
        var mouseleave = function(e, d) {
            tooltip
            .style("opacity", 0)
            d3.select(this)
                .attr('r', 1.8)
                .style("stroke", "none")
        }
        // x title
        svg.append("text")
                .attr("transform", "translate(" + (width / 2) + ',' +  (height + margin.bottom / 2 ) + ")")
                .style("text-anchor", "middle")
                .text("Outage Duration (mins)")
                .attr('fill', '#3cabcf')

        // y title
        svg.append("text")
                .attr("transform", "translate(" + (- margin.left / 1.5) + ',' +  (height / 2) + ") rotate(-90)")
                .style("text-anchor", "middle")
                .text("Climate Region")
                .attr('fill', '#3cabcf')
        // plot title
        svg.append("text")
                .attr("transform", "translate(" + (width / 2) + ',' +  (-margin.top / 2) + ")")
                .style("text-anchor", "middle")
                .attr("font-size", 20)
                .attr('fill', '#3cabcf')
                .text("Does Climates Make a Difference to Outage Duration?");

        // Add individual points with jitter
        var jitterWidth = 50
        svg
        .selectAll("indPoints")
        .data(data)
        .enter()
        .append("circle")
            .attr("cx", function(d){ return(x(d.duration))})
            .attr("cy", function(d){ return( y(d.climate) + (y.bandwidth()/2) - jitterWidth/2 + Math.random()*jitterWidth )})
            .attr("r", 1.8)
            .style("fill", function(d){ return(myColor(Math.log(d.duration))) })
            .attr("stroke", "none")
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)
            })
}   
// window.onscroll = function() {
//     scrollFunction()
// };

// function scrollFunction() {
//     var mybutton1 = document.getElementById("plot1-button")
//     var mybutton2 = document.getElementById("plot2-button")
//     var mybutton3 = document.getElementById("plot3-button")

//     console.log(document.body.scrollTop)
//     if (document.body.scrollTop > 500) {
//       mybutton1.style.opacity = 0.2;
//     } else {
//       mybutton1.style.opacity = 0.8;
//     }
//     // button 2
//     console.log((document.documentElement.scrollTop))
//     if (document.body.scrollTop < 500 || document.body.scrollTop > 1000 ) {
//         mybutton2.style.opacity = 0.2;
//     } else {
//         mybutton2.style.opacity = 0.8;
//     }

//     if (document.body.scrollTop <= 1000 || document.body.scrollTop > 2000 ) {
//         mybutton3.style.opacity = 0.2;
//     } else {
//         mybutton3.style.opacity = 0.8;
//     }
//   }

//   // When the user clicks on the button, scroll to the top of the document
// function topPosition() {
//     document.body.scrollTop = 0; // For Safari
//     document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
// }

// function plot2Position() {
//     document.body.scrollTop = 700; // For Safari
//     document.documentElement.scrollTop = 700; // For Chrome, Firefox, IE and Opera
// }

// function plot3Position() {
//     document.body.scrollTop = 1300; // For Safari
//     document.documentElement.scrollTop = 1300; // For Chrome, Firefox, IE and Opera
// }


function topPosition() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function plot2Position() {
    window.scrollTo({
        top: 800,
        behavior: 'smooth'
    });
}

function plot3Position() {
    window.scrollTo({
        top: 1380,
        behavior: 'smooth'
    });
}
function plot4Position() {
    window.scrollTo({
        top: 2000,
        behavior: 'smooth'
    });
}

window.onscroll  = function() {
    var mybutton1 = document.getElementById("plot1-button");
    var mybutton2 = document.getElementById("plot2-button");
    var mybutton3 = document.getElementById("plot3-button");
    var mybutton4 = document.getElementById("plot4-button");
    
    var position = document.body.scrollTop
    console.log(position)

    if (position > 500) {
      mybutton1.style.opacity = 0.2;
    } else {
      mybutton1.style.opacity = 0.8;
    }
    // button 2
    if (position < 500 || position > 1000 ) {
        mybutton2.style.opacity = 0.2;
    } else {
        mybutton2.style.opacity = 0.8;
    }

    if (position <= 1000 || position > 1700 ) {
        mybutton3.style.opacity = 0.2;
    } else {
        mybutton3.style.opacity = 0.8;
    }

    if (position <= 1700 || position > 2300 ) {
        mybutton4.style.opacity = 0.2;
    } else {
        mybutton4.style.opacity = 0.8;
    }
  }