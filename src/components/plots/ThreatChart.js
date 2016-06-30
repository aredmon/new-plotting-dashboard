import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import Plotly from 'plotly.js';

class ThreatChart extends React.Component {

  constructor () {
    super();
    this.state={};
  }

  // data should be an array of track and truth data
  // filtered by a track id
  static propTypes = {
    data: PropTypes.object,
    values: PropTypes.array,
    labels: PropTypes.array,
    title: PropTypes.string
  }

  componentDidMount () {
    const plotDiv = ReactDOM.findDOMNode(this);
    this.setState({
      plotDiv
    });
    Plotly.newPlot(plotDiv, this.createPlotData(this.props.data), this.createLayout());
  }

  createPlotData (data) {
    const { values, labels } = this.props;
    return [{
      values,
      labels,
      textinfo: 'label+value',
      annotations: {
        xanchor: 'center',
        color: '#ffff'
      },
      hoverinfo: 'label+value',
      hole: 0.6,
      type: 'pie',
      name: 'All Threats'
    }];
  }

  createLayout () {
    const { title } = this.props;
    return {
      title,
      height: 350,
      width: 350,
      margin: {
        t: 0,
        b: 0,
        l: 20,
        r: 5
      },
      hoverinfo: 'label+name'
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

export default ThreatChart;
