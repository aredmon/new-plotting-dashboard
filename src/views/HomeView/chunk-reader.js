const chunkReader = (file) => {
  var fileSize = file.size;
  var chunkSize = 64 * 1024; // bytes
  var offset = 0;
  // var self = this; // we need a reference to the current object
  var chunkReaderBlock = null;

  const readEventHandler = (evt) => {
    if (evt.target.error == null) {
      offset += evt.target.result.length;
      // console.debug(evt.target.result);
    } else {
      console.log(`Read error: ${evt.target.error}`);
      return;
    }

    if (offset >= fileSize) {
      console.log('Done reading file');
      return;
    }

    let loaded = Math.round(offset/fileSize * 100);
    console.debug(`Loaded ${loaded} %`);
    // of to the next chunk
    chunkReaderBlock(offset, chunkSize, file);
  };

  chunkReaderBlock = (_offset, length, _file) => {
    var r = new FileReader();
    var blob = _file.slice(_offset, length + _offset);
    r.onload = readEventHandler;
    r.readAsText(blob);
  };

  // now let's start the read with the first block
  chunkReaderBlock(offset, chunkSize, file);
};

export default chunkReader;
