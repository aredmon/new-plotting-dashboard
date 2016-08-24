import React, { PropTypes } from 'react';
/* eslint-disable no-unused-vars, no-undef */
// The two cesium imports are imported only to include the scripts. The
// varables are not used
import widgets from 'cesium/Build/Cesium/Widgets/widgets.css';
import c from 'cesium/Build/CesiumUnminified/Cesium.js';
import CesiumSensorsVolumes from 'cesium-sensor-volumes/dist/cesium-sensor-volumes';

class CesiumPlot extends React.Component {

  constructor () {
    super();
    this.drawShapes = this.drawShapes.bind(this);
    this.drawThreats = this.drawThreats.bind(this);
    this.toggleRamTracks = this.toggleRamTracks.bind(this);
    this.toggleRamTruths = this.toggleRamTruths.bind(this);
    this.toggleAirTracks = this.toggleAirTracks.bind(this);
    this.toggleAirTruths = this.toggleAirTruths.bind(this);
    this.toggleAirSensors = this.toggleAirSensors.bind(this);
    this.toggleRamSensors = this.toggleRamSensors.bind(this);
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
    const Viewer = new Cesium.Viewer('cesiumContainer', { infoBox: false });
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
    this.toggleAirSensors();
  }

  clearScene () {
    const { viewer } = this;
    viewer.scene.primitives.removeAll();
    viewer.entities.removeAll();
  }

