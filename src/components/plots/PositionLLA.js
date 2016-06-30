import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import Plotly from 'plotly.js';
import Theme from '../../helpers/theme.js';

class PositionLLA extends React.Component {

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
    let truthX = [];
    let truthY = [];
    let trackX = [];
    let trackY = [];
    let { maxEl, minEl, lat, lon, maxRange } = antenna.toObject();
    if (minEl < 0) {
      minEl = minEl + 360;
    }

    data.forEach((row) => {
      if (row.get('type') === 'truth') {
        truthX.push(row.get(fieldX));
        truthY.push(row.get(fieldY));
      }
      if (row.get('type') === 'track') {
        trackX.push(row.get(fieldX));
        trackY.push(row.get(fieldY));
      }
    });
    // calculate radar coverage points
    const minElRads = this.toRadians(minEl);
    const maxElRads = this.toRadians(maxEl);
    const latRads = this.toRadians(lat);
    const lonRads = this.toRadians(lon);
    const elMinRangeLat = this.latNew(minElRads, latRads, maxRange);
    const elMinRangeLon = this.lonNew(minElRads, latRads, lonRads, elMinRangeLat, maxRange);
    const elMaxRangeLat = this.latNew(maxElRads, latRads, maxRange);
    const elMaxRangeLon = this.lonNew(maxElRads, latRads, lonRads, elMinRangeLat, maxRange);

    const coverageX = [lon, this.toDegrees(elMaxRangeLon), this.toDegrees(elMinRangeLon), lon];
    const coverageY = [lat, this.toDegrees(elMaxRangeLat), this.toDegrees(elMinRangeLat), lat];

    return [{
      type: 'scatter',
      x: truthX,
      y: truthY,
      mode: 'markers',
      marker: {
        color: Theme.palette.truth,
        size: 18,
        opacity: 0.6,
        symbol: 'dot',
        line: {
          opacity: 1.0,
          width: 1,
          color: Theme.palette.truth
        }
      },
      name: 'Truth'
    },
    {
      type: 'scatter',
      x: trackX,
      y: trackY,
      mode: 'markers',
      marker: {
        color: Theme.palette.track,
        size: 10,
        opacity: 0.5,
        symbol: 'diamond',
        line: {
          opacity: 1.0,
          width: 1,
          color: Theme.palette.truth
        }
      },
      name: 'Track'
    },
    {
      type: 'scatter',
      x: coverageX,
      y: coverageY,
      mode: 'none',
      fill: 'tonexty',
      fillcolor: 'rgba(100, 181, 246, 0.3)',
      name: 'Coverage'
    }];
  }

  toRadians (deg) {
    return deg*Math.PI/180;
  }

  toDegrees (rad) {
    return rad*180/Math.PI;
  }

  latNew (bearing, originLat, radius) {
    const R = 6378100;
    return Math.asin(Math.sin(originLat) * Math.cos(radius / R) +
          Math.cos(originLat) * Math.sin(radius / R) * Math.cos(bearing));
  }

  lonNew (bearing, originLat, originLon, destinationLat, radius) {
    const R = 6378100;
    return originLon + Math.atan2(Math.sin(bearing) * Math.sin(radius / R) * Math.cos(originLat),
            Math.cos(radius / R) - Math.sin(originLat) * Math.sin(destinationLat));
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

export default PositionLLA;
