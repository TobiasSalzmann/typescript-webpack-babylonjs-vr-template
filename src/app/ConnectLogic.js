"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var babylonjs_1 = require("babylonjs");
var ConnectLogic = /** @class */ (function () {
    function ConnectLogic(scene, vrHelper, nodes, hand) {
        var _this = this;
        if (hand === void 0) { hand = 'left'; }
        this.scene = scene;
        this.hand = hand;
        this.selectedMesh = null;
        this.startMesh = null;
        this.attractor = null;
        this.line = null;
        this.hl = new babylonjs_1.HighlightLayer('hl', this.scene);
        vrHelper.onNewMeshSelected.add(function (mesh) {
            if (mesh instanceof babylonjs_1.Mesh && nodes.has(mesh)) {
                _this.selectedMesh = mesh;
                _this.hl.addMesh(_this.selectedMesh, babylonjs_1.Color3.Green());
            }
        });
        vrHelper.onSelectedMeshUnselected.add(function () {
            if (_this.selectedMesh != null) {
                _this.hl.removeMesh(_this.selectedMesh);
                _this.selectedMesh = null;
            }
        });
        vrHelper.onControllerMeshLoaded.add(function (webVRController) {
            webVRController.onTriggerStateChangedObservable.add(function (stateObject) {
                if (webVRController.hand === _this.hand) {
                    if (stateObject.value > 0.5) {
                        _this.grabSelectedMesh(webVRController);
                    }
                    else {
                        if (_this.startMesh != null) {
                            _this.ungrabMesh(webVRController);
                        }
                    }
                }
            });
        });
        scene.onBeforeRenderObservable.add(function () {
            if (_this.line != null) {
                _this.line.dispose();
                _this.line = null;
            }
            if (_this.startMesh == null || _this.attractor == null) {
                return;
            }
            _this.line = babylonjs_1.MeshBuilder.CreateLines('line', {
                points: [
                    _this.attractor.absolutePosition,
                    _this.startMesh.absolutePosition
                ]
            }, _this.scene);
        });
    }
    ConnectLogic.prototype.ungrabMesh = function (webVRController) {
        if (webVRController.mesh == null || this.attractor == null) {
            return;
        }
        if (this.selectedMesh != null && this.startMesh != null && this.selectedMesh !== this.startMesh) {
            this.drawArrow(this.startMesh, this.selectedMesh);
        }
        this.attractor.dispose();
        this.attractor = null;
        this.startMesh = null;
    };
    ConnectLogic.prototype.grabSelectedMesh = function (webVRController) {
        if (webVRController.mesh == null || this.selectedMesh == null || this.startMesh != null) {
            return;
        }
        var pickingInfo = webVRController.getForwardRay().intersectsMesh(this.selectedMesh);
        if (pickingInfo.pickedPoint == null) {
            return;
        }
        this.attractor = babylonjs_1.MeshBuilder.CreateSphere('attractor', { diameter: 0.05 }, this.scene);
        this.attractor.setAbsolutePosition(pickingInfo.pickedPoint);
        webVRController.mesh.addChild(this.attractor);
        this.attractor.position = new babylonjs_1.Vector3(0, 0, this.attractor.position.z);
        this.startMesh = this.selectedMesh;
    };
    ConnectLogic.prototype.drawArrow = function (a, b) {
        babylonjs_1.MeshBuilder.CreateLines('line', {
            points: [
                a.absolutePosition,
                b.absolutePosition
            ]
        }, this.scene);
    };
    return ConnectLogic;
}());
exports.ConnectLogic = ConnectLogic;
