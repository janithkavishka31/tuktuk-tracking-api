const NONE = { id: '__scope_none__' };

function tukTukWhereForUser(user) {
  if (!user) {
    return NONE;
  }

  switch (user.role) {
    case 'SUPER_ADMIN':
      return {};
    case 'PROVINCE_ADMIN':
      if (!user.provinceId) {
        return NONE;
      }
      return { policeStation: { district: { provinceId: user.provinceId } } };
    case 'DISTRICT_ADMIN':
      if (!user.districtId) {
        return NONE;
      }
      return { policeStation: { districtId: user.districtId } };
    case 'STATION_ADMIN':
      if (!user.stationId) {
        return NONE;
      }
      return { policeStationId: user.stationId };
    case 'POLICE':
      if (user.stationId) {
        return { policeStationId: user.stationId };
      }
      if (user.districtId) {
        return { policeStation: { districtId: user.districtId } };
      }
      if (user.provinceId) {
        return { policeStation: { district: { provinceId: user.provinceId } } };
      }
      return NONE;
    default:
      return NONE;
  }
}

function andWhere(scopeWhere, extraWhere) {
  const scopeKeys = Object.keys(scopeWhere);
  const extraKeys = Object.keys(extraWhere || {});

  if (!extraKeys.length) {
    return scopeWhere;
  }

  if (!scopeKeys.length) {
    return extraWhere;
  }

  return { AND: [scopeWhere, extraWhere] };
}

module.exports = {
  NONE,
  andWhere,
  tukTukWhereForUser,
};
