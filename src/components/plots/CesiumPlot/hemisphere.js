// export const testOutline = {
//   id: 1,
//   nFaces: 1,
//   boresight_Half_Ang: 60,
//   boresight_Half_Ang_Az: 60,
//   boresightEl: 30,
//   Lon: -114.494032,
//   Lat: 32.586538,
//   Alt: 42,
//   max_Range: 150000,
//   minRng: 15000,
//   minEl: 3,
//   maxEl: 50
// };

// export const createOutline = (volume, Cesium) => {
//   var faces = volume.nFaces;
//   var angle = 0;
//   var azimuth = volume.boresight_Half_Ang_Az * faces;
//   var instances = [];
//   var instanceId = 0;
//
//   for (var j = 0; j < faces; j++) {
//     var degree = volume.boresight_Half_Ang;
//     var nAngle = (degree + angle) - (azimuth / 2);
//     if (nAngle > 360) {
//       nAngle = 360 - nAngle;
//     }
//
//     var rotationMatrix = Cesium.Matrix4.fromRotationTranslation(
//             new Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(-nAngle)), // eslint-disable-line
//             new Cesium.Cartesian3(0.0, 0.0, 0.0),
//             new Cesium.Matrix4()
//           );
//     var transformMatrix = Cesium.Matrix4.multiplyByTranslation(
//             Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(volume.Lon, volume.Lat)),
//             new Cesium.Cartesian3(0.0, 0.0, (volume.Alt + volume.boresightEl)),
//             new Cesium.Matrix4()
//           );
//     var modelMatrix = Cesium.Matrix4.multiply(
//             transformMatrix,
//             rotationMatrix,
//             new Cesium.Matrix4()
//           );
//
//     var instance = new Cesium.GeometryInstance({
//       geometry: new Cesium.HemisphereOutlineGeometry({
//         radius: volume.max_Range,
//         minRange: volume.minRng,
//         minEl: volume.minEl,
//         maxEl: volume.maxEl,
//         angleAz: volume.boresight_Half_Ang_Az,
//         stackPartitions: 8,
//         slicePartitions: 8
//       }),
//       modelMatrix: modelMatrix,
//       id: volume.id + instanceId,
//       attributes: {
//         color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.AQUA.withAlpha(0.9)),
//         show: new Cesium.ShowGeometryInstanceAttribute(true)
//       }
//     });
//     instances.push(instance);
//     angle += volume.boresight_Half_Ang_Az;
//     instanceId += 1;
//   }
//
//   return new Cesium.Primitive({
//     geometryInstances: instances,
//     appearance: new Cesium.PerInstanceColorAppearance({
//       flat: true
//     })
//   });
// };

// var nAngle = (sector.maxAz < 0) ? (360 + sector.maxAz) - (degree / 2) : sector.maxAz - (degree / 2);
// if (nAngle > 360) {
//   nAngle = 360 - nAngle;
// }
//
// const degree = sector.boresightAz;

export const createVolume = (antenna, Cesium, type) => {
  const instances = [];
  console.debug(antenna);
  let instanceId = 0;
  for (var i = 0; i < antenna.faces.length; i++) {
    var sector = antenna.faces[i];
    var degree = (sector.minAz < 0) ? sector.maxAz + (-sector.minAz) : Math.abs(sector.maxAz - sector.minAz);
    const nAngle = sector.boresightAz;

    var rotationMatrix = Cesium.Matrix4.fromRotationTranslation(
      new Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(-nAngle)), // eslint-disable-line
      new Cesium.Cartesian3(0.0, 0.0, 0.0),
      new Cesium.Matrix4()
    );
    var transformMatrix = Cesium.Matrix4.multiplyByTranslation(
      Cesium.Transforms.eastNorthUpToFixedFrame(
        Cesium.Cartesian3.fromRadians(antenna.lon, antenna.lat)),
      new Cesium.Cartesian3(0.0, 0.0, 0.0),
      new Cesium.Matrix4()
    );
    var modelMatrix = Cesium.Matrix4.multiply(
      transformMatrix,
      rotationMatrix,
      new Cesium.Matrix4()
    );
    const geometryOptions = {
      radius: antenna.maxRange,
      minRange: antenna.minRange,
      minEl: antenna.minEl,
      maxEl: antenna.maxEl,
      angleAz: degree,
      stackPartitions: degree / 90 * 8,
      slicePartitions: degree / 90 * 8,
      vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL
    };

    let geometry;
    if (type && type === 'outline') {
      geometry = new Cesium.HemisphereOutlineGeometry(geometryOptions);
    } else {
      geometry = new Cesium.HemisphereGeometry(geometryOptions);
    }

    var instance = new Cesium.GeometryInstance({
      geometry,
      modelMatrix: modelMatrix,
      id: antenna.radar_id + i,
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.AQUA.withAlpha(0.3)),
        show: new Cesium.ShowGeometryInstanceAttribute(true)
      }
    });
    instances.push(instance);
    instanceId += 1;
  }

  return new Cesium.Primitive({
    geometryInstances: instances,
    appearance: new Cesium.PerInstanceColorAppearance()
  });
};
