/** Prefix for GitHub Pages project sites. Local dev stays at /. */
export function appBasePath(): string {
  return (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
}

/** Turn a browser path into an app route such as /login. */
export function toAppPath(pathname: string): string {
  const base = appBasePath();
  let path = pathname || '/';
  if (base && (path === base || path.startsWith(`${base}/`))) {
    path = path.slice(base.length) || '/';
  }
  path = path.replace(/\/index\.html$/, '') || '/';
  path = path.replace(/\/+$/, '') || '/';
  return path;
}

/** Turn an app route into the path the host should show. */
export function fromAppPath(path: string): string {
  const base = appBasePath();
  if (!base) return path;
  if (path === '/') return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Public files copied from /public, including the GitHub Pages prefix. */
export function publicPath(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${path.replace(/^\//, '')}`;
}
