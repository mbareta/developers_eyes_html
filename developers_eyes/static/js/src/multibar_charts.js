function initMultibarChart() {

    var data = [];
    data.max_y_range = 0;
    data.x_title = "";
    data.y_title = "";
    data.tick_format = "";

    // constants for this excel file
    const _GDP = "gdp (per capita)";
    const chart_types = {
        "gdp (per capita)": [
            {
                "x_title": "Year",
                "y_title": "US Dollars(2005)",
                "format_type": d3.format(',')
            }
        ],
        "population": [
            {
                "x_title": "Year",
                "y_title": "Total population",
                "format_type": d3.format(',')
            }
        ],
        "corruption": [
            {
                "x_title": "Year",
                "y_title": "Relative Rankings",
                "format_type": d3.format('.1f')
            }
        ],
        "% unemployment": [
            {
                "x_title": "",
                "y_title": "",
                "format_type": function (d) {
                    return d + "%";
                }
            }
        ],
        "% rural pop": [
            {
                "x_title": "",
                "y_title": "",
                "format_type": function (d) {
                    return d + "%";
                }
            }
        ],
        "% urban pop": [
            {
                "x_title": "",
                "y_title": "",
                "format_type": function (d) {
                    return d + "%";
                }
            }
        ]
    };

    generate_tabs(json_data);

    function generate_tabs(workbook) {

        var sheet_names = [];

        workbook.forEach(function (sheet) {
            sheet_names.push(sheet.name);
        });

        var sheet_list = document.getElementById("charts-list");
        sheet_names.forEach(function (sheet_name) {
            var list_node = document.createElement("LI");
            list_node.onclick = function () {
                clearActiveTab(sheet_name);
                list_node.className = "active";
                generateChartBySheetName(sheet_name);
            };
            if (sheet_name === _GDP) {
                list_node.className = "active";
                generateChartBySheetName(sheet_name);
            }
            var text_node = document.createTextNode(sheet_name);
            list_node.appendChild(text_node);
            sheet_list.appendChild(list_node);
        });

        function generateChartBySheetName(sheet_name) {
            for (var i = 0; i < workbook.length; i++) {
                if (workbook[i].name === sheet_name) {
                    generate_chart(workbook[i], sheet_name);
                    break;
                }
            }
        }
    }

    function clearActiveTab(name) {
        var list = document.getElementById("charts-list").children;
        var list_length = list.length;
        for (var i = 0; i < list_length; i++) {
            if (list[i].innerText !== name) {
                list[i].className = "";
            }
        }

    }

    function generate_chart(sheet, sheet_name) {
        // clear data before new render
        data = [];
        d3.selectAll("svg > *").remove();

        //get x,y titles and format type for ticks
        for (var key in chart_types) {
            if (chart_types.hasOwnProperty(key)) {
                if (key === sheet_name) {
                    data.x_title = chart_types[key][0].x_title;
                    data.y_title = chart_types[key][0].y_title;
                    data.tick_format = chart_types[key][0].format_type;
                }
            }
        }

        generate_data(sheet);
        createGraph();
    }

    /**
     *   This function renders the data. Accepts worksheet object.
     */
    function generate_data(worksheet) {
        data.max_y_range = 0;
        for (var i = 1; i < worksheet.rows.length; i++) {
            var row = worksheet.rows[i];
            var _key = row.key;
            var values = [];
            var x,
                y;

            for (var j = 2; j < row.values.length; j++) {
                // First array(row) contains values for x-axis, others are data for each row in sheet
                x = worksheet.rows[0].values[j];
                y = row.values[j];
                // This is not general. In current excel file, every sheet
                // has first three columns filled with data we don't need in chart.
                if (!(x instanceof String) && !(y instanceof String)) {
                    values.push({
                        x: x,
                        y: y
                    });

                    if (y > data.max_y_range) {
                        data.max_y_range = parseInt(y);
                    }
                }
            }

            data.push({
                key: _key,
                values: values
            });
        }
    }

    function numDigits(x) {
        x = Number(String(x).replace(/[^0-9]/g, ''));
        return (Math.log10((x ^ (x >> 31)) - (x >> 31)) | 0) + 1;
    }

    function getRangeForY(max_number) {
        var dec = Math.pow(10, (numDigits(parseInt(max_number)) - 1));
        var multiplier = parseInt(max_number / dec);
        return (multiplier + 1) * dec;
    }

    /**
     *  Create graph
     */
    function createGraph() {
        nv.addGraph({
            generate: function () {
                var width = nv.utils.windowSize().width * 0.66,
                    height = nv.utils.windowSize().height * 0.60,
                    yRange = getRangeForY(data.max_y_range),
                    numberOfYticks = yRange > 1 ? 5 : 10,
                    tickFormat = data.tick_format;

                var chart = nv.models.multiBarChart()
                    .width(width)
                    .height(height)
                    .stackOffset(10)
                    .groupSpacing(0.2)
                    .options({
                        duration: 750,
                        showControls: false
                    })
                    .forceY([0, yRange]) // set range for y-axis
                    .reduceXTicks(false)
                    .color(['#45ada9', '#880a03', '#da6f43', '#7f933d', '#fbcb8c', '#c84700']);

                chart.yAxis
                    .tickFormat(tickFormat)
                    .ticks(numberOfYticks);

                chart.dispatch.on('renderEnd', function () {
                    console.log('Render Complete');
                });

                var svg = d3.select('#multibarChart svg')
                    .datum(data);

                svg.transition().duration(0).call(chart);

                svg.append("text")
                    .attr("x", 365)
                    .attr("y", 15)
                    .attr("text-anchor", "middle")
                    .text("Isolate by region: ");

                // add titles to the axis
                svg.append("text")
                    .attr("text-anchor", "middle")
                    .attr("transform", "translate(" + (width / 35) + "," + (height / 2) + ")rotate(-90)")
                    .style("opacity", 0.25)
                    .text(data.y_title);

                svg.append("text")
                    .attr("text-anchor", "middle")
                    .attr("transform", "translate(" + (width / 2) + "," + (height + 45) + ")")
                    .style("opacity", 0.25)
                    .text(data.x_title);

                d3.selectAll('.nv-series').each(function (d) {
                    var group = d3.select(this),
                        circle = group.select('circle');
                    var color = circle.style('fill');

                    circle.remove();
                    var symbol = group.append('path')
                        .attr('d', d3.svg.symbol().type('square'))
                        .style('stroke', color)
                        .style('fill', color)
                        // without this class, it doesn't get toggled fill when enable/disable
                        .attr('class', 'nv-legend-symbol')
                        .attr('transform', 'scale(2, 1.5) translate(-2,0)')
                });

                return chart;
            },
            callback: function (graph) {
                nv.utils.windowResize(function () {
                    var width = nv.utils.windowSize().width;
                    var height = nv.utils.windowSize().height;
                    graph.width(width).height(height);

                    d3.select('#multibarChart svg')
                        .attr('width', width)
                        .attr('height', height)
                        .transition().duration(0)
                        .call(graph)
                    ;
                });
            }
        });
    }

}
