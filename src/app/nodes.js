"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var babylonjs_1 = require("babylonjs");
var ConnectLogic_1 = require("./ConnectLogic");
function createSphere(scene, position) {
    if (position === void 0) { position = new babylonjs_1.Vector3(0, 0, 0); }
    var sphere = babylonjs_1.MeshBuilder.CreateSphere('sphere', { diameter: 0.5 }, scene);
    sphere.position = position;
    return sphere;
}
function createGround(scene) {
    var numberOfTiles = 20;
    var ground = babylonjs_1.MeshBuilder.CreateGround('ground', { height: 40, width: 40, subdivisions: numberOfTiles }, scene);
    var material = new babylonjs_1.StandardMaterial('groundMaterial', scene);
    var texture = new babylonjs_1.Texture('resources/textures/floor/floor.png', scene);
    var bumpTexture = new babylonjs_1.Texture('resources/textures/floor/floor_bump.png', scene);
    texture.uScale = numberOfTiles;
    texture.vScale = numberOfTiles;
    bumpTexture.uScale = numberOfTiles;
    bumpTexture.vScale = numberOfTiles;
    material.diffuseTexture = texture;
    material.bumpTexture = bumpTexture;
    material.useParallax = true;
    material.useParallaxOcclusion = true;
    material.parallaxScaleBias = 0.1;
    material.specularPower = 1000.0;
    material.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    ground.material = material;
    return ground;
}
function createSkybox(scene) {
    var skybox = babylonjs_1.Mesh.CreateBox('skyBox', 1000, scene);
    skybox.isPickable = false;
    var skyboxMaterial = new babylonjs_1.StandardMaterial('skyBoxMaterial', scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new babylonjs_1.CubeTexture('resources/textures/cube/MilkyWay/dark-s', scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = babylonjs_1.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new babylonjs_1.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new babylonjs_1.Color3(0, 0, 0);
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;
    return skybox;
}
function createScene(engine) {
    var scene = new babylonjs_1.Scene(engine);
    var vrHelper = scene.createDefaultVRExperience();
    vrHelper.enableInteractions();
    var ground = createGround(scene);
    vrHelper.enableTeleportation({ floorMeshes: [ground] });
    createSkybox(scene);
    var hemisphericLight = new babylonjs_1.HemisphericLight('light1', new babylonjs_1.Vector3(1, 1, 0), scene);
    var pointLight = new babylonjs_1.PointLight('light2', new babylonjs_1.Vector3(0, 1, -1), scene);
    var sphere1 = createSphere(scene, new babylonjs_1.Vector3(2, 1, 2));
    var sphere2 = createSphere(scene, new babylonjs_1.Vector3(-2, 1, 2));
    var sphere3 = createSphere(scene, new babylonjs_1.Vector3(-2, 1, -2));
    var sphere4 = createSphere(scene, new babylonjs_1.Vector3(2, 1, -2));
    var grabbables = new Set([sphere1, sphere2, sphere3, sphere4]);
    var connectLogic = new ConnectLogic_1.ConnectLogic(scene, vrHelper, grabbables);
    return scene;
}
function run() {
    var canvas = document.getElementById('main-canvas');
    var engine = new babylonjs_1.Engine(canvas, true);
    var scene = createScene(engine);
    engine.runRenderLoop(function () { return scene.render(); });
    window.addEventListener('resize', function () { return engine.resize(); });
}
exports.run = run;
