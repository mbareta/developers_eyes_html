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
