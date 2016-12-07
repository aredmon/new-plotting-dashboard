import {
  Set, Map
} from 'immutable';

const getSummaryMetrics = (data) => {
  let ids = new Set();
  let airThreats = new Set();
  let ramThreats = new Set();
  let types = new Set();
  let radars = new Set();
  let tracks = new Map();

  data.forEach((row) => {
    const objType = row.get('objType') || row.get('objectType');
    const id = row.get('id');
    // keep list of ids
    ids = ids.add(id);

    // get radar inits
    if (row.get('type') === 'antenna') {
      radars = radars.add(row.get('radar_id'));
    }
    types = types.add(row.get('type'));

    // get ram and air truths
    if (row.get('type') === 'truth') {
      if (objType === 'AIRBREATHER') {
        airThreats = airThreats.add(id);
      } else if (objType === 'BALLISTIC') {
        ramThreats = ramThreats.add(id);
      }
    }

    if (row.get('type') === 'track') {
      tracks = tracks.set(id, row);
    }
  });

  return ({
    trackIds: ids.sort(),
    airThreats: airThreats,
    ramThreats: ramThreats,
    tracks: tracks,
    radars: radars.sort(),
    time: 0,
    avgTqVel: 0,
    avgTzPos: 0
  });
};

export default getSummaryMetrics;
