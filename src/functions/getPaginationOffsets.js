const getPaginationOffsets = (total_listings, offset) => {
  if (total_listings > 10000) {
    total_listings = 9900;
  }
  const length = Math.floor(total_listings / offset) + 1;
  return [...Array(length).keys()].map(v => {
    return v * offset;
  });
};
module.exports = getPaginationOffsets;
