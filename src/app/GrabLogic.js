"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var babylonjs_1 = require("babylonjs");
var GrabLogic = /** @class */ (function () {
    function GrabLogic(scene, vrHelper, grabbables) {
        var _this = this;
        this.selectedMesh = null;
        this.grabbedMesh = null;
        this.currentPos = null;
        this.currentVelocity = babylonjs_1.Vector3.Zero();
        this.currentTime = null;
        this.grabbables = grabbables;
        this.hl = new babylonjs_1.HighlightLayer('hl', scene);
        scene.onBeforePhysicsObservable.add(function () {
            if (_this.grabbedMesh != null) {
                var time = Date.now() / 1000;
                var pos = _this.grabbedMesh.getAbsolutePosition().clone();
                if (_this.currentPos != null && _this.currentTime != null && (time - _this.currentTime) > 0.1) {
                    var dt = time - _this.currentTime;
                    _this.currentVelocity = pos.subtract(_this.currentPos).scale(1 / dt);
                }
                if (_this.currentPos == null || _this.currentTime == null || (time - _this.currentTime) > 0.1) {
                    _this.currentPos = pos;
                    _this.currentTime = time;
                }
            }
        });
        vrHelper.onNewMeshSelected.add(function (mesh) {
            if (mesh instanceof babylonjs_1.Mesh) {
                _this.selectedMesh = mesh;
            }
        });
        vrHelper.onSelectedMeshUnselected.add(function () {
            _this.selectedMesh = null;
        });
        vrHelper.onControllerMeshLoaded.add(function (webVRController) {
            webVRController.onTriggerStateChangedObservable.add(function (stateObject) {
                if (webVRController.hand === 'left') {
                    if (stateObject.value > 0.5) {
                        _this.grabSelectedMesh(webVRController);
                    }
                    else {
                        _this.ungrabMesh(webVRController);
                    }
                }
            });
        });
    }
    GrabLogic.prototype.ungrabMesh = function (webVRController) {
        if (webVRController.mesh != null && this.grabbedMesh != null) {
            webVRController.mesh.removeChild(this.grabbedMesh);
            if (this.grabbedMesh.physicsImpostor != null) {
                this.grabbedMesh.physicsImpostor.wakeUp();
                this.grabbedMesh.physicsImpostor.setLinearVelocity(this.currentVelocity);
            }
            this.hl.removeMesh(this.grabbedMesh);
            this.grabbedMesh = null;
        }
    };
    GrabLogic.prototype.grabSelectedMesh = function (webVRController) {
        if (webVRController.mesh != null && this.selectedMesh != null && this.grabbables.has(this.selectedMesh)) {
            this.grabbedMesh = this.selectedMesh;
            webVRController.mesh.addChild(this.grabbedMesh);
            if (this.grabbedMesh.physicsImpostor != null) {
                this.grabbedMesh.physicsImpostor.sleep();
            }
            this.hl.addMesh(this.grabbedMesh, babylonjs_1.Color3.Green());
        }
    };
    return GrabLogic;
}());
exports.GrabLogic = GrabLogic;
