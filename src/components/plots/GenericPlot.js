import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import Plotly from 'plotly.js';
import FlatButton from 'material-ui/lib/flat-button';
import ContentCreate from 'material-ui/lib/svg-icons/content/create';
import Dialog from 'material-ui/lib/dialog';
import MenuItem from 'material-ui/lib/menus/menu-item';
import SelectField from 'material-ui/lib/SelectField';
import CircularProgress from 'material-ui/lib/circular-progress';
import Colors from 'material-ui/lib/styles/colors';
// /* eslint-disable */
/**
 * This component is a generic X vs Y plot that compares
 * truth vs track.T
 */
class TruthVsTrack extends React.Component {

  constructor () {
    super();
    this.handleEditChart = this.handleEditChart.bind(this);
    this.handleUpdateChart = this.handleUpdateChart.bind(this);
    this.handleSelectSeries = this.handleSelectSeries.bind(this);
    this.handleSelectXAxis = this.handleSelectXAxis.bind(this);
    this.handleSelectYAxis = this.handleSelectYAxis.bind(this);
    this.state = {
      fieldY: 'RUV.V_Beam',
      fieldX: 'TimeActivity',
      series: 'Indentifier',
      showEditChart: false,
      renderingPlot: false
    };
  }

  // data should be an array of track and truth data
  static propTypes = {
    data: PropTypes.array.isRequired,
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
    this.plotDiv = ReactDOM.findDOMNode(this.plotRef);
    console.debug(this.plotRef);
    this.makePlot();
  }

  /**
   * This method reloads the plot if the date is updated while the component is still
   * mounted
   * @param  {[Object]} nextProps the props passed into the react component
   * @see https://facebook.github.io/react/docs/component-specs.html
   */
  // componentWillUpdate (nextProps) {
  //   this.props = nextProps;
  //   this.makePlot();
  // }

  /**
   * This method calls the plotly library to create the plot
   */
  makePlot () {
    const begin = Date.now();
    Plotly.newPlot(this.plotDiv, this.createPlotData(this.props.data), this.createLayout());
    const end = Date.now();
    const seconds = (end - begin) / 1000;
    console.debug(`Time to render: ${seconds}`);
    this.setState({
      renderingPlot: false
    });
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
    const { fieldX, fieldY, series } = this.state;
    const xVals = [];
    let yVals = [];
    let count = 0;

    // get the index of x, y, and series from the header row
    const xIndex = data[0].indexOf(fieldX);
    const yIndex = data[0].indexOf(fieldY);
    const seriesIndex = data[0].indexOf(series);

    // iterate through data and create series
    data.forEach((row) => {
      xVals.push(row[xIndex]);
      let seriesValue = row[seriesIndex];
      if (!yVals[seriesValue]) {
        yVals[seriesValue] = [];
      }
      yVals[seriesValue].push(row[yIndex]);
      count++;
    });
    const end = Date.now();
    const seconds = (end - begin) / 1000;
    console.debug(`Time to create data sets: ${seconds}. Rows processed: ${count}.`);

    const result = [];
    yVals.forEach((vals, index) => {
      result.push({
        type: 'scattergl',
        x: xVals,
        y: vals,
        mode: 'markers',
        name: `${series} ${index}`
      });
    });
    // `scattergl` plot type loads faster than the `scatter` plot type

    return result;
  }

  handleEditChart () {
    this.setState({
      showEditChart: !this.state.showEditChart
    });
  }

  handleUpdateChart () {
    this.setState({
      showEditChart: !this.state.showEditChart,
      renderingPlot: true
    });
    this.makePlot();
  }

  handleCloseRendering () {
    this.setState({
      renderingPlot: false
    });
  }

  /**
   * This method creates the layout object for Plotly
   * @return {[Object]} The layout object
   */
  createLayout () {
    const { fieldX, fieldY } = this.state;
    const { title, height, width } = this.props;

    return {
      title,
      width,
      height,
      xaxis: {
        title: fieldX.replace(/_/g, ' ')
      },
      yaxis: {
        title: fieldY.replace(/_/g, ' ')
      }
    };
  }

