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
  }

  static propTypes = {
    data: PropTypes.object,
    addMetrics: PropTypes.func
  }

  componentWillMount () {
    this.saveMetrics();
  }

  saveMetrics = () => {
    const { addMetrics } = this.props;
    addMetrics(this.metrics);
  }

  render () {
    const { airThreats, ramThreats, tracks } = this.metrics;
    console.debug(tracks.toJS());
    const labels = ['Air Threats', 'RAM Threats'];
    return (
      <div style={{
        display: 'flex',
        flex: '1'
      }}>
        <SummaryWidget
          title={'Threat Summary'}
          subtitle={`${ramThreats.size} RAM Threats, ${airThreats.size} ABT Threats`}
          chartTitle={'Track Classification'}
          values={tracks}
          labels={labels}
          style={{
            display: 'flex',
            marginRight: '15px'
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
