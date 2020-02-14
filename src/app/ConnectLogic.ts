import {
  Color3,
  Mesh,
  Scene,
  VRExperienceHelper,
  WebVRController,
  AbstractMesh,
  DeepImmutable,
  MeshBuilder,
  Vector3,
  LinesMesh,
  HighlightLayer
} from 'babylonjs'

export class ConnectLogic {
  private selectedMesh: Mesh | null = null
  private startMesh: Mesh | null = null
  private attractor: Mesh | null = null
  private line: LinesMesh | null = null
  private readonly hl = new HighlightLayer('hl', this.scene)

  constructor (readonly scene: Scene, vrHelper: VRExperienceHelper, nodes: Set<Mesh>, readonly hand: 'left' | 'right' = 'left') {
    vrHelper.onNewMeshSelected.add((mesh) => {
      if (mesh instanceof Mesh && nodes.has(mesh)) {
        this.selectedMesh = mesh
        this.hl.addMesh(this.selectedMesh, Color3.Green())
      }
    })

    vrHelper.onSelectedMeshUnselected.add(() => {
      if (this.selectedMesh != null) {
        this.hl.removeMesh(this.selectedMesh)
        this.selectedMesh = null
      }
    })

    vrHelper.onControllerMeshLoaded.add((webVRController) => {
      webVRController.onTriggerStateChangedObservable.add((stateObject) => {
        if (webVRController.hand === this.hand) {
          if (stateObject.value > 0.5) {
            this.grabSelectedMesh(webVRController)
          } else {
            if (this.startMesh != null) {
              this.ungrabMesh(webVRController)
            }
          }
        }
      })
    })

    scene.onBeforeRenderObservable.add(() => {
      if (this.line != null) {
        this.line.dispose()
        this.line = null
      }
      if (this.startMesh == null || this.attractor == null) {
        return
      }

      this.line = MeshBuilder.CreateLines('line', {
        points: [
          this.attractor.absolutePosition,
          this.startMesh.absolutePosition
        ]
      }, this.scene)
    })
  }

  private ungrabMesh (webVRController: WebVRController): void {
    if (webVRController.mesh == null || this.attractor == null) {
      return
    }
    if (this.selectedMesh != null && this.startMesh != null && this.selectedMesh !== this.startMesh) {
      this.drawArrow(this.startMesh, this.selectedMesh)
    }
    this.attractor.dispose()
    this.attractor = null
    this.startMesh = null
  }

  private grabSelectedMesh (webVRController: WebVRController): void {
    if (webVRController.mesh == null || this.selectedMesh == null || this.startMesh != null) {
      return
    }

    const pickingInfo = webVRController.getForwardRay().intersectsMesh(this.selectedMesh as DeepImmutable<AbstractMesh>)

    if (pickingInfo.pickedPoint == null) {
      return
    }

    this.attractor = MeshBuilder.CreateSphere('attractor', { diameter: 0.05 }, this.scene)
    this.attractor.setAbsolutePosition(pickingInfo.pickedPoint)
    webVRController.mesh.addChild(this.attractor)
    this.attractor.position = new Vector3(0, 0, this.attractor.position.z)
    this.startMesh = this.selectedMesh
  }

  private drawArrow (a: Mesh, b: Mesh): void {
    MeshBuilder.CreateLines('line', {
      points: [
        a.absolutePosition,
        b.absolutePosition
      ]
    }, this.scene)
  }
}
