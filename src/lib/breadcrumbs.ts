const titleize = (segment: string) =>
  segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const buildBreadcrumbItems = (path: string) => {
  const segments = path.split("/").filter(Boolean);

  const crumbs = [{ name: "Home", item: "/" }];

  let accumulated = "";
  for (const segment of segments) {
    accumulated += `/${segment}`;
    crumbs.push({ name: titleize(segment), item: accumulated });
  }

  return crumbs;
};
