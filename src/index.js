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
