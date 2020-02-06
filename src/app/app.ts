import {
  Engine,
  Scene,
  HemisphericLight,
  Vector3,
  MeshBuilder,
  PointLight,
  CubeTexture,
  Mesh,
  StandardMaterial,
  Texture,
  Color3,
  PhysicsImpostor,
  CannonJSPlugin
} from 'babylonjs'
import { GrabLogic } from './GrabLogic'
import * as cannon from 'cannon'

function createSphere (scene: Scene): Mesh {
  const sphere = MeshBuilder.CreateSphere('sphere', { diameter: 0.5 }, scene)
  sphere.position = new Vector3(1, 2.5, 1)
  sphere.physicsImpostor = new PhysicsImpostor(sphere, PhysicsImpostor.SphereImpostor, {
    mass: 1,
    restitution: 0.9
  }, scene)
  return sphere
}

function createGround (scene: Scene): Mesh {
  const numberOfTiles = 20
  const ground = MeshBuilder.CreateGround('ground', { height: 40, width: 40, subdivisions: numberOfTiles }, scene)
  const material = new StandardMaterial('groundMaterial', scene)
  const texture = new Texture('resources/textures/floor/floor.png', scene)
  const bumpTexture = new Texture('resources/textures/floor/floor_bump.png', scene)
  texture.uScale = numberOfTiles
  texture.vScale = numberOfTiles
  bumpTexture.uScale = numberOfTiles
  bumpTexture.vScale = numberOfTiles
  material.diffuseTexture = texture
  material.bumpTexture = bumpTexture

  material.useParallax = true
  material.useParallaxOcclusion = true
  material.parallaxScaleBias = 0.1
  material.specularPower = 1000.0
  material.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5)

  ground.material = material
  ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene)
  return ground
}

function createSkybox (scene: Scene): Mesh {
  const skybox = Mesh.CreateBox('skyBox', 1000, scene)
  skybox.isPickable = false
  const skyboxMaterial = new StandardMaterial('skyBoxMaterial', scene)
  skyboxMaterial.backFaceCulling = false
  skyboxMaterial.reflectionTexture = new CubeTexture('resources/textures/cube/MilkyWay/dark-s', scene)
  skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE
  skyboxMaterial.diffuseColor = new Color3(0, 0, 0)
  skyboxMaterial.specularColor = new Color3(0, 0, 0)
  skyboxMaterial.disableLighting = true
  skybox.material = skyboxMaterial
  return skybox
}

function createScene (engine: Engine): Scene {
  const scene = new Scene(engine)
  scene.enablePhysics(new Vector3(0, -9.81, 0), new CannonJSPlugin(true, 10, cannon))

  const vrHelper = scene.createDefaultVRExperience()
  vrHelper.enableInteractions()
  const ground = createGround(scene)
  vrHelper.enableTeleportation({ floorMeshes: [ground] })

  createSkybox(scene)

  const hemisphericLight = new HemisphericLight('light1', new Vector3(1, 1, 0), scene)
  const pointLight = new PointLight('light2', new Vector3(0, 1, -1), scene)

  const sphere = createSphere(scene)

  const grabbables: Set<Mesh> = new Set([sphere])
  const grabLogic = new GrabLogic(scene, vrHelper, grabbables)

  return scene
}

export function run (): void {
  const canvas = document.getElementById('main-canvas') as HTMLCanvasElement
  const engine = new Engine(canvas, true)
  const scene = createScene(engine)
  engine.runRenderLoop(() => scene.render())
  window.addEventListener('resize', () => engine.resize())
}
