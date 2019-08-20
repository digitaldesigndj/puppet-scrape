const getPaginationOffsets = (total_listings, offset) => {
  const length = Math.floor(total_listings / offset) + 1;
  return [...Array(length).keys()].map(v => {
    return v * offset;
  });
};
console.log(getPaginationOffsets(2423, 100));
