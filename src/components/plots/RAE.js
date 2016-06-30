import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import Plotly from 'plotly.js';
import Theme from '../../helpers/theme.js';

class RAE extends React.Component {

  // data should be an array of track and truth data
  // filtered by a track id
  static propTypes = {
    data: PropTypes.object,
    antenna: PropTypes.object,
    title: PropTypes.string,
    width: PropTypes.number,
    fieldX: PropTypes.string,
    fieldY: PropTypes.string,
    height: PropTypes.number
  }

  constructor () {
    super();
    this.state = {};
  }

  // Life Cycle Methods - read about
  componentDidMount () {
    const plotDiv = ReactDOM.findDOMNode(this);
    this.setState({
      plotDiv
    });
    Plotly.newPlot(plotDiv, this.createPlotData(this.props.data), this.createLayout());
  }

  componentWillReceiveProps (nextProps) {
    const { plotDiv } = this.state;
    this.props = nextProps;
    if (plotDiv) {
      Plotly.newPlot(plotDiv, this.createPlotData(nextProps.data), this.createLayout());
    }
  }

  createPlotData (data) {
    const { fieldX, fieldY, antenna } = this.props;
    const faces = antenna.get('faces');

    let truthX = [];
    let truthY = [];
    let tMin = 0;
    let tMax = 0;
    let tNow;
    data.forEach((row) => {
      if (row.get('type') === 'truth') {
        truthX.push(row.get(fieldX));
        truthY.push(row.get(fieldY));
        tNow = row.get('t_valid');
        if (tNow < tMin) {
          tMin = tNow;
        }
        if (tNow > tMax) {
          tMax = tNow;
        }
      }
    });

    let coverages = [];
    let coverageTimes = [];
    let coverageSeries = [];
    switch (fieldY) {
      case 'elDeg':
        const minEl = antenna.get('minEl');
        const maxEl = antenna.get('maxEl');
        coverages = [minEl, minEl, maxEl, maxEl];
        coverageTimes = [tMin, tMax, tMax, tMin];
        coverageSeries.push(this.createCoverageSeries(coverageTimes, coverages));
        break;
      case 'azDeg':
        faces.forEach((face) => {
          const minAz = face.get('minAz');
          const maxAz = face.get('maxAz');
          coverages = [minAz, maxAz, maxAz, minAz];
          coverageTimes = [tMin, tMin, tMax, tMax];
          coverageSeries.push(this.createCoverageSeries(coverageTimes, coverages));
        });
    }

    const truthSeries = [{
      type: 'scatter',
      x: truthX,
      y: truthY,
      mode: 'markers',
      marker: {
        color: Theme.palette.truth,
        size: 14,
        opacity: 0.6,
        symbol: 'dot',
        line: {
          opacity: 1.0,
          width: 1,
          color: Theme.palette.truth
        }
      },
      name: 'Truth'
    }];

    return truthSeries.concat(coverageSeries);
  }

  createCoverageSeries (dataX, dataY) {
    return {
      type: 'scatter',
      x: dataX,
      y: dataY,
      mode: 'none',
      fill: 'tonextx',
      fillcolor: 'rgba(100, 181, 246, 0.3)',
      name: 'Coverage'
    };
  }

  createLayout () {
    const { title, width, height, fieldX, fieldY } = this.props;
    return {
      title,
      width,
      height,
      xaxis: {
        title: fieldX
      },
      yaxis: {
        title: fieldY
      }
    };
  }

  config = {
    showLink: false,
    displayModeBar: true
  };

  render () {
    return (
      <div />
    );
  }
}

export default RAE;
