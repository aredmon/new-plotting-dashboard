import {
  Set
} from 'immutable';

const getSummaryMetrics = (data) => {
  let ids = new Set();
  let airThreats = new Set();
  let ramThreats = new Set();
  let types = new Set();
  let radars = new Set();

  data.forEach((row) => {
    if (row.has('id')) {
      ids = ids.add(row.get('id'));
    }
    if (row.has('type')) {
      if (row.get('type') === 'radarInit') {
        radars = radars.add(row.get('radarId'));
      }
      // else if (row.get('type') === 'track') {
      //   if (row.has('isRAM')) {
      //     if (row.get('isRAM') === 'true') {
      //       ramThreats = ramThreats.add(row.get('id'));
      //     } else {
      //       airThreats = airThreats.add(row.get('id'));
      //     }
      //   }
      // }
      // console.debug('redmon test 5');
      types = types.add(row.get('type'));
    }
    if (row.has('objType')) {
      if (row.get('objType') === 'AIRBREATHER') {
        airThreats = airThreats.add(row.get('id'));
      } else if (row.get('objType') === 'BALLISTIC') {
        ramThreats = ramThreats.add(row.get('id'));
      }
    }
  });
  console.debug(radars);
  return ({
    trackIds: ids.sort(),
    airThreats: airThreats,
    ramThreats: ramThreats,
    radars: radars.sort(),
    time: 0,
    avgTqVel: 0,
    avgTzPos: 0
  });
};

export default getSummaryMetrics;
