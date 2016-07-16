import React, { PropTypes } from 'react';
// require('cesium/Build/Cesium/Widgets/widgets.css');
// var BuildModuleUrl = require('cesium/Source/Core/buildModuleUrl');
/* eslint-disable no-unused-vars */
import widgets from 'cesium/Build/Cesium/Widgets/widgets.css';
import BuildModuleUrl from 'cesium/Source/Core/buildModuleUrl';
import Viewer from 'cesium/Source/Widgets/Viewer/Viewer';
import BingMapsApi from 'cesium/Source/Core/BingMapsApi';
import Cartesian3 from 'cesium/Source/Core/Cartesian3';
import Cesium from 'cesium/Source/Cesium';
import Color from 'cesium/Source/Core/Color';

class CesiumPlot extends React.Component {

  // data should be an array of track and truth data
  // filtered by a track id
  static propTypes = {
    data: PropTypes.object,
    radarData: PropTypes.object,
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
    console.debug('component mounted');
    BuildModuleUrl.setBaseUrl('../');
    BingMapsApi.defaultKey = 'AhguTre8xUgKVVHSEr1OhOLMeDm-kEUc5-4Jq6VZSHUHEBAal9P_YRs5gNW3BjeV';
    this.viewer = new Viewer('cesiumContainer');
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

  /**
   * React lifecycle method. In this plot component react only needs to create an empty
   * div. In the `componentDidMount` method the div reference is assigned to a
   * member variable
   * @return {[jsx]} The JSX for React to render
   * @see https://facebook.github.io/react/docs/component-specs.html
   */
  render () {
    console.debug('rendering');
    return (
      <div id={'cesiumContainer'} />
    );
  }
}

export default CesiumPlot;
