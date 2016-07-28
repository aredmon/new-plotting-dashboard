
const readFileWorker = () => {
  self.addEventListener('message', (file) => {
    console.log('Message received from main script');
    var workerResult = `File size: ${file.size}`;
    console.log('Posting message back to main script');
    postMessage(workerResult);
  }, false);
};

export default readFileWorker;
