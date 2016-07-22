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
    // this.viewer.flyTo(this.viewer.entities);
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
      halfSector,
      boreAzimuth,
      radarId,
      radarName,
      modelName,
      modelId
    } = this.props.radarData.toJS();
    const airRange = radarRange;
    const ramRange = radarRange/10;
    const airCoverageColor = new cesium.Color(0.0, 1.0, 1.0, 0.3);
    const ramCoverageColor = new cesium.Color(1.0, 0.54, 0.0, 0.3);
    const halfAngleX = Math.abs((maxEl-minEl))/2;
    const halfAngleY = halfSector;

    var ellipsoid = viewer.scene.globe.ellipsoid;
    var clock = cesium.Math.toRadians(0.0);
    var cone = -(boreAzimuth - cesium.Math.toRadians(90));
    var twist = -halfAngleX-cesium.Math.toRadians(3.0);
    var location = ellipsoid.cartographicToCartesian(
      new cesium.Cartographic(
        radarLon,
        radarLat,
        radarAlt
      ));

    /**
     * Creates a matrix model to orient the sensor
     * @param  {[Number]} rotation The angle in Radians to rotate the sensor relative to East
     */
    const getModelMatrix = (rotation) => {
      var modelMatrix = cesium.Transforms.northUpEastToFixedFrame(location);
      var orientation = cesium.Matrix3.multiply(
        cesium.Matrix3.multiply(
          cesium.Matrix3.fromRotationZ(clock),
          cesium.Matrix3.fromRotationY(rotation),
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

    /**
     * This method creates the sensor options object
     * @param  {[MatrixModel]} model  The sensor's matrix model
     * @param  {[Number]} range       The sensor's range
     * @param  {[Number]} halfAngle   The sensor's half angle
     * @param  {[Color]} color        The color of the coverage volume
     * @return {[Object]}             The sensor configuration object
     */
    const getSensorOptions = (model, range, halfAngle, color) => {
      return {
        modelMatrix: model,
        radius: range,
        xHalfAngle: halfAngleX,
        yHalfAngle: halfAngle,
        lateralSurfaceMaterial: new cesium.Material({
          fabric: {
            type: 'Color',
            uniforms: {
              color: color
            }
          }
        }),
        showIntersection: false
      };
    };

    /**
     * Create a rectangular Sensor
     * @return {[type]} [description]
     */
    const addRectangularSensor =() => {
      const airSensor = new CesiumSensorVolumes.RectangularPyramidSensorVolume(
        getSensorOptions(getModelMatrix(cone), airRange, halfAngleY, airCoverageColor));
      viewer.scene.primitives.add(airSensor);

      const ramSensor = new CesiumSensorVolumes.RectangularPyramidSensorVolume(
        getSensorOptions(getModelMatrix(cone), ramRange, halfAngleY, ramCoverageColor));
      viewer.scene.primitives.add(ramSensor);
    };

    /**
     * Create an array of rectangular sensors
     */
    const addRectangularSensorArray =() => {
      const sectorIncrements = cesium.Math.toRadians(45);
      const startingAngle = cone+(sectorIncrements/2);
      let count = 0;
      for (var i = startingAngle; i < halfSector*2; i+=sectorIncrements*2) {
        const airSensor = new CesiumSensorVolumes.RectangularPyramidSensorVolume(
          getSensorOptions(getModelMatrix(i), airRange, sectorIncrements, airCoverageColor));
        const ramSensor = new CesiumSensorVolumes.RectangularPyramidSensorVolume(
          getSensorOptions(getModelMatrix(i), ramRange, sectorIncrements, ramCoverageColor));
        viewer.scene.primitives.add(airSensor);
        viewer.scene.primitives.add(ramSensor);
      }
    };

    /**
     * Create a spherical sensor
     */
    const addSphericalSensor = () => {
      // add an Air coverage sensor
      viewer.entities.add({
        name: `${radarName} - Air Coverage`,
        position: cesium.Cartesian3.fromRadians(
          radarLon,
          radarLat,
          radarAlt
        ),
        ellipsoid: {
          radii: new cesium.Cartesian3(airRange, airRange, airRange),
          material: airCoverageColor,
          outline: true,
          outlineColor: new cesium.Color(0.0, 1.0, 1.0, 1.0)
        }
      });

      // add a RAM coverage sensor
      viewer.entities.add({
        name: `${radarName} - RAM Coverage`,
        position: cesium.Cartesian3.fromRadians(
          radarLon,
          radarLat,
          radarAlt
        ),
        ellipsoid: {
          radii: new cesium.Cartesian3(ramRange, ramRange, ramRange),
          material: ramCoverageColor,
          outline: true,
          outlineColor: new cesium.Color(1.0, 0.54, 0.0, 1.0)
        }
      });
    };

    const addCustomSensor = () => {
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

    // check if the sensor is approximately a dome sensor
    if (cesium.Math.toDegrees(halfAngleX) > 43 &&
        cesium.Math.toDegrees(halfAngleY) > 170) {
      addSphericalSensor();
    } else
    if (cesium.Math.toDegrees(halfAngleY) < 46) {
      addRectangularSensor();
    } else {
      addRectangularSensorArray();
    }
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
