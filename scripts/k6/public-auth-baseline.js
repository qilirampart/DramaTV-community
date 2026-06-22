import { browseAuthenticatedPages, login } from "./public-auth-shared.js";

export const options = {
  stages: [{ duration: "1m", target: 1 }],
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    http_req_failed: ["rate<0.005"],
  },
};

export function setup() {
  return login();
}

export default function (session) {
  browseAuthenticatedPages(session);
}
