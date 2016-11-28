var utils = require('./utils.js');
var setters = require('./setters.js');

global.initMultibarChart = function (runtime, element, data) {
    // edx bug fix
    element = Array.isArray(element) ? element[0] : element;
    var $element = $(element);

    // If the title exists, it means charts were rendered so we will not render them again, just let the user to continue where he left of.
    if($element.find('#chart-title').text().length > 0) { return; }

    var chart_sheet_names = [];
    var _charts = [];
    var specs_data;
    var charts_specs_data;
    var general_charts_data = {};

    var chart_specifics = {};
    var datum = [];

    var _json_data = data['json_data'] ? JSON.parse(data['json_data']) : null;

    // go through file and initialize global data for chart
    if (_json_data) {
        _json_data.forEach(function (sheet) {
            switch (sheet.name) {
                case 'specs':
                {
                    specs_data = sheet;
                    break;
                }
                case 'charts':
                {
                    charts_specs_data = sheet;
                    break;
                }
                default:
                {
                    _charts.push(sheet);
                    chart_sheet_names.push(sheet.name);
                    break;
                }

            }
        });
    } else {
        var note = '<p class="note"> Please, go to edit and upload excel file for the data. </p>';
        $element.find('.multibar-chart').html(note);
    }
    setters.setFileSpecs(specs_data, general_charts_data);

    // we will reference main_container always, so we don't go out of the xblock scope
    var $main_container = $element.find('.multibar-chart-container');

    var inStudio = utils.isRenderedInStudio($main_container);
    var _dimensions = utils.getDimensions($main_container, inStudio);
    var width = _dimensions.width,
        height = _dimensions.height;

    generate_tabs(_charts, $element);
    var d3graph_container = d3.select($element[0]).select('svg');

    function generateChartsSpecs() {
        var title = $main_container.find('#chart-title');
        var background_url = general_charts_data.background_url;

        title.html(general_charts_data.title);
        $main_container.css('background-image', 'url(' + background_url + ')');
    }

    /**
     * Generate tabs with charts. Every tab will generate new graph using
     * generate_chart function.
     * @param workbook
     * @param $element
     */
    function generate_tabs(workbook, $element) {
        var sheet_list = $main_container.find('.charts-list');
        var firstIteration = true;

        workbook.forEach(function (sheet) {
            var list_node = document.createElement("LI");
            var text_node_wrapper = document.createElement("SPAN");
            list_node.onclick = function () {
                clearActiveTab(sheet.name);
                list_node.className = "active";
                setters.setChartsSpecs(charts_specs_data, sheet.name, chart_specifics);
                generate_chart(sheet, $element);
            };
            // generate default (first) graph
            if (firstIteration) {
                list_node.className = "active";
                setters.setChartsSpecs(charts_specs_data, sheet.name, chart_specifics);
                generate_chart(sheet, $element);
            }
            // append tab div
            var text_node = document.createTextNode(sheet.name);
            text_node_wrapper.appendChild(text_node);
            list_node.appendChild(text_node_wrapper);
            sheet_list.append(list_node);
            firstIteration = false;
        });
        generateChartsSpecs();
    }

    function clearActiveTab(name) {
        var list = $main_container.find('.charts-list').children();
        var list_length = list.length;
        for (var i = 0; i < list_length; i++) {
            if (list[i].innerText !== name) {
                list[i].className = "";
            }
        }
    }

    /**
     * Populate datum with data needed for drawing graph. Calls final draw graph.
     * @param sheet
     * @param $element
     */
    function generate_chart(sheet, $element) {
        // clear data before new render
        datum = [];
        d3.select($element[0]).selectAll('svg > *').remove();
        chart_specifics.max_y_range = 0;
        for (var i = 1; i < sheet.rows.length; i++) {
            var row = sheet.rows[i];
            var _key = row.key;
            var values = [];
            var x,
                y;

            for (var j = 2; j < row.values.length; j++) {
                // First array(row - worksheet.rows[0]) contains values for x-axis, others are data for each row in sheet
                x = sheet.rows[0].values[j];
                y = row.values[j];
                // This is not general. In current excel file, every sheet
                // has first three columns filled with data we don't need in chart.
                if (!(x instanceof String) && !(y instanceof String)) {
                    values.push({
                        x: x,
                        y: y
                    });
                    if (y > chart_specifics.max_y_range) {
                        chart_specifics.max_y_range = y;
                    }
                }
            }

            datum.push({
                key: _key,
                values: values
            });
        }
        createGraph();
    }

    function updatePositions(nv_width, nv_height, code, d3graph_container) {
        utils.updateFootnotePosition(nv_width, nv_height, d3graph_container);
        utils.updateXYtitlesPosition(nv_width, nv_height, code, d3graph_container);
        utils.updateLegendPosition(nv_width, code, d3graph_container);
        utils.updateWrap('.tick', d3graph_container);
        if (inStudio) {
            // in studio move whole chart a bit left (default: translate(250,45))
            d3graph_container.select('.nvd3.nv-wrap.nv-multiBarWithLegend').attr('transform', 'translate(100,45)');
        }
    }

    /**
     *  Create graph
     */
    function createGraph() {
        nv.addGraph({
            generate: function () {
                var yRange = utils.getRangeForY(chart_specifics.max_y_range),
                    numberOfYticks = chart_specifics.numberOfYticks,
                    tickFormat = d3.format(chart_specifics.format_type.replace(/'/g, ""));

                var _dimensions = utils.getDimensions($main_container, inStudio);
                var width = _dimensions.width,
                    height = _dimensions.height;
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

                var svg = d3graph_container.datum(datum);
                svg.transition().duration(0).call(chart);

                // .nv-y.nv-axis.nvd3-svg is container filled with bars. We'll use it for
                // attaching titles and footnote
                var d3nv_y_axis = d3graph_container.select('.nv-y.nv-axis.nvd3-svg');
                var nv_y_axis = $main_container.find('.nv-y.nv-axis.nvd3-svg');
                var nv_height = nv_y_axis.get(0).getBBox().height,
                    nv_width = nv_y_axis.get(0).getBBox().width;

                // add titles to the axes
                d3nv_y_axis.append("text")
                    .attr("text-anchor", "middle")
                    .classed("y-title", true)
                    .text(chart_specifics.y_title);
                d3nv_y_axis.append("text")
                    .attr("text-anchor", "middle")
                    .classed("x-title", true)
                    .text(chart_specifics.x_title);

                // add footnote
                if (general_charts_data.source_footnote) {
                    d3nv_y_axis.append("text")
                        .attr("text-anchor", "middle")
                        .classed("footnote", true)
                        .text(general_charts_data.source_footnote);
                }
                // set legend to use rectangles instead default circles
                utils.circlesToRectangles(d3graph_container);

                // add legend-title
                d3graph_container.select('.nv-legend')
                    .append("text")
                    .attr("x", -45)
                    .attr("y", -15)
                    .attr("text-anchor", "middle")
                    .classed("legend-title", true)
                    .text(chart_specifics.legend_text);


                // prevent double click on legend
                utils.preventDblClickLegend(chart);

                updatePositions(nv_width, nv_height, general_charts_data.code, d3graph_container);

                // Clicking on legend reverts some custom overrides.
                d3graph_container.select('.nv-legend').on("click", function () {
                    updatePositions(nv_width, nv_height, general_charts_data.code, d3graph_container);
                });

                return chart;
            },
            callback: function (graph) {
                nv.utils.windowResize(function () {
                    _dimensions = utils.getDimensions($main_container, inStudio);
                    width = _dimensions.width;
                    height = _dimensions.height;

                    graph.width(width).height(height);

                    d3.select($element[0]).select('svg')
                        .attr('width', width)
                        .attr('height', height)
                        .transition().duration(0)
                        .call(graph)
                    ;

                    var nv_y_axis = $main_container.find('.nv-y.nv-axis.nvd3-svg'),
                        nv_height = nv_y_axis.get(0).getBBox().height,
                        nv_width = nv_y_axis.get(0).getBBox().width;
                    updatePositions(nv_width, nv_height, general_charts_data.code, d3graph_container);
                });
            }
        });
    }
}
