import '@kitware/vtk.js/Rendering/Profiles/Volume';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow';
import vtkInteractorStyleManipulator from '@kitware/vtk.js/Interaction/Style/InteractorStyleManipulator';
import Manipulators from '@kitware/vtk.js/Interaction/Manipulators';
import ITKHelper from '@kitware/vtk.js/Common/DataModel/ITKHelper';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkAnnotatedCubeActor from '@kitware/vtk.js/Rendering/Core/AnnotatedCubeActor';
import AnnotatedCubePresets from '@kitware/vtk.js/Rendering/Core/AnnotatedCubeActor/Presets';
import vtkOrientationMarkerWidget from '@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget';
import vtkMath from '@kitware/vtk.js/Common/Core/Math';
import vtkCubeSource from '@kitware/vtk.js/Filters/Sources/CubeSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';

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
    const interactor = this.vtk.renderWindow.getInteractor()
    interactor.setInteractorStyle(this.vtk.iStyle);

    const cube = vtkAnnotatedCubeActor.newInstance();
    AnnotatedCubePresets.applyPreset('lps', cube);
    const orientationWidget = vtkOrientationMarkerWidget.newInstance({
      actor: cube,
      interactor: interactor,
    });
    orientationWidget.setEnabled(true);
    orientationWidget.setViewportCorner(
      vtkOrientationMarkerWidget.Corners.TOP_RIGHT
    );
    orientationWidget.setViewportSize(0.15);

    this.vtk.renderWindow.render();
  }

  load(itkImageData) {
    // Convert image data
    const data = ITKHelper.convertItkToVtkImage(itkImageData);

    // Slice representation
    this.vtk.mapper.setInputData(data);

    // Slice rendering
    this.vtk.renderer.addActor(this.vtk.actor);

    // Setup camera
    const d9 = data.getDirection();
    const d3x3 = [
      [d9[0], d9[3], d9[6]],
      [d9[1], d9[4], d9[7]],
      [d9[2], d9[5], d9[8]],
    ];
    let normal = [0, 0, 0];
    let viewUp = [0, 0, 0];
    // VTK is in LPS, therefore +X = L; -X = R; +Y = P; -Y = A; +Z = S; -Z = I
    const sliceMode = this.vtk.mapper.getSlicingMode();
    switch (sliceMode) {
      case vtkImageMapper.SlicingMode.I:
        normal = [-1, 0, 0]; // -I
        viewUp = [0, 0, 1]; // +K
        vtkMath.multiply3x3_vect3(d3x3, normal, normal);
        vtkMath.multiply3x3_vect3(d3x3, viewUp, viewUp);
        break;
      case vtkImageMapper.SlicingMode.J:
        normal = [0, -1, 0]; // -J
        viewUp = [1, 0, 0]; // +I
        vtkMath.multiply3x3_vect3(d3x3, normal, normal);
        vtkMath.multiply3x3_vect3(d3x3, viewUp, viewUp);
        break;
      case vtkImageMapper.SlicingMode.K:
        normal = [0, 0, -1]; // -K
        viewUp = [0, 1, 0]; // +J
        vtkMath.multiply3x3_vect3(d3x3, normal, normal);
        vtkMath.multiply3x3_vect3(d3x3, viewUp, viewUp);
        break;
      case vtkImageMapper.SlicingMode.X:
        // X = RL axis = sagittal
        normal = [-1, 0, 0]; // -X (Right)
        viewUp = [0, 0, +1]; // +Z (Superior)
        break;
      case vtkImageMapper.SlicingMode.Y:
        // Y = AP axis = coronal
        normal = [0, +1, 0]; // +Y (Posterior)
        viewUp = [0, 0, +1]; // +Z (Superior)
        break;
      case vtkImageMapper.SlicingMode.Z:
        // Z = IS axis = axial
        normal = [0, 0, +1]; // +Z (Superior)
        viewUp = [0, -1, 0]; // -Y (Anterior)
        break;
    }
    const camera = this.vtk.renderer.getActiveCamera();
    this.vtk.renderer.resetCamera(); // To compute focal point
    let position = camera.getFocalPoint();
    position = position.map((e, i) => e - normal[i]); // offset along the slicing axis
    camera.setPosition(...position);
    camera.setViewUp(viewUp);
    this.vtk.renderer.resetCamera();

    // Initial windowing
    const range = data.getPointData().getScalars().getRange();
    const maxWidth = range[1] - range[0];
    this.vtk.actor.getProperty().setColorWindow(maxWidth);
    const center = Math.round((range[0] + range[1]) / 2);
    this.vtk.actor.getProperty().setColorLevel(center);

    // Initial slice
    let minSlice;
    let maxSlice;
    let sliceStep;
    let axisIndex;
    const extent = data.getExtent();
    const bounds = data.getBounds();
    const spacing = data.getSpacing();
    const sliceModeLabel = 'IJKXYZ'[sliceMode];
    switch (sliceMode) {
      case vtkImageMapper.SlicingMode.I:
      case vtkImageMapper.SlicingMode.J:
      case vtkImageMapper.SlicingMode.K:
        axisIndex = 'IJK'.indexOf(sliceModeLabel);
        minSlice = extent[axisIndex * 2];
        maxSlice = extent[axisIndex * 2 + 1];
        sliceStep = 1;
        break;
      case vtkImageMapper.SlicingMode.X:
      case vtkImageMapper.SlicingMode.Y:
      case vtkImageMapper.SlicingMode.Z:
        {
          axisIndex = 'XYZ'.indexOf(sliceModeLabel);
          minSlice = bounds[axisIndex * 2];
          maxSlice = bounds[axisIndex * 2 + 1];
          const { ijkMode } = this.vtk.mapper.getClosestIJKAxis();
          sliceStep = spacing[ijkMode];
        }
        break;
    }
    let midSlice = (minSlice + maxSlice) / 2;
    midSlice = Math.round(midSlice / sliceStep) * sliceStep;
    this.vtk.mapper.setSlice(midSlice);

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
      minSlice, maxSlice, sliceStep,
      () => this.slice,
      (val) => { this.slice = val; },
    );
    this.vtk.iStyle.addMouseManipulator(mouseSlicing);

    // Add bounding box
    const bb = vtkCubeSource.newInstance();
    bb.setBounds(extent);
    const bbMapper = vtkMapper.newInstance();
    bbMapper.setInputData(bb.getOutputData());
    const bbActor = vtkActor.newInstance();
    bbActor.setMapper(bbMapper);
    bbActor.setUserMatrix(data.getIndexToWorld())
    bbActor.getProperty().setRepresentationToWireframe();
    bbActor.getProperty().setInterpolationToFlat();
    bbActor.getProperty().setColor(1, 0, 0);
    this.vtk.renderer.addActor(bbActor);

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