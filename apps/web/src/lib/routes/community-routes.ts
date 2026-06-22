export const COMMUNITY_ROUTES = {
  landing: "/",
  login: "/login",
  home: "/home",
  featured: "/featured",
  discussions: "/discussions",
  newDiscussion: "/discussions/new",
  publish: "/publish",
  me: "/me",
  canvasEntry: "/canvas"
} as const;

export const COMMUNITY_CANVAS_ENTRY_URL = "https://dz-ailab-stage.dzkjm.cn/marketcanvas/";

export const COMMUNITY_INTERNAL_ROUTES = {
  index: "/internal",
  seedance: "/internal/seedance",
  nanoBanana: "/internal/nano-banana",
  devSmoke: "/internal/dev/smoke"
} as const;

export function creatorRoute(creatorId: string) {
  return `/creators/${creatorId}`;
}

export function videoRoute(videoId: string) {
  return `/videos/${videoId}`;
}

export function workflowRoute(workflowId: string) {
  return `/workflows/${workflowId}`;
}

export function discussionRoute(slug: string) {
  return `/discussions/${slug}`;
}

export function canvasRuntimeRoute(runtimeId: string) {
  return `/canvas/${runtimeId}`;
}

export const FORMAL_COMMUNITY_ROUTE_SURFACES = [
  COMMUNITY_ROUTES.landing,
  COMMUNITY_ROUTES.home,
  COMMUNITY_ROUTES.featured,
  COMMUNITY_ROUTES.discussions,
  COMMUNITY_ROUTES.newDiscussion,
  COMMUNITY_ROUTES.publish,
  COMMUNITY_ROUTES.login,
  COMMUNITY_ROUTES.me,
  "/videos/[id]",
  "/workflows/[id]",
  "/discussions/[slug]",
  "/creators/[id]",
  "/canvas/[runtimeId]"
] as const;

export const INTERNAL_COMMUNITY_ROUTE_SURFACES = [
  COMMUNITY_INTERNAL_ROUTES.index,
  COMMUNITY_INTERNAL_ROUTES.seedance,
  COMMUNITY_INTERNAL_ROUTES.nanoBanana,
  COMMUNITY_INTERNAL_ROUTES.devSmoke
] as const;
