
class FileSliceReader {

  constructor (file, chunkSize, delimiter) {
    this.file = file;
    this._setDefaults = this._setDefaults.bind(this);
    this._seek = this._seek.bind(this);
    this._readChunk = this._readChunk.bind(this);
    this.readFile = this.readFile.bind(this);
    this.readFirstChunk = this.readFirstChunk.bind(this);
    this.readLastChunk = this.readLastChunk.bind(this);
    this.readReverse = false;
    this.defaults = {
      chunkSize: chunkSize || 1024*100*1,
      offset: 0,
      objectCount: 0,
      progress: 0,
      chunksRead: 0,
      delimiter: delimiter || '\n'
    };
  }

  _setDefaults () {
    const { chunkSize, offset, objectCount, progress, chunksRead, delimiter } = this.defaults;
    this.chunkSize = chunkSize;
    this.offset = offset;
    this.objectCount = objectCount;
    this.progress = progress;
    this.chunksRead = chunksRead;
    this.delimiter = delimiter;
    this.fr = new FileReader();

    // simple error handler
    this.fr.onerror = function () {
      console.debug('Error reading file =(');
    };
  }

  _seek () {
    const { file, offset, fr } = this;
    let nextChunk = this.offset + this.chunkSize;

    // first chunk of data
    if (offset === 0) {
      console.debug('First chunk of data');
    }

    // approcahing end of file
    if (nextChunk > file.size) {
      // adjust the final chunk size to read the remaining file contents
      this.chunkSize = nextChunk-file.size;
      console.debug('Last chunk of data');
    }

    // reached end of file
    if (offset >= file.size) {
      console.debug('End of file');
      console.debug(`Object count: ${this.objectCount}`);
      console.debug(`Chunks Read: ${this.chunksRead}`);
      return;
    }

    const slice = file.slice(offset, nextChunk);
    fr.readAsText(slice);
  }

  _readChunk (callback) {
    const { file, fr, delimiter } = this;
    let { objectCount, offset, chunksRead, progress } = this;

    var dataChunk = fr.result;
    let lastCharIndex = this.readReverse ? dataChunk.indexOf(delimiter)+1 : dataChunk.lastIndexOf(delimiter);
    if (lastCharIndex === -1) {
      console.debug('No new line character found');
      console.debug(dataChunk);
      return;
    }
    let jsonString = this.readReverse
      ? `[${dataChunk.substring(lastCharIndex).replace(/[,]\s+$/g, '')}]`
      : `[${dataChunk.substring(0, lastCharIndex).replace(/[,]+$/g, '')}]`;

    let dataObject = JSON.parse(jsonString);

    // update the state for the ui
    progress = Math.round((offset/file.size) * 100);
    callback(dataObject, progress);

    // update bookkeeping values
    objectCount += dataObject.length;
    offset += lastCharIndex+1;
    chunksRead += 1;
  }

  readFile (callback) {
    console.debug('reading entire file slice by slice');
    this._setDefaults();
    this.fr.onload = () => {
      this._readChunk(callback);
      this._seek();
    };
    this._seek();
  }

  readFirstChunk (callback) {
    console.debug('reading first file chunk');
    this._setDefaults();
    this.fr.onload = () => {
      this._readChunk(callback);
    };
    this._seek();
  }

  readLastChunk (callback) {
    console.debug('reading last file chunk');
    this._setDefaults();
    // force the seek function to only read the last file chunk
    this.offset = this.file.size - this.chunkSize;
    this.readReverse = true;
    this.fr.onload = () => {
      this._readChunk(callback);
    };
    this._seek();
  }
}

export default FileSliceReader;
