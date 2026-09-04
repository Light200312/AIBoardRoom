// Concatenate truthy class names into a single class string.
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
export {
  cn
};
