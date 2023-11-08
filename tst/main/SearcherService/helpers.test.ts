import { findAllMatches } from "@main/services/SearcherService/helpers";

test("findAllMatches basic case", () => {
  const res = findAllMatches("haha", ["a"]);
  expect(res.numUniqueMatches).toBe(1);
  expect(res.matchIndices.length).toBe(2);
  expect(res.matchIndices).toEqual([
    [3, 4],
    [1, 2],
  ]);
});

test("findAllMatches overlaps merged correctly", () => {
  const res1 = findAllMatches("unknown brown guy", ["unknown", "own", "guy"]);
  expect(res1.numUniqueMatches).toBe(3);
  expect(res1.matchIndices.length).toBe(3);
  expect(res1.matchIndices).toEqual([
    [14, 17],
    [10, 13],
    [0, 7],
  ]);

  const res2 = findAllMatches("Letraset sheets", ["sheets", "s"]);
  expect(res2.numUniqueMatches).toBe(2);
  expect(res2.matchIndices.length).toBe(2);
  expect(res2.matchIndices).toEqual([
    [9, 15],
    [5, 6],
  ]);
});
