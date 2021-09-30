import '@kitware/vtk.js/Rendering/Profiles/Volume';

import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow';
import vtkInteractorStyleManipulator from '@kitware/vtk.js/Interaction/Style/InteractorStyleManipulator';
import Manipulators from '@kitware/vtk.js/Interaction/Manipulators';
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

    this.vtk.iStyle = vtkInteractorStyleManipulator.newInstance();
    this.vtk.renderWindow.getInteractor().setInteractorStyle(this.vtk.iStyle);
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

    // Add manipulators
    const mousePanning = Manipulators.vtkMouseCameraTrackballPanManipulator.newInstance({
      button: 1,
    });
    this.vtk.iStyle.addMouseManipulator(mousePanning);

    const mouseRotating = Manipulators.vtkMouseCameraTrackballRotateManipulator.newInstance({
      button: 2,
    });
    this.vtk.iStyle.addMouseManipulator(mouseRotating);

    const mouseZooming = Manipulators.vtkMouseCameraTrackballZoomManipulator.newInstance({
      button: 3,
    });
    this.vtk.iStyle.addMouseManipulator(mouseZooming);

    const mouseWindowing = Manipulators.vtkMouseRangeManipulator.newInstance({
      button: 1,
      control: true,
    });
    mouseWindowing.setHorizontalListener(
      1, maxWidth, 1,
      () => maxWidth + 1 - this.windowWidth,
      (val) => { this.windowWidth = maxWidth + 1 - val; },
    );
    mouseWindowing.setVerticalListener(
      range[0], range[1], 1,
      () => range[1] + range[0] - this.windowLevel,
      (val) => { this.windowLevel = range[1] + range[0] - val; },
    );
    this.vtk.iStyle.addMouseManipulator(mouseWindowing);

    const mouseSlicing = Manipulators.vtkMouseRangeManipulator.newInstance({
      scrollEnabled: true,
    });
    mouseSlicing.setScrollListener(
      extent[4], extent[5], 1,
      () => this.slice,
      (val) => { this.slice = val; },
    );
    this.vtk.iStyle.addMouseManipulator(mouseSlicing);

    // Render
    this.vtk.renderWindow.render();
  }

  get windowWidth() {
    return this.vtk.actor.getProperty().getColorWindow();
  }

  set windowWidth(w) {
    if (w === this.windowWidth) return;
    this.vtk.actor.getProperty().setColorWindow(w);
    this.vtk.renderWindow.render();
  }

  get windowLevel() {
    return this.vtk.actor.getProperty().getColorLevel();
  }

  set windowLevel(l) {
    if (l === this.windowLevel) return;
    this.vtk.actor.getProperty().setColorLevel(l);
    this.vtk.renderWindow.render();
  }

  get slice() {
    return this.vtk.mapper.getSlice();
  }

  set slice(s) {
    if (s === this.slice) return;
    this.vtk.mapper.setSlice(s);
    this.vtk.renderWindow.render();
  }
}

export default Viewer;