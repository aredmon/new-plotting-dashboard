import React, { PropTypes } from 'react';
import Dropzone from 'react-dropzone';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { addData } from '../../redux/modules/log-data';
// import loadingGif from './loading-icon.gif';
// import FileSliceReader from './file-slice-reader';
import FileSliceReader from './FileSliceReader';
import _ from 'lodash';
// material ui
// import LinearProgress from 'material-ui/lib/linear-progress';
import Dialog from 'material-ui/lib/dialog';
import FlatButton from 'material-ui/lib/flat-button';
import Checkbox from 'material-ui/lib/checkbox';
import SelectField from 'material-ui/lib/SelectField';
import MenuItem from 'material-ui/lib/menus/menu-item';

export class HomeView extends React.Component {

  constructor () {
    super();
    this.onDrop = this.onDrop.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.updateProgress = this.updateProgress.bind(this);
    this.updateMaxTime = this.updateMaxTime.bind(this);
    this.updateRadars = this.updateRadars.bind(this);
    this.state = {
      uploadProgress: 0,
      dialogOpen: false,
      simRadars: null,
      simTimes: null,
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

    // show the selector dialog
    this.setState({
      dialogOpen: true,
      uploadProgress: 0,
      fileName: file.name
    });

    // Instantiate file slice reader
    const CHUNK_SIZE = 1024 * 100 * 0.5;

    // Read the first chunk to get the radar data
    const firstSliceReader = new FileSliceReader(file, CHUNK_SIZE, '\n');
    firstSliceReader.readFirstChunk(this.updateRadars);

    // read the last chunk to find the max time of the sim
    const lastSliceReader = new FileSliceReader(file, CHUNK_SIZE, '\n');
    lastSliceReader.readLastChunk(this.updateMaxTime);

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

  updateProgress (data, progress) {
    console.debug(progress);
    this.setState({
      uploadProgress: progress
    });
  }

  /**
   * This callback finds radarInit messages and the max time in a data set
   *
   * @param  {Object} data a well formed JSON array of objects
   */
  updateRadars (data) {
    let radars = [];

    _(data).forEach((row) => {
      if (_.get(row, 'type') === 'radarInit') {
        radars.push(row);
      }
    });

    this.setState({
      simRadars: radars
    });
  }

  /**
   * This callback finds radarInit messages and the max time in a data set
   *
   * @param  {Object} data a well formed JSON array of objects
   */
  updateMaxTime (data) {
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
   * Dialog close handler
   */
  handleClose () {
    this.setState({
      dialogOpen: false
    });
  }
  /**
   * Creates the drop zone element
   */
  render () {
    const { dialogOpen, fileName, simRadars, simTimes } = this.state;
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
        padding: '20px'
      },
      checkbox: {
        marginBottom: '16px'
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
        onTouchTap={this.handleClose}
      />
    ];

    const items = [];
    for (let i = simTimes.min; i < simTimes.max; i+=scenarioTimeIncrement) {
      items.push(<MenuItem value={i} key={i} primaryText={`Item ${i}`}/>);
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
            <h3>Radars</h3>
              {_.map(simRadars, (row) => {
                const { modelId, radarName } = row;
                const label = `Radar ${modelId}: ${radarName}`;
                return <Checkbox label={label} style={styles.checkbox} key={modelId}/>;
              })}
            <SelectField maxHeight={300} value={this.state.value} onChange={this.handleChange}>
              {items}
            </SelectField>
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
