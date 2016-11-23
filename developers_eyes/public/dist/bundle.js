(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var utils = require('./utils.js');
var setters = require('./setters.js');

global.initMultibarChart = function (runtime, element, data) {
    // edx bug fix
    element = Array.isArray(element) ? element[0] : element;
    var $element = $(element);

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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./setters.js":2,"./utils.js":3}],2:[function(require,module,exports){
'use strict';

/**
 * Gets chart data: chart name, chart code and background.
 * From the sheet in excel named "specs"
 * This column should be last but one in excel file, named 'specs'.
 * @param specs_data
 * @param general_charts_data
 */
function setFileSpecs(specs_data, general_charts_data) {
    // First array are keys
    var _keys = specs_data['rows'][0];
    // 2nd array are values
    var _values = specs_data['rows'][1];
    var _length = _keys.length;

    for (var i = 0; i < _length; i++) {
        general_charts_data['' + _keys[i] + ''] = _values[i];
    }
}

/**
 * Gets specs for every chart in this file. The specs are: title,
 * footnote, legend title text, x and y titles, format type and num of ticks.     *
 * @param charts_specs_data
 * @param sheet_name
 * @param chart_specifics
 */
function setChartsSpecs(charts_specs_data, sheet_name, chart_specifics) {
    // First array are keys
    var _keys = charts_specs_data['rows'][0];
    var _length = _keys.length;

    // Other arrays are values
    for (var i = 1; i < _length - 1; i++) {
        var _values = charts_specs_data['rows'][i];
        for (var j = 0; j < _values.length; j++) {
            chart_specifics['' + _keys[j] + ''] = _values[j];
        }

        if (chart_specifics.chart_name === sheet_name) {
            break;
        }
    }
}

module.exports = {
    setFileSpecs: setFileSpecs,
    setChartsSpecs: setChartsSpecs
};

},{}],3:[function(require,module,exports){
'use strict';

function isRenderedInStudio($main_container){
    var studio_wrapper = $main_container.parents('.studio-xblock-wrapper');
    return studio_wrapper[0] ? true : false;
}

/**
 * Return dimension for svg graph.
 * @param $main_container
 * @param inStudio
 * @returns {{height: (number|*), width: (number|*)}}
 */
function getDimensions($main_container, inStudio) {
    var chart = $main_container.find('.multibar-content')[0];
    var width = chart.offsetWidth * 0.72,
        height = width / 2.18;

    // in this case, the chart is rendering in studio, so we'll take
    // first known container's width as a reference.
    if (inStudio) {
        width = $main_container.parents('.content-primary').width() * 0.66;
        height = width / 2.18;
    }

    return {
        height: height,
        width: width
    }
}

function digits(str) {
    var num = parseInt(str, 10);
    if (isNaN(num)) return 0;
    return (num + '').length;
}

function retrieve_dec(floatNumber) {
    var pieces = floatNumber.toString().split('.');
    return pieces[1].length;
}

function round(value, exp) {
    if (typeof exp === 'undefined' || +exp === 0)
        return Math.round(value);

    value = +value;
    exp = +exp;

    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
        return NaN;

    // Shift
    value = value.toString().split('e');
    value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));

    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
}

/**
 * Get max value for Y axis.
 * @param max_number
 * @returns {number}
 */

function getRangeForY(max_number) {
    if (max_number >= 1) {
        var pow10 = Math.pow(10, digits(parseInt(max_number).toString()) - 1);
        var multiplier = parseInt(max_number / pow10);
        if ((max_number - pow10 / 2) < pow10) {
            return pow10 + ((multiplier + 1) * (pow10 / 10));
        } else {
            return (multiplier + 1) * pow10
        }
    } else {
        // If we are dealing with dec number, just multiply it with 100, find first one
        // divisible with 5, we'll return that one as max y value.
        var t = Math.round(max_number * 100);
        while (t % 5 != 0) {
            t++;
        }
        return t / 100;
    }
}

// wrap too long tick text
function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}

/**
 * Call wrap text function depending on the class for
 * svg text node.
 * @param className
 * @param d3graph_container
 *
 * ex. updateWrap('.tick') will shorten too long ticks
 */
function updateWrap(className, d3graph_container) {
    var x = d3.scale.ordinal()
        .rangeRoundBands([0, 50], .1, .3);

    d3graph_container.selectAll(className + ' text')
        .call(wrap, x.rangeBand());
}

/**
 * Update positioning for x,y titles, legend and footnote
 */

function updateXYtitlesPosition(width, height, file_name, d3graph_container) {
    d3graph_container.select('.x-title')
        .attr('transform', 'translate(' + ((width / 2) - 10) + ',' + (height + 45) + ')');

    var x = (file_name === 'IP') ? -70 : -40;
    d3graph_container.select('.y-title')
        .attr('transform', 'translate(' + x + ',' + (height / 2) + '), rotate(-90)');

}

/**
 * Update legend position and stack into column
 */
function updateLegendPosition(width, file_name, d3graph_container) {
    var delta = file_name === 'IP' ? 95 : 10;
    var x = (width / 10) + delta;

    d3graph_container.select('.nv-legendWrap')
        .attr('transform', 'translate(-' + x + ', -7)')
        .selectAll('.nv-series').each(function (d, i) {
        // stack them in column instead row
        var el = d3.select(this);
        el.attr('class', 'nv-series')
            .attr('transform', 'translate(' + -30 + ',' + i * 25 + ')');
    });
}
/**
 * Prevent double click on chart since it messes with legend design.
 * -> turn off stateChange and then turn it back on again as soon as possible
 * @param chart
 */
function preventDblClickLegend(chart) {
    chart.legend.dispatch.on('legendDblclick', function (e) {
        chart.legend.updateState(false);
        setTimeout(function () {
            chart.legend.updateState(true);
        }, 1);
    });
}

/**
 * Convert default circle legend items to rectangles.
 * @param d3graph_container
 */

function circlesToRectangles(d3graph_container) {
    d3graph_container.selectAll('.nv-series').each(function (d) {
        var group = d3.select(this),
            circle = group.select('circle'),
            color = circle.style('fill');

        circle.remove();
        var symbol = group.append('path')
            .attr('d', d3.svg.symbol().type('square'))
            .style('stroke', color)
            .style('fill', color)
            // without this class, it doesn't get toggled fill when enable/disable
            .attr('class', 'nv-legend-symbol')
            .attr('transform', 'scale(2, 1.5) translate(-2,0)')
    });
}

function updateFootnotePosition(width, height, d3graph_container) {
    d3graph_container.select('.footnote')
        .attr('transform', 'translate(' + ((width / 10) + 30) + ',' + (height + 90) + ')');
}

module.exports = {
    isRenderedInStudio: isRenderedInStudio,
    getDimensions: getDimensions,

    digits: digits,
    retrieve_dec: retrieve_dec,
    round: round,
    getRangeForY: getRangeForY,

    wrap: wrap,
    updateWrap: updateWrap,

    updateXYtitlesPosition: updateXYtitlesPosition,
    preventDblClickLegend: preventDblClickLegend,
    circlesToRectangles: circlesToRectangles,
    updateLegendPosition: updateLegendPosition,
    updateFootnotePosition: updateFootnotePosition
};

},{}]},{},[1]);
