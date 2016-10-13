import React, { PropTypes } from 'react';
import Dropzone from 'react-dropzone';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { addData } from '../../redux/modules/log-data';
import FileSliceReader from './FileSliceReader';
import _ from 'lodash';
import loadingGif from './ajax-loader.gif';
import Baby from 'babyparse';
import Dimensions from 'react-dimensions';
// plots
import GenericPlot from 'components/plots/GenericPlot';
// material ui
import Dialog from 'material-ui/lib/dialog';
import Colors from 'material-ui/lib/styles/colors';
import FlatButton from 'material-ui/lib/flat-button';
import Checkbox from 'material-ui/lib/checkbox';
import SelectField from 'material-ui/lib/SelectField';
import MenuItem from 'material-ui/lib/menus/menu-item';
import LinearProgress from 'material-ui/lib/linear-progress';
import CircularProgress from 'material-ui/lib/circular-progress';
import TextField from 'material-ui/lib/text-field';

export class HomeView extends React.Component {

  constructor () {
    super();
    this.simData = [];
    this.onDrop = this.onDrop.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleSubmit= this.handleSubmit.bind(this);
    this.handleSelectTime = this.handleSelectTime.bind(this);
    this.handleRadarCheckbox= this.handleRadarCheckbox.bind(this);
    this.handleTimeIncrementChange= this.handleTimeIncrementChange.bind(this);
    this.loadSimData = this.loadSimData.bind(this);
    this.loadMaxTime = this.loadMaxTime.bind(this);
    this.loadRadars = this.loadRadars.bind(this);
    this.uploadComplete = this.uploadComplete.bind(this);
    this.state = {
      uploadProgress: 0,
      radarSelectionDialog: true,
      dialogOpen: false,
      dialogLoading: false,
      dialogParsingCSV: false,
      simRadars: null,
      simTimes: {
        min: 0,
        max: 0
      },
      filteredRadars: [],
      fileName: null,
      delimitedData: null,
      scenarioTimeIncrement: 200
    };
  }

  static propTypes = {
    addData: PropTypes.func,
    containerHeight: PropTypes.number,
    containerWidth: PropTypes.number
  }

  static contextTypes = {
    router: React.PropTypes.object
  };

  componentDidMount () {
    window.dispatchEvent(new Event('resize'));
  }

  /**
   * Receives the dropped file(s) from the drop zone.
   * @param  {[file]} files The file uploaded by the user
   */
  onDrop (files) {
    const file = files[0];
    this.file = {
      fileRef: file,
      chunkSize: 1024 * 1000 * 0.5,
      name: file.name
    };

    const extension = file.name.substr(file.name.lastIndexOf('.')+1);

    if (extension === 'txt') {
      console.debug('txt file detected');
      const fr = new FileReader();

      fr.onload = e => {
        const text = fr.result;
        const parsed = Baby.parse(text, { // eslint-disable-line
          delimiter: ' '
        });
        const rows = parsed.data;
        console.debug(`Parsed ${rows.length} rows`);
        console.debug(`Headers: ${rows[0]}`);
        this.setState({
          dialogParsingCSV: false,
          delimitedData: rows
        });
      };

      this.setState({
        dialogParsingCSV: true
      });

      fr.readAsText(file);
    } else {
      // show the selector dialog
      this.setState({
        dialogOpen: true,
        uploadProgress: 0,
        fileName: file.name
      });

      // Read the first chunk to get the radar data
      const firstSliceReader = new FileSliceReader(file, this.file.chunkSize, '\n');
      firstSliceReader.readFirstChunk(this.loadRadars);
    }
  }

