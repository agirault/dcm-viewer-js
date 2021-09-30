import readImageDICOMFileSeries from 'itk/readImageDICOMFileSeries';
import Viewer from './viewer';

const viewerContainer = document.getElementById('viewer');
const viewer = new Viewer(viewerContainer);

// Files
const fileInput = document.querySelector('input');
fileInput.addEventListener('change', async (event) => {

  // Get files
  const { dataTransfer } = event;
  const files = event.target.files || dataTransfer.files;

  // Read series
  const itkReader = await readImageDICOMFileSeries(files);
  fileInput.remove();

  // Load in viewer
  viewer.load(itkReader.image);
});
