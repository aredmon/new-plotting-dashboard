import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
/* eslint-disable no-unused-vars, no-undef */
// The two cesium imports are imported only to include the scripts. The
// varables are not used
import widgets from 'cesium/Build/Cesium/Widgets/widgets.css';
import c from 'cesium/Build/CesiumUnminified/Cesium.js';
import CesiumSensorsVolumes from 'cesium-sensor-volumes/dist/cesium-sensor-volumes';

class CesiumPlot extends React.Component {

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
    this.Cesium = window.Cesium;
    this.Cesium.BingMapsApi.defaultKey = 'AhguTre8xUgKVVHSEr1OhOLMeDm-kEUc5-4Jq6VZSHUHEBAal9P_YRs5gNW3BjeV';
    this.viewer = new this.Cesium.Viewer('cesiumContainer');
    this.drawThreats();
    this.drawShapes();
    this.viewer.zoomTo(this.viewer.entities);
  }

  /**
   * This method reloads the plot if the date is updated while the component is still
   * mounted
   * @param  {[Object]} nextProps the props passed into the react component
   * @see https://facebook.github.io/react/docs/component-specs.html
   */
  componentWillReceiveProps (nextProps) {
    this.props = nextProps;
  }

  componentWillUnmount () {
    this.viewer.destroy();
  }

  drawShapes () {
    var longitude = 0.3989822670059037;
    var latitude = 0.9468411192069237;
    var altitude = 170.0;
    var clock = 0.0;
    var cone = this.Cesium.Math.toRadians(30.0);
    var twist = 0.0;

    const getModelMatrix = () => {
      var ellipsoid = this.viewer.scene.globe.ellipsoid;
      var location = ellipsoid.cartographicToCartesian(
        new this.Cesium.Cartographic(
          longitude,
          latitude,
          altitude
        ));
      var modelMatrix = this.Cesium.Transforms.northUpEastToFixedFrame(location);
      var orientation = this.Cesium.Matrix3.multiply(
        this.Cesium.Matrix3.multiply(
          this.Cesium.Matrix3.fromRotationZ(clock),
          this.Cesium.Matrix3.fromRotationY(cone),
          new this.Cesium.Matrix3()),
        this.Cesium.Matrix3.fromRotationX(twist),
        new this.Cesium.Matrix3()
      );
      return this.Cesium.Matrix4.multiply(
        modelMatrix,
        this.Cesium.Matrix4.fromRotationTranslation(
          orientation,
          this.Cesium.Cartesian3.ZERO),
          new this.Cesium.Matrix4());
    };

    const addRectangularSensor =() => {
      // this.viewer.scene.primitives.removeAll();
      var rectangularPyramidSensor = new CesiumSensorVolumes.RectangularPyramidSensorVolume();
      rectangularPyramidSensor.modelMatrix = getModelMatrix();
      rectangularPyramidSensor.radius = 200000.0;
      rectangularPyramidSensor.xHalfAngle = this.Cesium.Math.toRadians(30.0);
      // rectangularPyramidSensor.yHalfAngle = this.Cesium.Math.toRadians(20.0);
      rectangularPyramidSensor.yHalfAngle = this.Cesium.Math.toRadians(15.0);
      rectangularPyramidSensor.lateralSurfaceMaterial = this.Cesium.Material.fromType('Color');
      rectangularPyramidSensor.lateralSurfaceMaterial.uniforms.color = new this.Cesium.Color(0.0, 1.0, 1.0, 0.5);
      this.viewer.scene.primitives.add(rectangularPyramidSensor);
    };

    addRectangularSensor();
    return;
  }

  drawThreats () {
    const { data } = this.props;

    let truthMap = {};
    let trackMap = {};
    let terrainMap = {};
    // time this task
    const begin = Date.now();
    let count = 0;
    data.forEach(row => {
      let key = row.get('id');
      if (row.get('type') === 'truth') {
        if (!truthMap[key]) {
          truthMap[key] = [];
        }
        truthMap[key].push(row.get('lat'));
        truthMap[key].push(row.get('lon'));
        truthMap[key].push(row.get('alt'));
      }

      if (row.get('type') === 'track') {
        if (!trackMap[key]) {
          trackMap[key] = [];
        }
        trackMap[key].push(row.get('lat'));
        trackMap[key].push(row.get('lon'));
        trackMap[key].push(row.get('alt'));
      }

      if (row.get('type') === 'terrain') {
        if (!terrainMap[key]) {
          terrainMap[key] = [];
        }
        terrainMap[key].push(row.get('lat'));
        terrainMap[key].push(row.get('lon'));
        terrainMap[key].push(row.get('alt'));
      }
      count++;
    });
    const dataProcess = Date.now();
    let seconds = (dataProcess - begin) / 1000;
    console.debug(`Processed ${count} rows in ${seconds} seconds.`);

    for (var trackId in truthMap) {
      this.viewer.entities.add(
        {
          name: `Track ${trackId}`,
          polyline: {
            positions: this.Cesium.Cartesian3.fromRadiansArrayHeights(truthMap[trackId]),
            width: 2,
            material: this.Cesium.Color.BLUE
          }
        }
      );
    }

    for (var truthId in trackMap) {
      this.viewer.entities.add(
        {
          name: `Track ${truthId}`,
          polyline: {
            positions: this.Cesium.Cartesian3.fromRadiansArrayHeights(trackMap[truthId]),
            width: 2,
            material: this.Cesium.Color.GREEN
          }
        }
      );
    }

    for (var terrainId in terrainMap) {
      this.viewer.entities.add(
        {
          name: `Track ${terrainId}`,
          polyline: {
            positions: this.Cesium.Cartesian3.fromRadiansArrayHeights(terrainMap[terrainId]),
            width: 2,
            material: this.Cesium.Color.RED
          }
        }
      );
    }

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
    return (
      <div id={'cesiumContainer'} style={{height: '100%'}}/>
    );
  }
}

const mapStateToProps = (state) => ({
  trackIds: state.metrics.get('trackIds')
});

export default connect(mapStateToProps)(CesiumPlot);
