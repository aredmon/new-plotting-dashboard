import React, { PropTypes, Component } from 'react';
import Card from 'material-ui/lib/card/card';
import CardHeader from 'material-ui/lib/card/card-header';
import CardMedia from 'material-ui/lib/card/card-media';
import ThreatChart from 'components/plots/ThreatChart';

class SummaryWidget extends Component {

  static propTypes = {
    title: PropTypes.string,
    subtitle: PropTypes.string,
    chartTitle: PropTypes.string,
    values: PropTypes.object,
    labels: PropTypes.array
  }

  render () {
    const { title, subtitle, values, labels, chartTitle } = this.props;
    return (
      <div style={{marginRight: '15px'}} >
        <Card>
          <CardHeader
            title={title}
            subtitle={subtitle}
          />
          <CardMedia style={{marginTop: '15px'}}>
            <ThreatChart
              chartTitle={chartTitle}
              values={values}
              labels={labels}
              />
          </CardMedia>
        </Card>
      </div>
    );
  }
}

export default SummaryWidget;
