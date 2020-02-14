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
import * as cannon from 'cannon'
import { ConnectLogic } from './ConnectLogic'

function createSphere (scene: Scene, position = new Vector3(0, 0, 0)): Mesh {
  const sphere = MeshBuilder.CreateSphere('sphere', { diameter: 0.5 }, scene)
  sphere.position = position
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

  const vrHelper = scene.createDefaultVRExperience()
  vrHelper.enableInteractions()
  const ground = createGround(scene)
  vrHelper.enableTeleportation({ floorMeshes: [ground] })

  createSkybox(scene)

  const hemisphericLight = new HemisphericLight('light1', new Vector3(1, 1, 0), scene)
  const pointLight = new PointLight('light2', new Vector3(0, 1, -1), scene)

  const sphere1 = createSphere(scene, new Vector3(2, 1, 2))
  const sphere2 = createSphere(scene, new Vector3(-2, 1, 2))
  const sphere3 = createSphere(scene, new Vector3(-2, 1, -2))
  const sphere4 = createSphere(scene, new Vector3(2, 1, -2))

  const grabbables: Set<Mesh> = new Set([sphere1, sphere2, sphere3, sphere4])
  const connectLogic = new ConnectLogic(scene, vrHelper, grabbables)

  return scene
}

export function run (): void {
  const canvas = document.getElementById('main-canvas') as HTMLCanvasElement
  const engine = new Engine(canvas, true)
  const scene = createScene(engine)
  engine.runRenderLoop(() => scene.render())
  window.addEventListener('resize', () => engine.resize())
}
