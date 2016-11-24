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
            .attr('transform', 'translate(' + 0 + ',' + i * 25 + ')');
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
