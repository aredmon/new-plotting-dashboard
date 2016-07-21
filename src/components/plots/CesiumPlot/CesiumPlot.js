import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
/* eslint-disable no-unused-vars, no-undef */
// The two cesium imports are imported only to include the scripts. The
// varables are not used
import widgets from 'cesium/Build/Cesium/Widgets/widgets.css';
import c from 'cesium/Build/CesiumUnminified/Cesium.js';
import CesiumSensorsVolumes from 'cesium-sensor-volumes/dist/cesium-sensor-volumes';

class CesiumPlot extends React.Component {

  constructor () {
    super();
    this.state = {};
    this.drawShapes = this.drawShapes.bind(this);
    this.drawThreats = this.drawThreats.bind(this);
  }
  // data should be an array of track and truth data
  // filtered by a track id
  static propTypes = {
    data: PropTypes.object,
    radarData: PropTypes.object,
    trackIds: PropTypes.object,
    title: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number
  }

  /**
   * This method loads the initial plot the first time this component is mounted
   * It stores the reference to the DOM element that is created in the `render()`
   * method
   * @see https://facebook.github.io/react/docs/component-specs.html
   */
  componentDidMount () {
    window.CESIUM_BASE_URL = '../Cesium';
    const Cesium = window.Cesium;
    Cesium.BingMapsApi.defaultKey = 'AhguTre8xUgKVVHSEr1OhOLMeDm-kEUc5-4Jq6VZSHUHEBAal9P_YRs5gNW3BjeV';
    const Viewer = new Cesium.Viewer('cesiumContainer');
    var terrainProvider = new Cesium.CesiumTerrainProvider({
      url: '//assets.agi.com/stk-terrain/world'
    });
    Viewer.terrainProvider = terrainProvider;
    this.cesium = Cesium;
    this.viewer = Viewer;
    this.drawScene();
    Viewer.flyTo(Viewer.entities);
  }

  /**
   * This method reloads the plot if the date is updated while the component is still
   * mounted
   * @param  {[Object]} nextProps the props passed into the react component
   * @see https://facebook.github.io/react/docs/component-specs.html
   */
  componentWillReceiveProps (nextProps) {
    this.props = nextProps;
    this.drawScene();
  }

  componentWillUnmount () {
    this.viewer.destroy();
  }

  drawScene () {
    this.clearScene();
    this.drawThreats();
    this.drawShapes();
    this.viewer.scene.globe.depthTestAgainstTerrain = true;
    this.viewer.flyTo(this.viewer.entities);
  }

  clearScene () {
    const { viewer } = this;
    viewer.scene.primitives.removeAll();
    viewer.entities.removeAll();
  }

  drawShapes () {
    const { cesium, viewer } = this;
    let { maxEl,
      minEl,
      maxRange: radarRange,
      lat: radarLat,
      lon: radarLon,
      positionAlt: radarAlt,
      startAz,
      endAz,
      radarId,
      radarName
    } = this.props.radarData.toJS();
    // massage vars as necessary
    if (startAz !== 0) { startAz = 0; }
    if (endAz > Math.PI/2) { endAz = Math.PI/2; }
    const halfAngleX = cesium.Math.toRadians(Math.abs((maxEl-minEl))/2);
    const halfAngleY = (endAz-startAz)/2;

    var ellipsoid = viewer.scene.globe.ellipsoid;
    var clock = cesium.Math.toRadians(0.0);
    var cone = cesium.Math.toRadians(132.0);
    var twist = -halfAngleX-cesium.Math.toRadians(3.0);
    var location = ellipsoid.cartographicToCartesian(
      new cesium.Cartographic(
        radarLon,
        radarLat,
        radarAlt
      ));

    const getModelMatrix = () => {
      var modelMatrix = cesium.Transforms.northUpEastToFixedFrame(location);
      var orientation = cesium.Matrix3.multiply(
        cesium.Matrix3.multiply(
          cesium.Matrix3.fromRotationZ(clock),
          cesium.Matrix3.fromRotationY(cone),
          new cesium.Matrix3()),
        cesium.Matrix3.fromRotationX(twist),
        new cesium.Matrix3()
      );
      return cesium.Matrix4.multiply(
        modelMatrix,
        cesium.Matrix4.fromRotationTranslation(
          orientation,
          cesium.Cartesian3.ZERO),
          new cesium.Matrix4());
    };

    const sensorOptions = {
      modelMatrix: getModelMatrix(),
      radius: radarRange*2,
      xHalfAngle: cesium.Math.toRadians(Math.abs((maxEl-minEl))/2),
      yHalfAngle: (endAz-startAz)/2,
      lateralSurfaceMaterial: new cesium.Material({
        fabric: {
          type: 'Color',
          uniforms: {
            color: new cesium.Color(0.0, 1.0, 1.0, 0.4)
          }
        }
      }),
      showIntersection: true
    };

    const addRectangularSensor =() => {
      const recSensor = new CesiumSensorVolumes.RectangularPyramidSensorVolume(sensorOptions);
      viewer.scene.primitives.add(recSensor);
    };

    const addSphericalSensor = () => {
      console.debug(radarLon, radarLat, radarAlt, radarRange);
      var redSphere = viewer.entities.add({
        name: 'Red sphere with black outline',
        position: cesium.Cartesian3.fromRadians(
          radarLon,
          radarLat,
          radarAlt
        ),
        ellipsoid: {
          radii: new cesium.Cartesian3(radarRange, radarRange, radarRange),
          material: cesium.Color.RED.withAlpha(0.5),
          outline: true,
          outlineColor: cesium.Color.BLACK
        }
      });
    };

    const addCustomSensor = () => {
      // viewer.scene.primitives.removeAll();
      var customSensor = new CesiumSensorVolumes.CustomSensorVolume();
      var directions = [];
      for (var i = 0; i < 8; ++i) {
        var clock = cesium.Math.toRadians(45.0 * i);
        var cone = cesium.Math.toRadians(25.0);
        directions.push(new cesium.Spherical(clock, cone));
      }
      customSensor.modelMatrix = getModelMatrix();
      customSensor.radius = 20000000.0;
      customSensor.directions = directions;
      viewer.scene.primitives.add(customSensor);
    };

    addRectangularSensor();
    // addSphericalSensor();
    return;
  }