  /**
   * Data loading progress handler
   * @param  {Object} data     The parsed data
   * @param  {Number} progress The progress of the file reading
   */
  loadSimData (data, progress, finished) {
    const { filteredRadars, selectTime, scenarioTimeIncrement } = this.state;
    const tMin = selectTime;
    const tMax = tMin+scenarioTimeIncrement;
    // process data
    _(data).forEach((row) => {
      // check if the time is within the filtered time range
      const tValid = _.get(row, 't_valid') >= tMin && _.get(row, 't_valid') <= tMax;
      const type = _.get(row, 'type');
      // Get radar init objects for the selected radars
      if (type === 'radarInit' && filteredRadars.indexOf(_.get(row, 'modelId')) >= 0) {
        this.simData.push(row);
      }

      // only perform radar filtering if radars are selected
      if (filteredRadars.length > 0) {
        // Get truth onjects for the first radar. no need to get truth for every radar
        if (tValid && type === 'truth' &&
            _.get(row, 'radar_id') === filteredRadars[0]) {
          this.simData.push(row);
        }
        // Get track objects for the selected radars
        if (tValid && type === 'track' &&
          filteredRadars.indexOf(_.get(row, 'radar_id')) >= 0) {
          this.simData.push(row);
        }
      } else {
        // add all truth and track data
        if (tValid && (type === 'truth' || type === 'track')) {
          this.simData.push(row);
        }
      }
    });

    // update the ui
    this.setState({
      uploadProgress: progress
    });

    // data is finished loading
    if (finished) {
      this.setState({
        dialogLoading: false
      });
      // send data to redux
      this.uploadComplete();
    }
  }

  uploadComplete () {
    const { addData } = this.props;
    const { router } = this.context;
    console.debug('Upload complete');
    console.debug(`Number of entries: ${this.simData.length}`);
    // add data to redux store
    addData(this.simData);
    // redirect to summary view
    if (router) {
      router.push('/summary');
    }
  }

  /**
   * This callback finds radarInit messages and the max time in a data set
   *
   * @param  {Object} data a well formed JSON array of objects
   */
  loadRadars (data) {
    let radars = [];

    _(data).forEach((row) => {
      if (_.get(row, 'type') === 'radarInit') {
        radars.push(row);
      }
    });

    this.setState({
      simRadars: radars
    });

    // read the last chunk to find the max time of the sim
    const lastSliceReader = new FileSliceReader(this.file.fileRef, this.file.chunkSize, '\n');
    lastSliceReader.readLastChunk(this.loadMaxTime);
  }

  /**
   * This callback finds radarInit messages and the max time in a data set
   *
   * @param  {Object} data a well formed JSON array of objects
   */
  loadMaxTime (data) {
    let tMax = 0;

    _.map(data, (row) => {
      tMax = _.get(row, 't_valid') > tMax ? _.get(row, 't_valid') : tMax;
    });

    this.setState({
      simTimes: {
        min: 0,
        max: tMax
      },
      selectTime: 0
    });
  }

  /**
   * Dialog submit handler
   */
  handleSubmit () {
    this.setState({
      dialogOpen: false,
      dialogLoading: true
    });

    // Read the first chunk to get the radar data
    const fileReader = new FileSliceReader(this.file.fileRef, this.file.chunkSize, '\n');
    fileReader.readFile(this.loadSimData);
  }

  /**
   * Dialog close handler
   */
  handleClose () {
    this.setState({
      dialogOpen: false,
      dialogLoading: false,
      dialogParsingCSV: false
    });
  }

  /**
   * [handleSelectTime description]
   * @param  {[type]} event [description]
   * @param  {[type]} index [description]
   * @param  {[type]} value [description]
   */
  handleSelectTime (event, index, value) {
    const { scenarioTimeIncrement } = this.state;
    console.debug(`${value} - ${value+scenarioTimeIncrement}`);
    this.setState({
      selectTime: value
    });
  }

