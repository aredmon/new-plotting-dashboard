import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import Plotly from 'plotly.js';

class ThreatChart extends React.Component {

  constructor () {
    super();
    this.state={};
  }

  static propTypes = {
    values: PropTypes.object,
    labels: PropTypes.array,
    title: PropTypes.string,
    chartTitle: PropTypes.string
  }

  componentDidMount () {
    const plotDiv = ReactDOM.findDOMNode(this);
    this.setState({
      plotDiv
    });
    Plotly.newPlot(plotDiv, this.createPlotData(), this.createLayout());
  }

  createPlotData () {
    const { values } = this.props;
    console.debug(values.toJS());
    const data = values.groupBy(val => val.get('objType'))
      .reduce((group, val, key) => {
        console.debug(key);
        group[key] = val.size;
        return group;
      }, {});
    console.debug(data);
    return [{
      values: Object.values(data),
      labels: Object.keys(data),
      textinfo: 'label+value',
      annotations: {
        xanchor: 'center',
        color: '#ffff'
      },
      hoverinfo: 'label+value',
      hole: 0.3,
      type: 'pie',
      name: 'All Threats'
    }];
  }

  createLayout () {
    const { chartTitle } = this.props;
    return {
      title: chartTitle,
      height: 400,
      width: 400,
      margin: {
        t: 50,
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
