const M = await import("mod");
console.log(M);

import("mod").then((M2) => {
  console.log(M2);
});

export {};
