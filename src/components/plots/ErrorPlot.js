import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import Plotly from 'plotly.js';
// import { Vector3, CatmullRomCurve3 } from 'three';
import Theme from '../../helpers/theme.js';

class ErrorPlot extends React.Component {

  // data should be an array of track and truth data
  // filtered by a track id
  static propTypes = {
    data: PropTypes.object,
    title: PropTypes.string,
    error: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number
  }

  constructor () {
    super();
    this.state = {};
  }

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
    let tracks = [];
    let trackTimes = [];
    const { error } = this.props;

    data.forEach((row, i) => {
      tracks.push(row.get(error));
      trackTimes.push(row.get('t_valid'));
    });

    return [{
      type: 'scatter',
      x: trackTimes,
      y: tracks,
      mode: 'markers+lines',
      marker: {
        size: 8,
        opacity: 0.6,
        symbol: 'dot',
        color: Theme.palette.track,
        line: {
          opacity: 0.5,
          width: 1,
          color: Theme.palette.truth
        }
      },
      name: 'Truth'
    }];
  }

  createLayout () {
    const { title, width, height } = this.props;
    return {
      title,
      width,
      height,
      xaxis: {
        title: 'Time'
      },
      yaxis: {
        title: 'Error'
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

export default ErrorPlot;
