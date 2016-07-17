import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import Plotly from 'plotly.js';
import Theme from '../../helpers/theme.js';

/**
 * This component is a generic X vs Y plot that compares
 * truth vs track.T
 */
class TruthVsTrack extends React.Component {

  // data should be an array of track and truth data
  static propTypes = {
    data: PropTypes.object.isRequired,
    title: PropTypes.string,
    width: PropTypes.number,
    fieldX: PropTypes.string.isRequired,
    fieldY: PropTypes.string.isRequired,
    altSeries1: PropTypes.string,
    height: PropTypes.number
  }

  /**
   * This method loads the initial plot the first time this component is mounted
   * It stores the reference to the DOM element that is created in the `render()`
   * method
   * @see https://facebook.github.io/react/docs/component-specs.html
   */
  componentDidMount () {
    this.plotDiv = ReactDOM.findDOMNode(this);
    this.makePlot();
  }

  /**
   * This method reloads the plot if the date is updated while the component is still
   * mounted
   * @param  {[Object]} nextProps the props passed into the react component
   * @see https://facebook.github.io/react/docs/component-specs.html
   */
  componentWillReceiveProps (nextProps) {
    this.props = nextProps;
    this.makePlot();
  }

  /**
   * This method calls the plotly library to create the plot
   */
  makePlot () {
    const begin = Date.now();
    Plotly.newPlot(this.plotDiv, this.createPlotData(this.props.data), this.createLayout());
    const end = Date.now();
    const seconds = (end - begin) / 1000;
    console.debug(`Time to render: ${seconds}`);
  }

  /**
   * This method takes data and converts it to the plot series for plotly
   *
   * @param  {[Object]} data The JSON data that will be plotted
   * @return {[Array]} An array of phe Plotly plot series
   * @see https://plot.ly/javascript/
   */
  createPlotData (data) {
    const begin = Date.now();
    const { fieldX, fieldY, altSeries1 } = this.props;
    let truthX = [];
    let truthY = [];
    let trackX = [];
    let trackY = [];
    let altSeries1X = [];
    let altSeries1Y = [];
    let count = 0;

    data.forEach((row) => {
      if (row.get('type') === 'truth') {
        truthX.push(row.get(fieldX));
        truthY.push(row.get(fieldY));
      }
      if (row.get('type') === 'track') {
        trackX.push(row.get(fieldX));
        trackY.push(row.get(fieldY));
      }
      if (altSeries1) {
        if (row.get('type') === altSeries1) {
          altSeries1X.push(row.get(fieldX));
          altSeries1Y.push(row.get(fieldY));
        }
      }
      count++;
    });
    const end = Date.now();
    const seconds = (end - begin) / 1000;
    console.debug(`Time to create data sets: ${seconds}. Rows processed: ${count}.`);

    // `scattergl` plot type loads faster than the `scatter` plot type
    let result = [{
      type: 'scattergl',
      x: truthX,
      y: truthY,
      mode: 'markers',
      marker: {
        color: Theme.palette.truth,
        size: 3,
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
        type: 'scattergl',
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
      }];

    if (altSeries1Y.length > 0) {
      result.push({
        type: 'scattergl',
        x: altSeries1X,
        y: altSeries1Y,
        mode: 'markers',
        marker: {
          color: '#ff0000',
          size: 10,
          opacity: 0.6,
          symbol: 'x',
          line: {
            opacity: 1.0,
            width: 1,
            color: '#ff0000'
          }
        },
        name: altSeries1
      });
    }

    return result;
  }

  /**
   * This method creates the layout object for Plotly
   * @return {[Object]} The layout object
   */
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

  /**
   * React method. In this plot component react only needs to create an empty
   * div. In the `componentDidMount` method the div reference is assigned to a
   * member variable
   * @return {[type]} [description]
   */
  render () {
    return (
      <div />
    );
  }
}

export default TruthVsTrack;