  drawShapes () {
    const { cesium, viewer } = this;
    this.airSensor = new cesium.PrimitiveCollection();
    this.ramSensor = new cesium.PrimitiveCollection();
    this.sphericalAirSensors = viewer.entities.add(new cesium.Entity({id: 'sphericalAirSensors'}));
    this.sphericalRamSensors = viewer.entities.add(new cesium.Entity({id: 'sphericalRamSensors'}));
    const { radarData } = this.props;
    for (let rdr of this.props.radarData) {
      let { maxEl,
        minEl,
        offsetEl,
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
      } = rdr.toJS();
      const airRange = radarRange;
      const ramRange = 13000;
      const airCoverageColor = new cesium.Color(0.0, 1.0, 1.0, 0.3);
      const ramCoverageColor = new cesium.Color(1.0, 0.54, 0.0, 0.3);
      const halfAngleX = Math.abs((maxEl-minEl))/2;
      const halfAngleY = halfSector;

      var ellipsoid = viewer.scene.globe.ellipsoid;
      var clock = cesium.Math.toRadians(0.0);
      var cone = -(boreAzimuth - cesium.Math.toRadians(90));
      var twist = -halfAngleX-offsetEl;
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
        const rectangularAirSensor = new CesiumSensorVolumes.RectangularPyramidSensorVolume(
          getSensorOptions(getModelMatrix(cone), airRange, halfAngleY, airCoverageColor));
        console.debug('adding rectangular air sensor');
        this.airSensor.add(rectangularAirSensor);

        const rectangularRamSensor = new CesiumSensorVolumes.RectangularPyramidSensorVolume(
          getSensorOptions(getModelMatrix(cone), ramRange, halfAngleY, ramCoverageColor));
        console.debug('adding rectangular ram sensor');
        this.ramSensor.add(rectangularRamSensor);
      };

      /**
       * Create an array of rectangular sensors
       */
      const addRectangularSensorArray =() => {
        const sectorIncrements = cesium.Math.toRadians(60);
        const startingAngle = cone;
        let count = 0;
        const airSensorArray = new cesium.PrimitiveCollection();
        const ramSensorArray = new cesium.PrimitiveCollection();
        for (var i = startingAngle; i < halfSector*2+startingAngle; i+=sectorIncrements) {
          const airSensor = new CesiumSensorVolumes.RectangularPyramidSensorVolume(
            getSensorOptions(getModelMatrix(i), airRange, sectorIncrements, airCoverageColor));
          const ramSensor = new CesiumSensorVolumes.RectangularPyramidSensorVolume(
            getSensorOptions(getModelMatrix(i), ramRange, sectorIncrements, ramCoverageColor));
          this.airSensor.add(airSensor);
          this.ramSensor.add(ramSensor);
        }
      };

      /**
       * Create a spherical sensor
       */
      const addSphericalSensor = () => {
        // add an Air coverage sensor
        const sphericalAirSensor = new cesium.Entity({
          name: `${radarName} - Air Coverage`,
          parent: this.sphericalAirSensors,
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

        const sphericalRamSensor = new cesium.Entity({
          name: `${radarName} - RAM Coverage`,
          parent: this.sphericalRamSensors,
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
        viewer.entities.add(sphericalAirSensor);
        viewer.entities.add(sphericalRamSensor);
      };

      const addLabels = () => {
        var labels = viewer.scene.primitives.add(new Cesium.LabelCollection());
        labels.add({
          position: cesium.Cartesian3.fromRadians(
          radarLon,
          radarLat
          ),
          text: `${radarName}`
        });
      };

      // check if the sensor is approximately a dome sensor
      if (cesium.Math.toDegrees(halfAngleX) > 43 &&
          cesium.Math.toDegrees(halfAngleY) > 170) {
        console.debug('drawing dome sensor');
        addSphericalSensor();
      } else
      if (cesium.Math.toDegrees(halfAngleY) < 46) {
        console.debug('drawing rectangular sensor');
        addRectangularSensor();
      } else {
        console.debug('drawing rectangular sensor array');
        addRectangularSensorArray();
      }
    }
    viewer.scene.primitives.add(this.ramSensor);
    viewer.scene.primitives.add(this.airSensor);
    return;
  }

  drawThreats () {
    console.debug('drawing threats');
    const { data } = this.props;
    const { cesium, viewer } = this;
    let ramTruthMap = {};
    let ramTrackMap = {};
    let ramTerrainMap = {};
    let airTruthMap = {};
    let airTrackMap = {};
    let airTerrainMap = {};
    // time this task
    const begin = Date.now();
    let count = 0;
    data.forEach(row => {
      let key = row.get('id') || row.get('truthId');
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

      // create array of ram truths
      if (row.get('type') === 'truth' && row.get('objType') === 'BALLISTIC') {
        if (!ramTruthMap[key]) {
          ramTruthMap[key] = [];
        }
        ramTruthMap[key].push(coordinate);
      }

      // create array of ram tracks
      if (row.get('type') === 'track' && row.get('objType') === 'BALLISTIC') {
        if (!ramTrackMap[key]) {
          ramTrackMap[key] = [];
        }
        ramTrackMap[key].push(coordinate);
      }

      // create array of ram tracks
      if (row.get('type') === 'terrain' && row.get('objType') === 'BALLISTIC') {
        key = row.get('truthId');
        if (!ramTerrainMap[key]) {
          ramTerrainMap[key] = [];
        }
        ramTerrainMap[key].push(coordinate);
      }
      // create array of air truths
      if (row.get('type') === 'truth' &&
          (row.get('objType') === 'AIRBREATHER' || row.get('objectType') === 'AIRBREATHER')) {
        if (!airTruthMap[key]) {
          airTruthMap[key] = [];
        }
        airTruthMap[key].push(coordinate);
      }

      // create array of air tracks
      if (row.get('type') === 'track' &&
          (row.get('objType') === 'AIRBREATHER' || row.get('objectType') === 'AIRBREATHER')) {
        if (!airTrackMap[key]) {
          airTrackMap[key] = [];
        }
        airTrackMap[key].push(coordinate);
      }

      // create array of air tracks
      if (row.get('type') === 'terrain' &&
          (row.get('objType') === 'AIRBREATHER' || row.get('objectType') === 'AIRBREATHER')) {
        key = row.get('truthId');
        if (!airTerrainMap[key]) {
          airTerrainMap[key] = [];
        }
        airTerrainMap[key].push(coordinate);
      }

      count++;
    });
    const dataProcess = Date.now();
    let seconds = (dataProcess - begin) / 1000;
    console.debug(`Processed ${count} rows in ${seconds} seconds.`);

    // Ram Tracks
    const ramTracks = viewer.entities.add(new cesium.Entity({id: 'ramTracks'}));
    for (var ramTrackId in ramTrackMap) {
      viewer.entities.add(
        {
          name: `Track ${ramTrackId}`,
          parent: ramTracks,
          polyline: {
            positions: ramTrackMap[ramTrackId],
            width: 2,
            material: cesium.Color.GREEN
          }
        }
      );
    }

    // Ram Truths
    const ramTruths = viewer.entities.add(new cesium.Entity({id: 'ramTruths'}));
    for (var ramTruthId in ramTruthMap) {
      viewer.entities.add(
        {
          name: `Truth ${ramTruthId}`,
          parent: ramTruths,
          polyline: {
            positions: ramTruthMap[ramTruthId],
            width: 2,
            material: cesium.Color.BLUE
          }
        }
      );
    }

    // Air Tracks
    const airTracks = viewer.entities.add(new cesium.Entity({id: 'airTracks'}));
    for (var airTrackId in airTrackMap) {
      viewer.entities.add(
        {
          name: `Track ${airTrackId}`,
          parent: airTracks,
          polyline: {
            positions: airTrackMap[airTrackId],
            width: 2,
            material: cesium.Color.GREEN
          }
        }
      );
    }

    // Air Truths
    const airTruths = viewer.entities.add(new cesium.Entity({id: 'airTruths'}));
    for (var airTruthId in airTruthMap) {
      viewer.entities.add(
        {
          name: `Truth ${airTruthId}`,
          parent: airTruths,
          polyline: {
            positions: airTruthMap[airTruthId],
            width: 2,
            material: cesium.Color.BLUE
          }
        }
      );
    }

    // Ram Terrain
    const ramTerrain = viewer.entities.add(new cesium.Entity({id: 'ramTerrain'}));
    for (var ramTerrainId in ramTerrainMap) {
      viewer.entities.add(
        {
          name: `Ram Terrain ${ramTrackId}`,
          parent: ramTerrain,
          polyline: {
            positions: ramTerrainMap[ramTerrainId],
            width: 2,
            material: cesium.Color.RED
          }
        }
      );
    }

    // Air Terrain
    const airTerrain = viewer.entities.add(new cesium.Entity({id: 'airTerrain'}));
    for (var airTerrainId in airTerrainMap) {
      viewer.entities.add(
        {
          name: `Air Terrain ${airTerrainId}`,
          parent: airTerrain,
          polyline: {
            positions: airTerrainMap[airTerrainId],
            width: 2,
            material: cesium.Color.RED
          }
        }
      );
    }

    const dataRender = Date.now();
    seconds = (dataRender - dataProcess) / 1000;
    console.debug(`Rendered data in ${seconds} seconds.`);
  }

  /**
   * Click handler to toggle ram tracks
   */
  toggleRamTracks () {
    const { entities } = this.viewer;
    const tracks = entities.getById('ramTracks');
    if (tracks) {
      tracks.show = !tracks.show;
    } else {
      console.debug('cannot find tracks entity');
    }
  }

  /**
   * Click handler to toggle ram truths
   */
  toggleRamTruths () {
    const { entities } = this.viewer;
    const tracks = entities.getById('ramTruths');
    if (tracks) {
      tracks.show = !tracks.show;
    } else {
      console.debug('cannot find tracks entity');
    }
  }

  /**
   * Click handler to toggle air tracks
   */
  toggleAirTracks () {
    const { entities } = this.viewer;
    const tracks = entities.getById('airTracks');
    if (tracks) {
      tracks.show = !tracks.show;
    } else {
      console.debug('cannot find tracks entity');
    }
  }

  /**
   * Click handler to toggle air truths
   */
  toggleAirTruths () {
    const { entities } = this.viewer;
    const tracks = entities.getById('airTruths');
    if (tracks) {
      tracks.show = !tracks.show;
    } else {
      console.debug('cannot find tracks entity');
    }
  }

  /**
   * Click handler to toggle ram terrain
   */
  toggleRamTerrain () {
    const { entities } = this.viewer;
    const tracks = entities.getById('ramTerrain');
    if (tracks) {
      tracks.show = !tracks.show;
    } else {
      console.debug('cannot find tracks entity');
    }
  }

  /**
   * Click handler to toggle ram terrain
   */
  toggleAirTerrain () {
    const { entities } = this.viewer;
    const tracks = entities.getById('airTerrain');
    if (tracks) {
      tracks.show = !tracks.show;
    } else {
      console.debug('cannot find tracks entity');
    }
  }

  /**
   * Click handler to toggle air sensors
   */
  toggleAirSensors () {
    this.airSensor.show = !this.airSensor.show;
    this.sphericalAirSensors.show = !this.sphericalAirSensors.show;
  }

  /**
   * Click handler to toggle air sensors
   */
  toggleRamSensors () {
    this.ramSensor.show = !this.ramSensor.show;
    this.sphericalRamSensors.show = !this.sphericalRamSensors.show;
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

    const styles = {
      parent: {
        position: 'relative',
        height: '100%',
        width: '100%'
      },
      cesiumContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: '100%',
        margin: 0,
        overflow: 'hidden',
        padding: 0,
        fontFamily: 'sans-serif'
      },
      toolbar: {
        margin: '5px',
        padding: '2px 5px',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: '100'
      }
    };

    return (
      <div style={styles.parent}>
        <div id={'cesiumContainer'} style={styles.cesiumContainer}>
          <div id={'toolbar'} style={styles.toolbar}>
            <button
              className={'cesium-button'}
              onClick={this.toggleRamTracks}>
                RAM Tracks
            </button>
            <button
              className={'cesium-button'}
              onClick={this.toggleRamTruths}>
                RAM Truths
            </button>
            <button
              className={'cesium-button'}
              onClick={this.toggleRamSensors}>
                RAM Sensors
            </button>
            <button
              className={'cesium-button'}
              onClick={this.toggleAirTracks}>
                Air Tracks
            </button>
            <button
              className={'cesium-button'}
              onClick={this.toggleAirTruths}>
                Air Truths
            </button>
            <button
              className={'cesium-button'}
              onClick={this.toggleAirSensors}>
                Air Sensors
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default CesiumPlot;
