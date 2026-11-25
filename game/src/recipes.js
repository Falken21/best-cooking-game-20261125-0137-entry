// Copper Pan Diner — the menu: ingredients on the counter and the dishes
// the tickets ask for. An ingredient with a `cook` station cannot go on the
// plate raw: it grills or fries first. A recipe is a multiset of ingredient
// ids (order on the plate is the player's own), a vessel, a price in coins
// and the first day it can be ordered.

export const INGREDIENTS = [
  { id: 'bun',    name: 'Bun',      key: '1', cook: null },
  { id: 'patty',  name: 'Patty',    key: '2', cook: 'grill' },
  { id: 'cheese', name: 'Cheese',   key: '3', cook: null },
  { id: 'lettuce', name: 'Lettuce', key: '4', cook: null },
  { id: 'tomato', name: 'Tomato',   key: '5', cook: null },
  { id: 'egg',    name: 'Egg',      key: '6', cook: 'grill' },
  { id: 'bacon',  name: 'Bacon',    key: '7', cook: 'grill' },
  { id: 'potato', name: 'Potato',   key: '8', cook: 'fryer' },
  { id: 'greens', name: 'Greens',   key: '9', cook: null },
  { id: 'bread',  name: 'Toast',    key: '0', cook: null },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((item) => [item.id, item]));

/** How many of `id` a list of ingredient ids holds. */
export function countOf(list, id) {
  let total = 0;
  for (const entry of list) if (entry === id) total += 1;
  return total;
}

/** True when two ingredient lists hold the same items the same number of times. */
export function sameDish(a, b) {
  if (a.length !== b.length) return false;
  for (const item of INGREDIENTS) {
    if (countOf(a, item.id) !== countOf(b, item.id)) return false;
  }
  return true;
}

export const RECIPES = [
  {
    id: 'copper-burger', name: 'Copper Burger', vessel: 'plate', price: 12, day: 1,
    items: ['bun', 'patty', 'cheese', 'bun'],
  },
  {
    id: 'garden-burger', name: 'Garden Burger', vessel: 'plate', price: 13, day: 1,
    items: ['bun', 'patty', 'lettuce', 'tomato', 'bun'],
  },
  {
    id: 'sunrise-burger', name: 'Sunrise Burger', vessel: 'plate', price: 15, day: 1,
    items: ['bun', 'egg', 'bacon', 'bun'],
  },
  {
    id: 'green-bowl', name: 'Green Bowl Salad', vessel: 'bowl', price: 14, day: 2,
    items: ['greens', 'greens', 'tomato', 'egg', 'cheese'],
  },
  {
    id: 'club-melt', name: 'Club Melt', vessel: 'plate', price: 16, day: 2,
    items: ['bread', 'bacon', 'egg', 'cheese', 'bread'],
  },
  {
    id: 'loaded-fries', name: 'Loaded Fries', vessel: 'plate', price: 13, day: 3,
    items: ['potato', 'cheese', 'bacon'],
  },
  {
    id: 'double-stack', name: 'Double Stack', vessel: 'plate', price: 19, day: 3,
    items: ['bun', 'patty', 'cheese', 'patty', 'cheese', 'bun'],
  },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((recipe) => [recipe.id, recipe]));

/** The recipes a given day's customers may order. */
export function recipesForDay(day) {
  return RECIPES.filter((recipe) => recipe.day <= day);
}
