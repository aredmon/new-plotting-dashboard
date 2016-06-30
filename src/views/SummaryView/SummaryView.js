import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import SummaryWidget from 'components/SummaryWidget';
import getMetrics from './SummaryMetrics';
import { bindActionCreators } from 'redux';
import { addMetrics } from 'redux/modules/track-ids';

export class SummaryView extends Component {
  constructor (props) {
    super();
    this.metrics = getMetrics(props.data);
    this.saveMetrics = this.saveMetrics.bind(this);
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
    const { trackIds, airThreats, ramThreats } = this.metrics;
    const labels = ['Air Threats', 'RAM Threats'];
    const values = [airThreats.size, ramThreats.size];
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
