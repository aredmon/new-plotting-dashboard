import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import Plotly from 'plotly.js';
import Theme from '../../helpers/theme.js';

class BeamPosition extends React.Component {

  // data should be an array of track and truth data
  // filtered by a track id
  static propTypes = {
    data: PropTypes.object,
    title: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    fieldX: PropTypes.string,
    fieldY: PropTypes.string
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
    if (plotDiv) {
      Plotly.newPlot(plotDiv, this.createPlotData(nextProps.data), this.createLayout());
    }
  }

  createPlotData (data) {
    // get beam position data
    const beamPositionData = data.filter((row) => {
      return row.get('type') === 'beamPosition';
    });

    const { fieldX, fieldY } = this.props;
    let beamX = [];
    let beamY = [];

    beamPositionData.forEach((row) => {
      beamX.push(row.get(fieldX));
      beamY.push(row.get(fieldY));
    });

    return [{
      type: 'scatter',
      x: beamX,
      y: beamY,
      mode: 'markers',
      marker: {
        size: 12,
        opacity: 0.6,
        symbol: 'dot',
        color: Theme.palette.track,
        line: {
          opacity: 0.5,
          width: 1,
          color: Theme.palette.truth
        }
      },
      name: 'Beam Position'
    }];
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

export default BeamPosition;
