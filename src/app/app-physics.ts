import {
  Engine,
  Scene,
  UniversalCamera,
  WebVRFreeCamera,
  HemisphericLight,
  Vector3,
  MeshBuilder,
  PointLight,
  CubeTexture,
  BackgroundMaterial,
  Mesh,
  StandardMaterial,
  Texture,
  Color3,
  AbstractMesh,
  HighlightLayer,
  PhysicsImpostor,
  CannonJSPlugin,
  VRExperienceHelper,
  WebVRController,
  PhysicsJoint
} from "babylonjs";
import * as cannon from "cannon";

export function run() {
  const canvas = <HTMLCanvasElement>document.getElementById("main-canvas");
  const engine = new Engine(canvas, true);
  const scene = createScene(engine, canvas);
  engine.runRenderLoop(() => scene.render());
  window.addEventListener("resize", () => engine.resize())
}

function createScene(engine: Engine, canvas: HTMLCanvasElement): Scene {
  const scene = new Scene(engine);
  const vrHelper = scene.createDefaultVRExperience();
  vrHelper.enableInteractions();
  scene.enablePhysics(new Vector3(0, -9.81, 0), new CannonJSPlugin(true, 10, cannon));

  createSkybox(scene)
  const sphere = createSphere(scene);
  createGroundParallax(scene)
  new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
  new PointLight("light2", new Vector3(0, 1, -1), scene);
  const grabbables: Set<Mesh> = new Set([sphere])
  const grabLogic = new GrabLogic(scene, vrHelper, grabbables);

  return scene;
}

class GrabLogic {
  selectedMesh: Mesh | null = null;
  grabbedMesh: Mesh | null = null;
  attractor: Mesh;
  hl: HighlightLayer;
  private grabbables: Set<Mesh>;

  constructor(scene: Scene, vrHelper: VRExperienceHelper, grabbables: Set<Mesh>) {
    this.grabbables = grabbables;
    this.attractor = MeshBuilder.CreateSphere("attractor", {diameter: 0.1}, scene);
    this.hl = new HighlightLayer("hl", scene);

    this.hl.addMesh(this.attractor, Color3.Blue())
    vrHelper.onNewMeshSelected.add((mesh) => {
      if (mesh instanceof Mesh) {
        this.selectedMesh = mesh;
      }
    });

    vrHelper.onSelectedMeshUnselected.add(() => {
      this.selectedMesh = null;
    });

    vrHelper.onControllerMeshLoaded.add((webVRController) => {
      if (webVRController.hand == "left" && webVRController.mesh) {
        webVRController.mesh.addChild(this.attractor)

        // scene.onBeforePhysicsObservable.add((scene, state) => {
        //   if (this.grabbedMesh && this.grabbedMesh.physicsImpostor) {
        //     const v = this.grabbedMesh.physicsImpostor.getLinearVelocity()
        //     if(v) {
        //       this.grabbedMesh.physicsImpostor.applyImpulse(v.negate(), this.grabbedMesh.getAbsolutePosition())
        //     }
        //     // const attractorPos = this.attractor.absolutePosition;
        //     // const meshPos = this.grabbedMesh.absolutePosition;
        //     // const forceDirection = attractorPos.subtract(meshPos)
        //     // if (forceDirection.length() > 0.1) {
        //     //   this.grabbedMesh.physicsImpostor.setLinearVelocity(forceDirection.scale(10))
        //     // } else {
        //     //   this.grabbedMesh.physicsImpostor.setLinearVelocity(new Vector3(0, 0, 0))
        //     // }
        //   }
        // });
        scene.onAfterPhysicsObservable.add((scene, state) => {
          if (this.grabbedMesh && this.grabbedMesh.physicsImpostor) {

              this.grabbedMesh.setAbsolutePosition(this.attractor.absolutePosition)
            // const attractorPos = this.attractor.absolutePosition;
            // const meshPos = this.grabbedMesh.absolutePosition;
            // const forceDirection = attractorPos.subtract(meshPos)
            // if (forceDirection.length() > 0.1) {
            //   this.grabbedMesh.physicsImpostor.setLinearVelocity(forceDirection.scale(10))
            // } else {
            //   this.grabbedMesh.physicsImpostor.setLinearVelocity(new Vector3(0, 0, 0))
            // }
          }
        });
      }

      webVRController.onTriggerStateChangedObservable.add((stateObject) => {
        if (webVRController.hand == "left") {
          if (stateObject.value > 0.5) {
            this.grabSelectedMesh(webVRController)
          } else {
            this.ungrabMesh(webVRController)
          }
        }
      });
    });
  }

  private ungrabMesh(webVRController: WebVRController) {
    if (webVRController.mesh && this.grabbedMesh) {
      // webVRController.mesh.removeChild(this.attractor)
      this.hl.removeMesh(this.grabbedMesh)
      this.grabbedMesh = null
    }
  }

  private grabSelectedMesh(webVRController: WebVRController) {
    if (webVRController.mesh && this.selectedMesh && this.grabbables.has(this.selectedMesh)) {
      this.grabbedMesh = this.selectedMesh
      this.attractor.setAbsolutePosition(this.grabbedMesh.absolutePosition)
      this.hl.addMesh(this.grabbedMesh, Color3.Green());
    }
  }

}

function createSphere(scene: Scene) {
  const sphere = MeshBuilder.CreateSphere("sphere", {diameter: 0.5}, scene);
  sphere.position = new Vector3(1, 2.5, 1);
  sphere.physicsImpostor = new PhysicsImpostor(sphere, PhysicsImpostor.SphereImpostor, {
    mass: 1,
    restitution: 0.9,
    friction: 1
  }, scene);
  return sphere;
}

function createGroundParallax(scene: Scene) {
  const numberOfTiles = 20;
  const ground = MeshBuilder.CreateGround('ground', {height: 40, width: 40, subdivisions: numberOfTiles}, scene);
  const material = new StandardMaterial("groundMaterial", scene)
  const texture = new Texture("resources/textures/floor/floor.png", scene);
  const bumpTexture = new Texture("resources/textures/floor/floor_bump.png", scene);
  texture.uScale = numberOfTiles
  texture.vScale = numberOfTiles
  bumpTexture.uScale = numberOfTiles
  bumpTexture.vScale = numberOfTiles
  material.diffuseTexture = texture;
  material.bumpTexture = bumpTexture

  material.useParallax = true;
  material.useParallaxOcclusion = true;
  material.parallaxScaleBias = 0.1;
  material.specularPower = 1000.0;
  material.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);

  ground.material = material
  ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 0.9}, scene);
  return ground;
}


function createSkybox(scene: Scene) {
  const skybox = Mesh.CreateBox("skyBox", 1000, scene);
  skybox.isPickable = false;
  const skyboxMaterial = new StandardMaterial("skyBoxMaterial", scene);
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.reflectionTexture = new CubeTexture("resources/textures/cube/MilkyWay/dark-s", scene);
  skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
  skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
  skyboxMaterial.specularColor = new Color3(0, 0, 0);
  skyboxMaterial.disableLighting = true;
  skybox.material = skyboxMaterial;
  return skybox;
}