  handleSelectSeries (event, index, value) {
    const { data } = this.props;
    this.setState({
      series: data[0][value]
    });
  }

  handleSelectXAxis (event, index, value) {
    const { data } = this.props;
    this.setState({
      fieldX: data[0][value]
    });
  }

  handleSelectYAxis (event, index, value) {
    const { data } = this.props;
    this.setState({
      fieldY: data[0][value]
    });
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
    const { showEditChart,
      series,
      fieldX,
      fieldY,
      renderingPlot } = this.state;
    const { data } = this.props;
    const actions = [
      <FlatButton
        label='Cancel'
        secondary
        onTouchTap={this.handleEditChart}
      />,
      <FlatButton
        label='Ok'
        primary
        onTouchTap={this.handleUpdateChart}
      />
    ];

    const syncingActions = [
      <FlatButton
        label='Cancel'
        style={{color: Colors.grey500, fontWeight: 'bold'}}
        onTouchTap={this.handleCloseRendering}
      />
    ];

    const styles = {
      dropzoneStyle: {
        textAlign: 'center',
        margin: '0',
        padding: '200px 0',
        color: '#aaa',
        border: '2px dashed #aaa',
        borderRadius: '7px',
        cursor: 'pointer',
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      loadingStyle: {
        height: '100%',
        width: '100%',
        backgroundColor: '#fff',
        padding: '20px',
        display: 'flex',
        flexDirection: 'row'
      },
      plotDiv: {
        height: '100%',
        width: '100%',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'row'
      },
      checkbox: {
        marginBottom: '16px'
      },
      block: {
        maxWidth: '350px',
        minWidth: '250px',
        padding: '10px'
      },
      editButton: {
        marginBottom: '-50px',
        zIndex: 1000,
        float: 'right',
        marginTop: '20px'
      }
    };

    const fields = [];
    data[0].forEach((element, index) => {
      fields.push(<MenuItem
        value={index}
        key={index}
        primaryText={`${element}`}
        />);
    });

    return (
      <div>
        <FlatButton
          label={'Edit'}
          icon={<ContentCreate />}
          primary
          style={styles.editButton}
          onClick={this.handleEditChart}
        />
        <div ref={r => (this.plotRef = r)}/>

        <Dialog
          title={'Edit Chart'}
          actions={actions}
          modal={false}
          onRequestClose={this.handleEditChart}
          contentStyle={{maxWidth: '1200px'}}
          open={showEditChart}
        >
          <div style={styles.loadingStyle}>
            <div style={styles.block}>
              <h3>Series</h3>
              <SelectField
                maxHeight={300}
                value={data[0].indexOf(series)}
                onChange={this.handleSelectSeries}
                floatingLabelText='Select Series'
              >
                {fields}
              </SelectField>
            </div>
            <div style={styles.block}>
              <h3>X Axis</h3>
              <SelectField
                maxHeight={300}
                value={data[0].indexOf(fieldX)}
                onChange={this.handleSelectXAxis}
                floatingLabelText='Select X Axis'
              >
                {fields}
              </SelectField>
            </div>
            <div style={styles.block}>
              <h3>Y Axis</h3>
              <SelectField
                maxHeight={300}
                value={data[0].indexOf(fieldY)}
                onChange={this.handleSelectYAxis}
                floatingLabelText='Select Y Axis'
              >
                {fields}
              </SelectField>
            </div>
          </div>
        </Dialog>

        <Dialog
          title={'Rendering Plot'}
          actions={syncingActions}
          contentStyle={{maxWidth: '1200px'}}
          open={renderingPlot}
        >
          <div style={{textAlign: 'center'}}>
            <CircularProgress size={2} />
          </div>
        </Dialog>
      </div>
    );
  }
}

export default TruthVsTrack;
