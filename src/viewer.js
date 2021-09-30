import '@kitware/vtk.js/Rendering/Profiles/Volume';

import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow';
import ITKHelper from '@kitware/vtk.js/Common/DataModel/ITKHelper';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
class Viewer {
  constructor(container) {
    const genericRenderWindow = vtkGenericRenderWindow.newInstance();
    genericRenderWindow.setContainer(container);
    genericRenderWindow.resize();

    this.vtk = {};

    this.vtk.renderer = genericRenderWindow.getRenderer();
    this.vtk.renderer.setBackground([0.2, 0.2, 0.2]);
    this.vtk.renderer.getActiveCamera().setParallelProjection(true);

    this.vtk.renderWindow = genericRenderWindow.getRenderWindow();
    this.vtk.renderWindow.render();

    this.vtk.mapper = vtkImageMapper.newInstance();
    this.vtk.mapper.setSlicingMode(vtkImageMapper.SlicingMode.K);

    this.vtk.actor = vtkImageSlice.newInstance();
    this.vtk.actor.setMapper(this.vtk.mapper);
  }

  load(itkImageData) {
    // Convert image data
    const data = ITKHelper.convertItkToVtkImage(itkImageData);

    // Slice representation
    this.vtk.mapper.setInputData(data);

    // Slice rendering
    this.vtk.renderer.addActor(this.vtk.actor);
    this.vtk.renderer.resetCamera();

    // Initial windowing
    const range = data.getPointData().getScalars().getRange();
    const maxWidth = range[1] - range[0];
    this.vtk.actor.getProperty().setColorWindow(maxWidth);
    const center = Math.round((range[0] + range[1]) / 2);
    this.vtk.actor.getProperty().setColorLevel(center);

    // Initial slice
    const extent = data.getExtent();
    const slice = Math.round((extent[4] + extent[5]) / 2);
    this.vtk.mapper.setSlice(slice);

    // Render
    this.vtk.renderWindow.render();
  }
}

export default Viewer;