  /**
   * Check event listener for the radar checkbox. IF the radar is checked
   * the radar id is added to the list of radar ids for data filtering. If
   * the radar is unchecked it is removed from the list
   * @param  {Object} event   the checkbox event
   * @param  {Boolean} checked whether the checkbox is checked or not
   */
  handleRadarCheckbox (event, checked) {
    const { filteredRadars } = this.state;
    const radarId = parseInt(event.target.value);
    console.debug(radarId);
    const radarPosition = filteredRadars.indexOf(radarId);
    if (checked) {
      if (radarPosition === -1) {
        filteredRadars.push(radarId);
      }
    } else {
      filteredRadars.splice(radarPosition, 1);
    }
    this.setState({
      filteredRadars: filteredRadars
    });
  }
  /**
   * Check event listener for the time interval. If the value is greater than 0,
   * to avoid infinite time segments, update the value of scenarioTimeIncrement.
   * @param  {Object} event   the TextField event
   */
  handleTimeIncrementChange (event) {
    console.debug(event.target.value);
    if (event.target.value >= 1) {
      this.setState({
        scenarioTimeIncrement: Number(event.target.value)
      });
    }
  }
  /**
   * Creates the drop zone element
   */
  render () {
    const { dialogOpen,
      fileName,
      simRadars,
      simTimes,
      selectTime,
      dialogLoading,
      uploadProgress,
      delimitedData,
      dialogParsingCSV,
      scenarioTimeIncrement
       } = this.state;

    const { containerWidth, containerHeight } = this.props;

    /**
     * The styles for the drop zone
     * @type {Object}
     */
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
        minWidth: '250px'
      }
    };

    /**
     * Actions for the dialog to select sim settings
     * @type {Array}
     */
    const actions = [
      <FlatButton
        label='Cancel'
        secondary
        onTouchTap={this.handleClose}
      />,
      <FlatButton
        label='Submit'
        primary
        onTouchTap={this.handleSubmit}
      />
    ];
    const times = [];
    for (let i = 0; i < simTimes.max; i+=scenarioTimeIncrement) {
      times.push(<MenuItem value={i} key={i} primaryText={`${i} - ${i+scenarioTimeIncrement}`}/>);
    }

    const syncingActions = [
      <FlatButton
        label='Cancel'
        style={{color: Colors.grey500, fontWeight: 'bold'}}
        onTouchTap={this.handleClose}
      />
    ];

    const view = !delimitedData
    ? <Dropzone onDrop={this.onDrop} style={styles.dropzoneStyle}>
      <div id={'dropContent'} style={{ textAlign: 'center' }}>
        <h3>Drag and drop log file here</h3>
        <h5>Or click to browse for log file</h5>
      </div>
    </Dropzone>
    : <div style={styles.plotDiv}><GenericPlot
      data={delimitedData}
      width={containerWidth}
      height={containerHeight}
      title={this.file.name}/></div>;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 88px)'
        }}
      >
        {view}
        <Dialog
          title={`File Name: ${fileName}`}
          actions={actions}
          modal
          open={dialogOpen}
        >
          <div style={styles.loadingStyle}>
            <div style={styles.block}>
              <h3>Radars</h3>
                {_.map(simRadars, (row) => {
                  const { modelId, radarName } = row;
                  const label = `Radar ${modelId}: ${radarName}`;
                  return <Checkbox
                    label={label}
                    style={styles.checkbox}
                    key={modelId}
                    value={`${modelId}`}
                    name={radarName}
                    onCheck={this.handleRadarCheckbox}/>;
                })}
            </div>
            <div style={styles.block}>
              <SelectField
                maxHeight={300}
                value={selectTime}
                onBlur={this.handleSelectTime}
                floatingLabelText='Select time range'
              >
                {times}
              </SelectField>
              <TextField
                value={scenarioTimeIncrement}
                onChange={this.handleTimeIncrementChange}
                type='number'
                floatingLabelText='Select time increment'
            />
            </div>
          </div>
        </Dialog>

        <Dialog
          title={'Loading File'}
          actions={syncingActions}
          modal={false}
          contentStyle={{maxWidth: '1200px'}}
          open={dialogParsingCSV}
          onRequestClose={this.handleClose}
        >
          <div style={{textAlign: 'center'}}>
            <CircularProgress size={2} />
          </div>
        </Dialog>

        <Dialog
          title={'Loading Data'}
          modal={false}
          open={dialogLoading}
          onRequestClose={this.handleClose}
        >
          <div style={{textAlign: 'center'}}>
            <div style={{float: 'right', marginTop: '-30px'}}>
              <img src={loadingGif} />
            </div>
            <h2>{uploadProgress} %</h2>
            <LinearProgress mode='determinate' color='#00BCD4' value={uploadProgress} />
          </div>
        </Dialog>
      </div>
    );
  }

}

const mapStateToProps = (state) => ({
  data: state.data
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addData
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Dimensions()(HomeView));
