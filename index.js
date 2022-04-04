import * as Cesium from "cesium";
import { Viewer } from "cesium";
import "./main.css";

Cesium.Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5ZjhiMDU1Yy03MzFiLTQ1MTUtOGQwNS1kMzg2NGNiMjIwOGIiLCJpZCI6ODY2MjgsImlhdCI6MTY0ODAyNTc1OX0.d3rT6BrG2lJVobzS0twNXM2CjoR-uEndThbVXuoHGA0";

const viewer = new Viewer("cesiumContainer", {
  animation: false,
  timeline: false,
  terrainProvider: Cesium.IonResource.fromAssetId(1),
});
viewer.scene.globe.depthTestAgainstTerrain = true;

const tileset = viewer.scene.primitives.add(
  new Cesium.Cesium3DTileset({
    url: Cesium.IonResource.fromAssetId(888006),
  })
);

console.log(Cesium.IonResource.fromAssetId(888006));
(async () => {
  try {
    await tileset.readyPromise;
    await viewer.zoomTo(tileset);

    // Apply the default style if it exists
    var extras = tileset.asset.extras;
    if (
      Cesium.defined(extras) &&
      Cesium.defined(extras.ion) &&
      Cesium.defined(extras.ion.defaultStyle)
    ) {
      tileset.style = new Cesium.Cesium3DTileStyle(extras.ion.defaultStyle);
    }
    console.log("berhasil");
  } catch (error) {
    console.log(error);
  }
})();

// add button to map
const button = document.createElement("button");
// give fixed style to button
button.style.position = "absolute";
button.style.top = "10px";
button.style.left = "10px";
button.style.zIndex = "100";
button.style.backgroundColor = "white";
button.style.border = "1px solid black";
button.style.padding = "10px";
button.style.borderRadius = "5px";
button.style.cursor = "pointer";

button.innerHTML = "Toggle 3D Tiles";
button.onclick = () => {
  tileset.show = !tileset.show;
};
const container = document.getElementById("cesiumContainer");
container.appendChild(button);

function createModel(url, name) {
  viewer.entities.removeAll();

  const position = Cesium.Cartesian3.fromDegrees(
    106.9431442408,
    -6.1472079802,
    11.1963280253
  );

  const heading = Cesium.Math.toRadians(135);
  const pitch = 0;
  const roll = 0;
  const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(
    position,
    hpr
  );

  const entity = viewer.entities.add({
    name: name,
    position: position,
    orientation: orientation,
    model: {
      uri: url,
      minimumPixelSize: 128,
      maximumScale: 20000,
    },
  });

  viewer.trackedEntity = entity;
}

// create second button
const button2 = document.createElement("button");
// give fixed style to button
button2.style.position = "absolute";
button2.style.top = "60px";
button2.style.left = "10px";
button2.style.zIndex = "100";
button2.style.backgroundColor = "white";
button2.style.border = "1px solid black";
button2.style.padding = "10px";
button2.style.borderRadius = "5px";
button2.style.cursor = "pointer";

button2.innerHTML = "add models";
button2.onclick = () => {
  createModel("./Assets/mammoth.glb", 2000);
};

container.appendChild(button2);

const options = [
  {
    text: "Aircraft",
    onselect: function () {
      createModel("./Assets/jembatan.fbx", 5000.0);
    },
  },
];

const clipObjects = ['mammoth', 'jembatan'];
const viewModel = {
  debugBoundingVolumesEnabled: false,
  edgeStylingEnabled: true,
  exampleTypes: clipObjects,
  selectedExampleType: clipObjects[0],
}

let targetY = 0.0;
let planeEntities = [];
var selectedPlane;
let clippingPlanes;

const downHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

downHandler.setInputAction(function (movement) {
  const pickedObject = viewer.scene.pick(movement.position);
  if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.plane) {
    selectedPlane = pickedObject.id.plane;
    selectedPlane.material = Cesium.Color.RED.withAlpha(0.5);
    selectedPlane.outlineColor = Cesium.Color.RED;
    selectedPlane.outlineWidth = 2;
    viewer.scene.screenSpaceCameraController.enableInputs = false;
  }
}, Cesium.ScreenSpaceEventType.LEFT_DOWN);

const upHandler = new Cesium.ScreenSpaceEventHandler(
  viewer.scene.canvas
);
upHandler.setInputAction(function () {
  if (Cesium.defined(selectedPlane)) {
    selectedPlane.material = Cesium.Color.WHITE.withAlpha(0.1);
    selectedPlane.outlineColor = Cesium.Color.WHITE;
    selectedPlane = undefined;
  }

  scene.screenSpaceCameraController.enableInputs = true;
}, Cesium.ScreenSpaceEventType.LEFT_UP);

const moveHandler = new Cesium.ScreenSpaceEventHandler(
  viewer.scene.canvas
);
moveHandler.setInputAction(function (movement) {
  if (Cesium.defined(selectedPlane)) {
    const deltaY = movement.startPosition.y - movement.endPosition.y;
    targetY += deltaY;
  }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

function createPlaneUpdateFunction(plane) {
  return function () {
    plane.distance = targetY;
    return plane;
  };
}
loadTileset();
function loadTileset(url) {
  clippingPlanes = new Cesium.ClippingPlaneCollection({
    planes: [
      new Cesium.ClippingPlane(
        new Cesium.Cartesian3(0.0, 0.0, -1.0),
        0.0
      ),
    ],
    edgeWidth: viewModel.edgeStylingEnabled ? 1.0 : 0.0,
  });

  tileset = viewer.scene.primitives.add(
    new Cesium.Cesium3DTileset({
      url: url,
      clippingPlanes: clippingPlanes,
    })
  );

  tileset.debugShowBoundingVolume =
    viewModel.debugBoundingVolumesEnabled;
  return tileset.readyPromise
    .then(function () {
      const boundingSphere = tileset.boundingSphere;
      const radius = boundingSphere.radius;

      viewer.zoomTo(
        tileset,
        new Cesium.HeadingPitchRange(0.5, -0.2, radius * 4.0)
      );

      if (
        !Cesium.Matrix4.equals(
          tileset.root.transform,
          Cesium.Matrix4.IDENTITY
        )
      ) {
        // The clipping plane is initially positioned at the tileset's root transform.
        // Apply an additional matrix to center the clipping plane on the bounding sphere center.
        const transformCenter = Cesium.Matrix4.getTranslation(
          tileset.root.transform,
          new Cesium.Cartesian3()
        );
        const transformCartographic = Cesium.Cartographic.fromCartesian(
          transformCenter
        );
        const boundingSphereCartographic = Cesium.Cartographic.fromCartesian(
          tileset.boundingSphere.center
        );
        const height =
          boundingSphereCartographic.height -
          transformCartographic.height;
        clippingPlanes.modelMatrix = Cesium.Matrix4.fromTranslation(
          new Cesium.Cartesian3(0.0, 0.0, height)
        );
      }

      for (let i = 0; i < clippingPlanes.length; ++i) {
        const plane = clippingPlanes.get(i);
        const planeEntity = viewer.entities.add({
          position: boundingSphere.center,
          plane: {
            dimensions: new Cesium.Cartesian2(
              radius * 2.5,
              radius * 2.5
            ),
            material: Cesium.Color.WHITE.withAlpha(0.1),
            plane: new Cesium.CallbackProperty(
              createPlaneUpdateFunction(plane),
              false
            ),
            outline: true,
            outlineColor: Cesium.Color.WHITE,
          },
        });

        planeEntities.push(planeEntity);
      }
      return tileset;
    })
    .otherwise(function (error) {
      console.log(error);
    });
}