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
    const objType = row.get('objType') || row.get('objectType');

    // keep list of ids
    ids = ids.add(row.get('id'));

    // get radar inits
    if (row.get('type') === 'antenna') {
      radars = radars.add(row.get('radar_id'));
    }
    types = types.add(row.get('type'));

    // get ram and air
    if (objType === 'AIRBREATHER') {
      airThreats = airThreats.add(row.get('id'));
    } else if (objType === 'BALLISTIC') {
      ramThreats = ramThreats.add(row.get('id'));
    }
  });

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
