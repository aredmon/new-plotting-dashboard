'use strict';

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

var PlotChart = function () {

  function PlotChart(id) {
    _classCallCheck(this, PlotChart);
    this.plotId = 'myDiv';
    this.plotInfo = {
      title: 'Truth Vs Track Plotter',
      height: '700',
      width: '1200'
    };
    this.plotId3d = 'plot3d';
    this.plotInfo3d = {
      title: 'Truth Vs Track - Position ECEF',
      height: '700',
      width: '1200'
    };

    this.plotAllThreatsDiv = 'plotAllThreats';
    this.plotAllThreatsInfo = {
      title: 'Track ID vs Time',
      height: '700',
      width: '1200',
      hovermode: 'closest'
    };
  }

  PlotChart.prototype.loadData = function loadData(data) {

    var select = document.getElementById('options');
    select.innerHTML = '';
    var ids = _.chain(data).map(function (row) {
      return row.id;
    }).uniq().invoke('sort').value();
    var options = _.map(ids, function (id) {
      var option = document.createElement('option');
      option.id = id;
      option.text = id;
      option.value = id;
      return option;
    });
    var i = 0;
    options.forEach(function (option) {
      select.appendChild(option);
      i++;
    });
    if (i < 20) {
      select.setAttribute('size', i);
    }

    var fSelect = document.getElementById('fields');
    fSelect.innerHTML = '';
    var fields = _.chain(data).first(data).keys().without('id', 't_valid', 'objType', 'type').invoke('sort').value();
    var fOptions = _.map(fields, function (field) {
      var fOption = document.createElement('option');
      fOption.id = field;
      fOption.text = field;
      fOption.value = field;
      return fOption;
    });
    i = 0;
    fOptions.forEach(function (fOption) {
      fSelect.appendChild(fOption);
      i++;
    });
    fSelect.setAttribute('size', i);
    this.data = data;
    this.id = ids[0];
    this.plotAllThreats('t_valid', 'id');
  };

  PlotChart.prototype.switchId = function switchId(id) {
    this.id = _.isString(id) ? parseInt(id, 10) : id;
    this.plotInfo3d.title = "Track " + id + " Position ECEF";
    this.plot3d();
  };

  PlotChart.prototype.switchPlot = function switchPlot(y) {
    this.plot('t_valid', y);
  };

  /**
   *    Create the 3D data series
   */
  PlotChart.prototype.make3dSeries = function make3dSeries(_ref) {
    var data = _ref.data;
    var name = _ref.name;
    var id = this.id;

    var symbol;
    var size;
    var color;
    if (name === 'Truth') {
      symbol = 'dot';
      size = 6;
      color = ''
    } else {
      symbol = 'diamond';
      size = 8;
    }

    var xVals = _.chain(data).filter(function (row) {
      return row.id === id;
    }).map('sv_ecef_x').value();
    var yVals = _.chain(data).filter(function (row) {
      return row.id === id;
    }).map('sv_ecef_y').value();
    var zVals = _.chain(data).filter(function (row) {
      return row.id === id;
    }).map('sv_ecef_z').value();
    return {
      x: xVals,
      y: yVals,
      z: zVals,
      mode: 'markers',
      marker: {
        size: size,
        opacity: 0.6,
        symbol: symbol
      },
      name: name,
      type: 'scatter3d'
    }
  };

  /**
   *    Create the data series for plotting all threats vs time
   */
  PlotChart.prototype.makeAllThreatsSeries = function makeAllThreatsSeries(_ref) {
    var data = _ref.data;
    var name = _ref.name;
    var x = _ref.x;
    var y = _ref.y;
    var id = this.id;

    var symbol;
    var size;
    if (name === 'Truth') {
      symbol = 'dot';
      size = 8;
    } else {
      symbol = 'diamond';
      size = 10;
    }

    var xVals = _.chain(data).map(x).value();
    var yVals = _.chain(data).map(y).value();
    return {
      x: xVals,
      y: yVals,
      mode: 'markers',
      name: name,
      text: 'Track ' + id,
      hoverinfo: '',
      marker: {
        size: size,
        opacity: 0.6,
        symbol: symbol
      },
      type: 'scattergl'
    }
  };

  PlotChart.prototype.makeSeries = function makeSeries(_ref) {
    var data = _ref.data;
    var name = _ref.name;
    var x = _ref.x;
    var y = _ref.y;
    var id = this.id;

    var symbol;
    var size;
    var color;
    if (name === 'Truth') {
      symbol = 'dot';
      size = 8;
    } else {
      symbol = 'diamond';
      size = 10;
    }

    return _.chain(data).filter(function (row) {
      return row.id === id;
    }).reduce(function (acc, row, i) {
      acc.x.push(row[x]);
      acc.y.push(row[y]);
      return acc;
    }, {
      x: [],
      y: [],
      mode: 'markers',
      marker: {
        size: size,
        opacity: 0.6,
        symbol: symbol
      },
      name: name,
      type: 'scattergl'
    }).value();
  };

  PlotChart.prototype.get3dSeries = function get3dSeries(_ref2) {
    var data = _ref2.data;
    var name = _ref2.name;
    var id = this.id;
    var series = this.make3dSeries({
      data: data,
      name: name,
    });
    return [series];
  };

  PlotChart.prototype.getSeriesForType = function getSeriesForType(_ref2) {
    var data = _ref2.data;
    var name = _ref2.name;
    var x = _ref2.x;
    var y = _ref2.y;
    var id = this.id;
    var series = this.makeSeries({
      data: data,
      name: name + ' - ' + y,
      x: x,
      y: y
    });
    return [series];
  };

  PlotChart.prototype.getAllThreats = function getAllThreats(_ref2) {
    var data = _ref2.data;
    var name = _ref2.name;
    var x = _ref2.x;
    var y = _ref2.y;
    var series = this.makeAllThreatsSeries({
      data: data,
      name: name,
      x: x,
      y: y
    });
    return [series];
  };

  PlotChart.prototype.plotAllThreats = function plotAllThreats(x, y) {
    var truth = this.getAllThreats({
      name: 'Truth',
      data: this.data.filter(function (data) {
        return data.type === 'truth';
      }),
      x: x,
      y: y
    });
    var track = this.getAllThreats({
      name: 'Track',
      data: this.data.filter(function (data) {
        return data.type === 'track';
      }),
      x: x,
      y: y
    });
    Plotly.newPlot(this.plotAllThreatsDiv, _.sortBy(truth.concat(track), 'name'), this.plotAllThreatsInfo);
  };

  PlotChart.prototype.plot = function plot(x, y) {
    var truth = this.getSeriesForType({
      name: 'Truth',
      data: this.data.filter(function (data) {
        return data.type === 'truth';
      }),
      x: x,
      y: y
    });
    var track = this.getSeriesForType({
      name: 'Track',
      data: this.data.filter(function (data) {
        return data.type === 'track';
      }),
      x: x,
      y: y
    });
    Plotly.newPlot(this.plotId, _.sortBy(truth.concat(track), 'name'), this.plotInfo);
  };

  PlotChart.prototype.plot3d = function plot3d() {
    var truth = this.get3dSeries({
      name: 'Truth',
      data: this.data.filter(function (data) {
        return data.type === 'truth';
      })
    });
    var track = this.get3dSeries({
      name: 'Track',
      data: this.data.filter(function (data) {
        return data.type === 'track';
      })
    });
    Plotly.newPlot(this.plotId3d, _.sortBy(truth.concat(track), 'name'), this.plotInfo3d);
  };
  return PlotChart;
}();

var chart = new PlotChart();
var handleFileSelect = function handleFileSelect(evt) {
  var _evt$target$files = evt.target.files;
  var file = _evt$target$files[0];
  var reader = new FileReader();
  reader.onload = function (e) {
    var json = "[".concat(e.target.result.replace(/^\s+|(,\s*$)/, '') + ']');
    var newData = JSON.parse(json);
    chart.loadData(newData);
  };
  reader.readAsText(file);
};
