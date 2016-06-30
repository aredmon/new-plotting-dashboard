import React from 'react';
import { debounce } from 'lodash';

const RESIZE_EVENT = 'resize';
const ORIENTATION_CHANGE_EVENT = 'orientationchange';

export default function withViewport (ComposedComponent) {
  return class Viewport extends React.Component {

    constructor () {
      super();
      const window = window || {
        innerWidth: 1366,
        innerHeight: 768
      };
      const {
        innerWidth: width,
        innerHeight: height
      } = window;
      this.state = {
        viewport: {
          width,
          height
        }
      };
      this.handleResize = debounce(this.handleResize.bind(this), 50);
    }

    componentDidMount () {
      this.handleResize();
      window.addEventListener(RESIZE_EVENT, this.handleResize);
      window.addEventListener(ORIENTATION_CHANGE_EVENT, this.handleResize);
    }

    componentWillUnmount () {
      window.removeEventListener(RESIZE_EVENT, this.handleResize);
      window.removeEventListener(ORIENTATION_CHANGE_EVENT, this.handleResize);
    }

    render () {
      return <ComposedComponent {...this.props} viewport={this.state.viewport}/>;
    }

    handleResize () {
      const {
        innerWidth: width,
        innerHeight: height
      } = window;
      this.setState({ viewport: { width, height } });
    }

  };
}
