import React, { PropTypes } from 'react';
import Dropzone from 'react-dropzone';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { addData } from '../../redux/modules/log-data';
import FileSliceReader from './FileSliceReader';
import _ from 'lodash';
import loadingGif from './ajax-loader.gif';
// material ui
import Dialog from 'material-ui/lib/dialog';
import FlatButton from 'material-ui/lib/flat-button';
import Checkbox from 'material-ui/lib/checkbox';
import SelectField from 'material-ui/lib/SelectField';
import MenuItem from 'material-ui/lib/menus/menu-item';
import LinearProgress from 'material-ui/lib/linear-progress';

export class HomeView extends React.Component {

  constructor () {
    super();
    this.simData = [];
    this.scenarioTimeIncrement = 6000;
    this.onDrop = this.onDrop.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleSubmit= this.handleSubmit.bind(this);
    this.handleSelectTime = this.handleSelectTime.bind(this);
    this.handleRadarCheckbox= this.handleRadarCheckbox.bind(this);
    this.loadSimData = this.loadSimData.bind(this);
    this.loadMaxTime = this.loadMaxTime.bind(this);
    this.loadRadars = this.loadRadars.bind(this);
    this.uploadComplete = this.uploadComplete.bind(this);
    this.state = {
      uploadProgress: 0,
      dialogOpen: false,
      dialogLoading: false,
      simRadars: null,
      simTimes: {
        min: 0,
        max: 0
      },
      filteredRadars: [],
      fileName: null
    };
  }

  static propTypes = {
    addData: PropTypes.func
  }

  static contextTypes = {
    router: React.PropTypes.object
  };
  /**
   * Receives the dropped file(s) from the drop zone.
   * @param  {[file]} files The file uploaded by the user
   */
  onDrop (files) {
    const file = files[0];
    this.file = {
      fileRef: file,
      chunkSize: 1024 * 1000 * 5
    };

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

  /**
   * Data loading progress handler
   * @param  {Object} data     The parsed data
   * @param  {Number} progress The progress of the file reading
   */
  loadSimData (data, progress, finished) {
    const { filteredRadars, selectTime } = this.state;
    const tMin = selectTime;
    const tMax = tMin+this.scenarioTimeIncrement;
    // process data
    _(data).forEach((row) => {
      // check if the time is within the filtered time range
      const tValid = _.get(row, 't_valid') >= tMin && _.get(row, 't_valid') <= tMax;
      const type = _.get(row, 'type');
      // Get radar init objects for the selected radars
      if (type === 'radarInit' && filteredRadars.indexOf(_.get(row, 'modelId')) >= 0) {
        this.simData.push(row);
      }

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
      dialogLoading: false
    });
  }

  /**
   * [handleSelectTime description]
   * @param  {[type]} event [description]
   * @param  {[type]} index [description]
   * @param  {[type]} value [description]
   */
  handleSelectTime (event, index, value) {
    console.debug(`${value} - ${value+this.scenarioTimeIncrement}`);
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
   * Creates the drop zone element
   */
  render () {
    const { dialogOpen,
      fileName,
      simRadars,
      simTimes,
      selectTime,
      dialogLoading,
      uploadProgress } = this.state;

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
    for (let i = 0; i < simTimes.max; i+=this.scenarioTimeIncrement) {
      times.push(<MenuItem value={i} key={i} primaryText={`${i} - ${i+this.scenarioTimeIncrement}`}/>);
    }

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 88px)'
        }}
      >
        <Dropzone onDrop={this.onDrop} style={styles.dropzoneStyle}>
          <div id={'dropContent'} style={{ textAlign: 'center' }}>
            <h3>Drag and drop log file here</h3>
            <h5>Or click to browse for log file</h5>
          </div>
        </Dropzone>
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
                onChange={this.handleSelectTime}
                floatingLabelText='Select time range'
              >
                {times}
              </SelectField>
            </div>
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

export default connect(mapStateToProps, mapDispatchToProps)(HomeView);
