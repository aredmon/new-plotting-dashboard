import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import Plotly from 'plotly.js';
import Theme from '../../helpers/theme.js';

class Position3D extends React.Component {

  // data should be an array of track and truth data
  // filtered by a track id
  static propTypes = {
    data: PropTypes.object,
    radarData: PropTypes.object,
    title: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number
  }

  constructor () {
    super();
    this.state = {};
    this.constructRadar = this.constructRadar.bind(this);
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

  constructRadar (radarData) {
    this.maxAlt = radarData.get('maxAlt');
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
    const {radarData} = this.props;
    let { maxEl, minEl, lat, lon, maxRange, startAz, endAz } = radarData.toJS();
    console.log('truth length = ' + truthX.length);
    console.debug('track length = ' + trackX.length);
    if (minEl < 0) {
      minEl = 0;
    }
    minEl = this.toRadians(minEl);
    maxEl = this.toRadians(maxEl);

    console.debug('minAz = ' + startAz + 'lat = ' + lat + ' maxRange = ' + maxRange);
    const elMinAzMinRangeLat = this.latNew(startAz, lat, maxRange*Math.cos(minEl));
    const elMinAzMinRangeLon = this.lonNew(startAz, lat, lon, elMinAzMinRangeLat, maxRange*Math.cos(minEl));
    const elMaxAzMinRangeLat = this.latNew(startAz, lat, maxRange*Math.cos(maxEl));
    const elMaxAzMinRangeLon = this.lonNew(startAz, lat, lon, elMaxAzMinRangeLat, maxRange*Math.cos(maxEl));

    const elMinAzMaxRangeLat = this.latNew(endAz, lat, maxRange*Math.cos(minEl));
    const elMinAzMaxRangeLon = this.lonNew(endAz, lat, lon, elMinAzMaxRangeLat, maxRange*Math.cos(minEl));
    const elMaxAzMaxRangeLat = this.latNew(endAz, lat, maxRange*Math.cos(maxEl));
    const elMaxAzMaxRangeLon = this.lonNew(endAz, lat, lon, elMaxAzMaxRangeLat, maxRange*Math.cos(maxEl));

    const coverageX = [
      lon,
      elMinAzMinRangeLon,
      elMinAzMaxRangeLon,
      elMaxAzMaxRangeLon,
      elMaxAzMinRangeLon,
      lon,
      elMaxAzMaxRangeLon,
      elMaxAzMinRangeLon,
      elMinAzMaxRangeLon,
      elMinAzMinRangeLon,
      lon
    ];
    const coverageY = [
      lat,
      elMinAzMinRangeLat,
      elMinAzMaxRangeLat,
      elMaxAzMaxRangeLat,
      elMaxAzMinRangeLat,
      lat,
      elMaxAzMinRangeLat,
      elMaxAzMaxRangeLat,
      elMinAzMaxRangeLat,
      elMinAzMinRangeLat,
      lat
    ];
    const coverageZ = [
      0,
      maxRange*Math.sin(minEl),
      maxRange*Math.sin(minEl),
      maxRange*Math.sin(maxEl),
      maxRange*Math.sin(maxEl),
      0,
      maxRange*Math.sin(maxEl),
      maxRange*Math.sin(maxEl),
      maxRange*Math.sin(minEl),
      maxRange*Math.sin(minEl),
      0
    ];
    console.debug(minEl, maxEl, maxRange);
    console.debug(coverageX);
    console.debug(coverageY);
    console.debug(coverageZ);

    return [
      // {
      //   type: 'scatter3d',
      //   x: truthX,
      //   y: truthY,
      //   z: truthZ,
      //   mode: 'markers',
      //   marker: {
      //     color: Theme.palette.truth,
      //     size: 6,
      //     opacity: 0.5,
      //     symbol: 'dot',
      //     line: {
      //       opacity: 0.8,
      //       width: 1,
      //       weight: 1,
      //       color: Theme.palette.truth
      //     }
      //   },
      //   name: 'Truth'
      // },
      // {
      //   type: 'scatter3d',
      //   x: trackX,
      //   y: trackY,
      //   z: trackZ,
      //   mode: 'markers',
      //   marker: {
      //     color: Theme.palette.track,
      //     size: 4,
      //     opacity: 0.5,
      //     symbol: 'dot',
      //     line: {
      //       opacity: 0.8,
      //       width: 1,
      //       color: Theme.palette.track
      //     }
      //   },
      //   name: 'Track'
      // },
      {
        type: 'mesh3d',
        x: [0, 0, 1, 1, 0, 0, 1, 1],
        y: [0, 1, 1, 0, 0, 1, 1, 0],
        z: [0, 0, 0, 0, 1, 1, 1, 1],
        i: [7, 0, 0, 0, 4, 4, 6, 6, 4, 0, 3, 2],
        j: [3, 4, 1, 2, 5, 6, 5, 2, 0, 1, 6, 3],
        j: [0, 7, 2, 3, 6, 7, 1, 1, 5, 5, 7, 6],
        opacity: 0.4,
        name: 'Coverage'
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
    console.debug('bearing =' + bearing + ' originLat = ' + originLat + ' radius  ' + radius);
    const R = 6378100;
    return Math.asin(Math.sin(originLat) * Math.cos(radius / R) +
          Math.cos(originLat) * Math.sin(radius / R) * Math.cos(bearing));
  }

  lonNew (bearing, originLat, originLon, destinationLat, radius) {
    console.debug(bearing + ', ' + originLat + ', ' + originLon + ' ' + destinationLat + ', ' + radius);
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
          title: 'Alt'
          // range: [0, this.maxAlt*1.2]
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
