
export const getIds = (data) => {
  let ids = new Set();
  data.map((row) => ids.add(row.get('id')));
  return ids;
};

export const countAirThreats = (data) => {
  return data.filter((row) => {
    return row.get('objType') === 'AIRBREATHER';
  }).size;
};
