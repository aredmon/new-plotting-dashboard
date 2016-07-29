import React, { PropTypes } from 'react';
import Dropzone from 'react-dropzone';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { addData } from '../../redux/modules/log-data';
import loadingGif from './loading-icon.gif';
// import FileSliceReader from './file-slice-reader';
import FileSliceReader from './FileSliceReader';
// material ui
import LinearProgress from 'material-ui/lib/linear-progress';
import Dialog from 'material-ui/lib/dialog';
import FlatButton from 'material-ui/lib/flat-button';

export class HomeView extends React.Component {

  constructor () {
    super();
    this.onDrop = this.onDrop.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.readFile = this.readFile.bind(this);
    this.updateProgress = this.updateProgress.bind(this);
    this.state = {
      uploadProgress: 0,
      dialogOpen: false,
      simRadars: null,
      simTime: null
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
    // show the selector dialog
    this.setState({
      dialogOpen: true
    });

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
    // fr.readAsText(files[0

    const file = files[0];
    // save file reference
    // this.file = file;

    console.debug(`received file: ${file.name}`);

    // this.readFile();
    // FileSliceReader(file, this.updateProgress);
    const CHUNK_SIZE = 1024*100*0.5;
    const fileReader = new FileSliceReader(file, CHUNK_SIZE, '\n');
    fileReader.readLastChunk(this.updateProgress);
  }

  updateProgress (data, progress) {
    console.debug(data);
    this.setState({
      uploadProgress: progress
    });
  }

  /**
   * Reads the entire file in chunks
   */
  readFile () {
    const self = this;
    const { file } = this;
    console.debug(`Reading file: ${file.name}`);

    // function variables
    let CHUNK_SIZE = 1024*100*5;
    let offset = 0;
    let objectCount = 0;
    let progress = 0;
    const delimiter = '\n';

    // File reader
    const fr = new FileReader();

    fr.onload = function () {
      var dataChunk = fr.result;
      let lastCharIndex = dataChunk.lastIndexOf(delimiter);
      if (lastCharIndex === -1) {
        console.debug('No new line character found');
        console.debug(dataChunk);
        return;
      }
      let jsonString = `[${dataChunk.substring(0, lastCharIndex).replace(/[,]+$/g, '')}]`;
      let obj = JSON.parse(jsonString);
      // do something with the json object

      objectCount += obj.length;
      offset += lastCharIndex+1;

      // update the state for the ui
      progress = Math.round((offset/file.size) * 100);
      self.setState({
        uploadProgress: progress
      });

      seek();
    };

    fr.onerror = function () {
      console.debug('Error reading file =(');
    };

    const seek = () => {
      let nextChunk = offset + CHUNK_SIZE;

      // first chunk of data
      if (offset === 0) {
        console.debug('First chunk of data');
      }

      // approcahing end of file
      if (nextChunk > file.size) {
        // adjust the final chunk size to read the remaining file contents
        CHUNK_SIZE = nextChunk-file.size;
        console.debug('Last chunk of data');
      }

      // reached end of file
      if (offset >= file.size) {
        console.debug('End of file');
        console.debug(`Object count: ${objectCount}`);
        return;
      }

      var slice = file.slice(offset, nextChunk);
      fr.readAsText(slice);
    };

    seek();
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
    const { uploadProgress, dialogOpen } = this.state;

    /**
     * The styles for the drop zone
     * @type {Object}
     */
    const style = {
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
        padding: '100px'
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
        disabled
        onTouchTap={this.handleClose}
      />
    ];

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 88px)'
        }}
      >
        <Dropzone onDrop={this.onDrop} style={style.dropzoneStyle}>
          <div id={'dropContent'} style={{ textAlign: 'center' }}>
            <h3>Drag and drop log file here</h3>
            <h5>Or click to browse for log file</h5>
          </div>
        </Dropzone>
        <Dialog
          title="Dialog With Actions"
          actions={actions}
          modal
          open={dialogOpen}
        >
          <div style={style.loadingStyle}>
            <img src={loadingGif} />
            <div>
              <LinearProgress mode="determinate" color='#00BCD4' value={uploadProgress} size={2}/>
            </div>
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
