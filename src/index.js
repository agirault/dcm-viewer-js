import readImageDICOMFileSeries from 'itk/readImageDICOMFileSeries';
import Viewer from './viewer';

// Setup viewer with DOM
const viewerContainer = document.getElementById('viewer');
const topLabel = document.getElementById('top');
const bottomLabel = document.getElementById('bottom');
const leftLabel = document.getElementById('left');
const rightLabel = document.getElementById('right');
const viewer = new Viewer(
  viewerContainer,
  { topLabel, bottomLabel, leftLabel, rightLabel },
);

// Files
const fileInput = document.querySelector('input');
fileInput.addEventListener('change', async (event) => {

  // Get files
  const { dataTransfer } = event;
  const files = event.target.files || dataTransfer.files;

  fileInput.setAttribute("hidden", "");

  // Read series
  const itkReader = await readImageDICOMFileSeries(files)

  // Load in viewer
  const selector = document.getElementById('slicingModeSelector')
  viewer.load(itkReader.image, parseInt(selector.value));

  selector.removeAttribute("hidden");
  selector.onchange = () => {
    viewer.load(itkReader.image, parseInt(selector.value));
  }
});
