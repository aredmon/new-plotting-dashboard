import React, { PropTypes, Component } from 'react';
import Card from 'material-ui/lib/card/card';
import CardHeader from 'material-ui/lib/card/card-header';
import CardMedia from 'material-ui/lib/card/card-media';
import ThreatChart from 'components/plots/ThreatChart';

class SummaryWidget extends Component {

  static propTypes = {
    title: PropTypes.string,
    values: PropTypes.array,
    labels: PropTypes.array
  }

  render () {
    const { title, values, labels } = this.props;
    return (
      <Card>
        <CardHeader
          title='Threat Summary'
          subtitle={title}
        />
        <CardMedia>
          <ThreatChart
            values={values}
            labels={labels}
            />
        </CardMedia>
      </Card>
    );
  }
}

export default SummaryWidget;
