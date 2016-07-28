import React, { PropTypes } from 'react';
import Dropzone from 'react-dropzone';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { addData } from '../../redux/modules/log-data';
// material ui
import CircularProgress from 'material-ui/lib/circular-progress';

export class HomeView extends React.Component {

  constructor () {
    super();
    this.onDrop = this.onDrop.bind(this);
    this.state = {
      uploadProgress: 0
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
    const self = this;
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

    console.debug(`received file: ${file.name}`);
    let CHUNK_SIZE = 1024*100*5;
    let offset = 0;
    let objectCount = 0;
    let progress = 0;
    const fr = new FileReader();

    fr.onload = function () {
      var view = fr.result;
      let index = view.lastIndexOf('\n');
      if (index === -1) {
        console.debug('No new line character found');
        console.debug(view);
        return;
      }
      let jsonString = `[${view.substring(0, index).replace(/[,]+$/g, '')}]`;
      let obj = JSON.parse(jsonString);
      objectCount += obj.length;
      offset += index+1;
      progress = Math.round((offset/file.size) * 100);
      self.setState({
        uploadProgress: progress
      });
      seek();
    };

    fr.onerror = function () {
      // Cannot read file... Do something, e.g. assume column size = 0.
      console.debug('Cannot read file');
    };

    const seek = () => {
      let nextChunk = offset + CHUNK_SIZE;

      // approcahing end of file
      if (nextChunk >= file.size) {
        CHUNK_SIZE = nextChunk-file.size;
        console.debug('Last chunk of data');
      }

      // reached end of file
      if (offset >= file.size) {
        console.debug('End of file');
        console.debug(`Object count: ${objectCount}`);
        return;
      }

      var slice = file.slice(offset, offset + CHUNK_SIZE);
      fr.readAsText(slice);
    };

    seek();
  }

  /**
   * The styles for the drop zone
   * @type {Object}
   */
  dropzoneStyle = {
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
  };

  /**
   * Creates the drop zone element
   */
  render () {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 88px)'
        }}
      >
        <CircularProgress mode="determinate" value={this.state.uploadProgress} size={2}/>
        <Dropzone onDrop={this.onDrop} style={this.dropzoneStyle}>
          <div id={'dropContent'} style={{ textAlign: 'center' }}>
            <h3>Drag and drop log file here</h3>
            <h5>Or click to browse for log file</h5>
          </div>
        </Dropzone>
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