  drawThreats () {
    const { data } = this.props;
    const { cesium, viewer } = this;
    let truthMap = {};
    let trackMap = {};
    let terrainMap = {};
    // time this task
    const begin = Date.now();
    let count = 0;
    data.forEach(row => {
      let key = row.get('id');
      // get the sim data in cartographic coordinates
      let lat = row.get('lat');
      let lon = row.get('lon');
      let alt = row.get('alt');

      // convert to proper coordinate
      let coordinate = viewer.scene.globe.ellipsoid.cartographicToCartesian(
        new cesium.Cartographic(
          lon,
          lat,
          alt
        ));

      if (row.get('type') === 'truth') {
        if (!truthMap[key]) {
          truthMap[key] = [];
        }
        truthMap[key].push(coordinate);
      }

      if (row.get('type') === 'track') {
        if (!trackMap[key]) {
          trackMap[key] = [];
        }
        trackMap[key].push(coordinate);
      }

      // if (row.get('type') === 'terrain') {
      //   if (!terrainMap[key]) {
      //     terrainMap[key] = [];
      //   }
      //   terrainMap[key].push(coordinate);
      // }
      count++;
    });
    const dataProcess = Date.now();
    let seconds = (dataProcess - begin) / 1000;
    console.debug(`Processed ${count} rows in ${seconds} seconds.`);

    for (var trackId in truthMap) {
      viewer.entities.add(
        {
          name: `Track ${trackId}`,
          polyline: {
            positions: truthMap[trackId],
            width: 2,
            material: cesium.Color.BLUE
          }
        }
      );
    }

    for (var truthId in trackMap) {
      viewer.entities.add(
        {
          name: `Truth ${truthId}`,
          polyline: {
            positions: trackMap[truthId],
            width: 2,
            material: cesium.Color.GREEN
          }
        }
      );
    }

    // for (var terrainId in terrainMap) {
    //   viewer.entities.add(
    //     {
    //       name: `Track ${terrainId}`,
    //       polyline: {
    //         positions: cesium.Cartesian3.fromRadiansArrayHeights(
    //           terrainMap[terrainId],
    //           viewer.scene.globe.ellipsoid,
    //         ),
    //         width: 2,
    //         material: cesium.Color.RED
    //       }
    //     }
    //   );
    // }

    const dataRender = Date.now();
    seconds = (dataRender - dataProcess) / 1000;
    console.debug(`Rendered data in ${seconds} seconds.`);
  }

  /**
   * React lifecycle method. In this plot component react only needs to create an empty
   * div. In the `componentDidMount` method the div reference is assigned to a
   * member variable
   * @return {[jsx]} The JSX for React to render
   * @see https://facebook.github.io/react/docs/component-specs.html
   */
  render () {
    if (this.viewer) {
      this.drawScene();
    }
    return (
      <div id={'cesiumContainer'} style={{height: '100%'}}/>
    );
  }
}

const mapStateToProps = (state) => ({
  trackIds: state.metrics.get('trackIds')
});

export default connect(mapStateToProps)(CesiumPlot);
