export const install = async (db, gardenId) => {
  console.log(`HELLO FROM INSIDE THE ZIP PACKAGE! I am configuring garden ${gardenId}!`);
  // You can run any database commands against 'db' here!
};
export const uninstall = async (db, gardenId) => {
  console.log(`Goodbye! Scrubbing data for ${gardenId}...`);
};
