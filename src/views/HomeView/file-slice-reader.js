const readSliceFile = (file, callback, chunkSize, numChunks) => {
  console.debug(`Reading file: ${file.name}`);

  // function variables
  let CHUNK_SIZE = chunkSize || 1024*100*5;
  let offset = 0;
  let objectCount = 0;
  let progress = 0;
  let chunksRead = 0;
  const delimiter = '\n';

  // File reader
  const fr = new FileReader();

  /**
   * File reader load handler
   */
  fr.onload = function () {
    var dataChunk = fr.result;
    let lastCharIndex = dataChunk.lastIndexOf(delimiter);
    if (lastCharIndex === -1) {
      console.debug('No new line character found');
      console.debug(dataChunk);
      return;
    }
    let jsonString = `[${dataChunk.substring(0, lastCharIndex).replace(/[,]+$/g, '')}]`;
    let dataObject = JSON.parse(jsonString);
    // do something with the json object

    // update bookkeeping values
    objectCount += dataObject.length;
    offset += lastCharIndex+1;
    chunksRead += 1;

    // update the state for the ui
    progress = Math.round((offset/file.size) * 100);
    callback(dataObject, progress);

    // check if the file slice reader should stop
    if (numChunks && chunksRead >= numChunks) {
      console.debug(`Read ${chunksRead} chunks of data. Stopping`);
      return;
    }

    seek();
  };

  /**
   * file reader error handler
   */
  fr.onerror = function () {
    console.debug('Error reading file =(');
  };

  /**
   * Seek slices a file into a blob and reads the blob
   * with a FileReader
   * @return {[type]} [description]
   */
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
};

export default readSliceFile;
