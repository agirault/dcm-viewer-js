import readImageDICOMFileSeries from 'itk/readImageDICOMFileSeries';

// Files
const fileInput = document.querySelector('input');
fileInput.addEventListener('change', async (event) => {

  // Get files
  const { dataTransfer } = event;
  const files = event.target.files || dataTransfer.files;

  // Read series
  const itkReader = await readImageDICOMFileSeries(files);
  window.volumeData = itkReader.image;
});
