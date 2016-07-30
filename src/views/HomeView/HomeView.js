import React, { PropTypes } from 'react';
import Dropzone from 'react-dropzone';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { addData } from '../../redux/modules/log-data';
import FileSliceReader from './FileSliceReader';
import _ from 'lodash';
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
    this.onDrop = this.onDrop.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleSubmit= this.handleSubmit.bind(this);
    this.handleRadarCheckbox= this.handleRadarCheckbox.bind(this);
    this.updateProgress = this.updateProgress.bind(this);
    this.loadMaxTime = this.loadMaxTime.bind(this);
    this.loadRadars = this.loadRadars.bind(this);
    this.handleSelectTime = this.handleSelectTime.bind(this);
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
      chunkSize: 1024 * 100 * 0.5
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

    // const { addData } = this.props;
    // const { router } = this.context;

    // file reader to parse input file
    // const fr = new FileReader();
    // fr.addEventListener('load', function (e) {
    //   const logData = `[${e.target.result.replace(/[,]\s+$/g, '')}]`;
    //   addData(JSON.parse(logData));
    //   if (router) {
    //     router.push('/summary');
    //   }
    //   console.debug()
    // });
  }

  /**
   * Data loading progress handler
   * @param  {Object} data     The parsed data
   * @param  {Number} progress The progress of the file reading
   */
  updateProgress (data, progress) {
    let stateUpdate = {
      uploadProgress: progress
    };
    if (progress > 99.9) {
      stateUpdate = Object.assign({dialogLoading: false}, stateUpdate);
    }
    this.setState(stateUpdate);
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
    console.debug(tMax);

    this.setState({
      simTimes: {
        min: 0,
        max: tMax
      }
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
    fileReader.readFile(this.updateProgress);
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
    this.setState({
      selectTime: value
    });
  }

  /**
   * [handleRadarCheckbox description]
   * @param  {[type]} event   [description]
   * @param  {[type]} checked [description]
   * @return {[type]}         [description]
   */
  handleRadarCheckbox (event, checked) {
    const { filteredRadars } = this.state;
    const radarName = event.target.name;
    console.debug(event.target.name, checked);
    const radarPosition = filteredRadars.indexOf(radarName);
    if (checked) {
      if (radarPosition === -1) {
        filteredRadars.push(radarName);
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
    const { dialogOpen, fileName, simRadars, simTimes, selectTime, dialogLoading } = this.state;
    const scenarioTimeIncrement = 200;
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

    const actions = [
      <FlatButton
        label="Cancel"
        secondary
        onTouchTap={this.handleClose}
      />,
      <FlatButton
        label="Submit"
        primary
        onTouchTap={this.handleSubmit}
      />
    ];

    const items = [];
    for (let i = 0; i < simTimes.max; i+=scenarioTimeIncrement) {
      items.push(<MenuItem value={i} key={i} primaryText={`${i} - ${i+scenarioTimeIncrement}`}/>);
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
                    value={radarName}
                    name={radarName}
                    onCheck={this.handleRadarCheckbox}/>;
                })}
            </div>
            <div style={styles.block}>
              <SelectField
                maxHeight={300}
                value={selectTime}
                onChange={this.handleSelectTime}
                floatingLabelText="Select time range"
              >
                {items}
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
            <h2>{this.state.uploadProgress} %</h2>
            <LinearProgress mode="determinate" color='#00BCD4' value={this.state.uploadProgress} />
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
