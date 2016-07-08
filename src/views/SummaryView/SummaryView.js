import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import SummaryWidget from 'components/SummaryWidget';
import getMetrics from './SummaryMetrics';
import { bindActionCreators } from 'redux';
import { addMetrics } from 'redux/modules/track-ids';

export class SummaryView extends Component {
  constructor (props) {
    console.debug('SummaryView Constructor 1\n');
    super();
    this.metrics = getMetrics(props.data);
    this.saveMetrics = this.saveMetrics.bind(this);
    console.debug('SummaryView Constructor 2\n');
  }

  static propTypes = {
    data: PropTypes.object,
    addMetrics: PropTypes.func
  }

  componentWillMount () {
    this.saveMetrics();
  }

  saveMetrics () {
    const { addMetrics } = this.props;
    addMetrics(this.metrics);
  }

  render () {
    console.debug('SummaryView Render 1\n');
    const { trackIds, airThreats, ramThreats } = this.metrics;
    const labels = ['Air Threats', 'RAM Threats'];
    const values = [airThreats.size, ramThreats.size];
    console.debug('SummaryView Render 2\n');
    return (
      <div style={{
        display: 'flex',
        flex: '1'
      }}>
        <SummaryWidget
          title={`${trackIds.size} Threats`}
          values={values}
          labels={labels}
          style={{
            display: 'flex'
          }}
        />
      </div>
    );
  };
}

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addMetrics
}, dispatch);

const mapStateToProps = (state) => ({
  data: state.data
});

export default connect(mapStateToProps, mapDispatchToProps)(SummaryView);
