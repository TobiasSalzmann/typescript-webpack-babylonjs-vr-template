import { Color3, HighlightLayer, Mesh, Scene, Vector3, VRExperienceHelper, WebVRController } from 'babylonjs'

export class GrabLogic {
  private selectedMesh: Mesh | null = null;
  private grabbedMesh: Mesh | null = null;
  private readonly hl: HighlightLayer;
  private readonly grabbables: Set<Mesh>;
  private currentPos: Vector3 | null = null;
  private currentVelocity: Vector3 = Vector3.Zero()
  private currentTime: number | null = null;

  constructor (scene: Scene, vrHelper: VRExperienceHelper, grabbables: Set<Mesh>) {
    this.grabbables = grabbables
    this.hl = new HighlightLayer('hl', scene)

    scene.onBeforePhysicsObservable.add(() => {
      if (this.grabbedMesh != null) {
        const time = Date.now() / 1000
        const pos = this.grabbedMesh.getAbsolutePosition().clone()

        if (this.currentPos != null && this.currentTime != null && (time - this.currentTime) > 0.1) {
          const dt = time - this.currentTime
          this.currentVelocity = pos.subtract(this.currentPos).scale(1 / dt)
        }

        if (this.currentPos == null || this.currentTime == null || (time - this.currentTime) > 0.1) {
          this.currentPos = pos
          this.currentTime = time
        }
      }
    }
    )

    vrHelper.onNewMeshSelected.add((mesh) => {
      if (mesh instanceof Mesh) {
        this.selectedMesh = mesh
      }
    })

    vrHelper.onSelectedMeshUnselected.add(() => {
      this.selectedMesh = null
    })

    vrHelper.onControllerMeshLoaded.add((webVRController) => {
      webVRController.onTriggerStateChangedObservable.add((stateObject) => {
        if (webVRController.hand === 'left') {
          if (stateObject.value > 0.5) {
            this.grabSelectedMesh(webVRController)
          } else {
            this.ungrabMesh(webVRController)
          }
        }
      })
    })
  }

  private ungrabMesh (webVRController: WebVRController): void {
    if (webVRController.mesh != null && this.grabbedMesh != null) {
      webVRController.mesh.removeChild(this.grabbedMesh)
      if (this.grabbedMesh.physicsImpostor != null) {
        this.grabbedMesh.physicsImpostor.wakeUp()
        this.grabbedMesh.physicsImpostor.setLinearVelocity(this.currentVelocity)
      }
      this.hl.removeMesh(this.grabbedMesh)
      this.grabbedMesh = null
    }
  }

  private grabSelectedMesh (webVRController: WebVRController): void {
    if (webVRController.mesh != null && this.selectedMesh != null && this.grabbables.has(this.selectedMesh)) {
      this.grabbedMesh = this.selectedMesh
      webVRController.mesh.addChild(this.grabbedMesh)
      if (this.grabbedMesh.physicsImpostor != null) {
        this.grabbedMesh.physicsImpostor.sleep()
      }
      this.hl.addMesh(this.grabbedMesh, Color3.Green())
    }
  }
}
