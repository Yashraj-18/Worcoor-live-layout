// @ts-nocheck
import locationData from '@/lib/warehouse/data/layoutComponentsMock.json';

export const getAllLocations = () => {
  return locationData.locations || [];
};

export const getLocationById = (id) => {
  return locationData.locations.find(loc => loc.location_id === id);
};
