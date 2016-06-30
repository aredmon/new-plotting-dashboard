import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import Plotly from 'plotly.js';
import Theme from '../../helpers/theme.js';

class Position3D extends React.Component {

  // data should be an array of track and truth data
  // filtered by a track id
  static propTypes = {
    data: PropTypes.object,
    antenna: PropTypes.object,
    title: PropTypes.string,
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
    if (plotDiv) {
      Plotly.newPlot(plotDiv, this.createPlotData(nextProps.data), this.createLayout());
    }
  }

  createPlotData (data) {
    let truthX = [];
    let truthY = [];
    let truthZ = [];
    let trackX = [];
    let trackY = [];
    let trackZ = [];
    let maxAlt = 0;
    // get track/truth points
    data.forEach((row) => {
      if (row.get('type') === 'truth') {
        truthX.push(row.get('lon'));
        truthY.push(row.get('lat'));
        truthZ.push(row.get('alt'));
      }
      if (row.get('type') === 'track') {
        trackX.push(row.get('lon'));
        trackY.push(row.get('lat'));
        trackZ.push(row.get('alt'));
      }
      if (row.get('alt') > maxAlt) {
        maxAlt = row.get('alt');
      }
    });
    this.maxAlt = maxAlt;
    // calculate radar coverage
    const { antenna } = this.props;
    let { maxEl, minEl, lat, lon, maxRange } = antenna.toObject();
    const faces = antenna.get('faces');
    let azMin = 0;
    let azMax = 0;
    // get the min and max az values
    faces.forEach((face) => {
      const minAz = face.get('minAz');
      const maxAz = face.get('maxAz');
      if (minAz < azMin) {
        azMin = minAz;
      }
      if (maxAz > azMax) {
        azMax = maxAz;
      }
    });
    if (minEl < 0) {
      minEl = 0;
    }
    minEl = this.toRadians(minEl);
    maxEl = this.toRadians(maxEl);

    const minAzRads = this.toRadians(azMin);
    const maxAzRads = this.toRadians(azMax);
    const latRads = this.toRadians(lat);
    const lonRads = this.toRadians(lon);
    const elMinAzMinRangeLat = this.latNew(minAzRads, latRads, maxRange*Math.cos(minEl));
    const elMinAzMinRangeLon = this.lonNew(minAzRads, latRads, lonRads, elMinAzMinRangeLat, maxRange*Math.cos(minEl));
    const elMaxAzMinRangeLat = this.latNew(minAzRads, latRads, maxRange*Math.cos(maxEl));
    const elMaxAzMinRangeLon = this.lonNew(minAzRads, latRads, lonRads, elMaxAzMinRangeLat, maxRange*Math.cos(maxEl));

    const elMinAzMaxRangeLat = this.latNew(maxAzRads, latRads, maxRange*Math.cos(minEl));
    const elMinAzMaxRangeLon = this.lonNew(maxAzRads, latRads, lonRads, elMinAzMaxRangeLat, maxRange*Math.cos(minEl));
    const elMaxAzMaxRangeLat = this.latNew(maxAzRads, latRads, maxRange*Math.cos(maxEl));
    const elMaxAzMaxRangeLon = this.lonNew(maxAzRads, latRads, lonRads, elMaxAzMaxRangeLat, maxRange*Math.cos(maxEl));

    const coverageX = [
      lon,
      this.toDegrees(elMinAzMinRangeLon),
      this.toDegrees(elMinAzMaxRangeLon),
      this.toDegrees(elMaxAzMaxRangeLon),
      this.toDegrees(elMaxAzMinRangeLon),
      lon,
      this.toDegrees(elMaxAzMinRangeLon),
      this.toDegrees(elMaxAzMaxRangeLon),
      this.toDegrees(elMinAzMaxRangeLon),
      this.toDegrees(elMinAzMinRangeLon),
      lon
    ];
    const coverageY = [
      lat,
      this.toDegrees(elMinAzMinRangeLat),
      this.toDegrees(elMinAzMaxRangeLat),
      this.toDegrees(elMaxAzMaxRangeLat),
      this.toDegrees(elMaxAzMinRangeLat),
      lat,
      this.toDegrees(elMaxAzMinRangeLat),
      this.toDegrees(elMaxAzMaxRangeLat),
      this.toDegrees(elMinAzMaxRangeLat),
      this.toDegrees(elMinAzMinRangeLat),
      lat
    ];
    const coverageZ = [
      0,
      this.toDegrees(maxRange*Math.sin(minEl)),
      this.toDegrees(maxRange*Math.sin(minEl)),
      this.toDegrees(maxRange*Math.sin(maxEl)),
      this.toDegrees(maxRange*Math.sin(maxEl)),
      0,
      this.toDegrees(maxRange*Math.sin(maxEl)),
      this.toDegrees(maxRange*Math.sin(maxEl)),
      this.toDegrees(maxRange*Math.sin(minEl)),
      this.toDegrees(maxRange*Math.sin(minEl)),
      0
    ];
    console.debug(minEl, maxEl, maxRange);
    console.debug(coverageX);
    console.debug(coverageY);
    console.debug(coverageZ);

    return [
      {
        type: 'scatter3d',
        x: truthX,
        y: truthY,
        z: truthZ,
        mode: 'markers',
        marker: {
          color: Theme.palette.truth,
          size: 6,
          opacity: 0.5,
          symbol: 'diamond',
          line: {
            opacity: 0.8,
            width: 1,
            weight: 3,
            color: Theme.palette.truth
          }
        },
        line: {
          opacity: 0.6,
          weight: 3,
          shape: 'spline'
        },
        name: 'Truth'
      },
      {
        type: 'scatter3d',
        x: trackX,
        y: trackY,
        z: trackZ,
        mode: 'markers',
        marker: {
          color: Theme.palette.track,
          size: 4,
          opacity: 0.5,
          symbol: 'dot',
          line: {
            opacity: 0.8,
            width: 1,
            color: Theme.palette.track
          }
        },
        line: {
          opacity: 0.6,
          shape: 'spline'
        },
        name: 'Track'
      },
      {
        type: 'mesh3d',
        x: coverageX,
        y: coverageY,
        z: coverageZ,
        opacity: 0.4
      }
    ];
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
    return {
      title: this.props.title,
      width: this.props.width,
      height: this.props.height,
      scene: {
        xaxis: {
          title: 'Lon'
        },
        yaxis: {
          title: 'Lat'
        },
        zaxis: {
          title: 'Alt',
          range: [0, this.maxAlt*1.2]
        }
      }
    };
  }

  config = {
    // showLink: false,
    displayModeBar: true
  };

  makePlot () {

  }

  render () {
    return (
      <div />
    );
  }
}

export default Position3D;
