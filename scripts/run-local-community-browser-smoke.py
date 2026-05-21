import argparse
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Optional

from playwright.sync_api import sync_playwright


DEFAULT_FRONTEND_BASE_URL = "http://127.0.0.1:3106"
DEFAULT_BACKEND_BASE_URL = "http://127.0.0.1:18080"
DEFAULT_CREATOR_USERNAME = "creator-a"
DEFAULT_CREATOR_PASSWORD = "dramatv-local-dev"
DEFAULT_CANVAS_RUNTIME_ID = "7dab4890-96de-42f3-a089-8311dcc04aa5"
DEFAULT_CHROMIUM_EXECUTABLE = Path.home() / "AppData/Local/ms-playwright/chromium-1208/chrome-win64/chrome.exe"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run local DramaTV browser smoke tests.")
    parser.add_argument("--frontend-base-url", default=DEFAULT_FRONTEND_BASE_URL)
    parser.add_argument("--backend-base-url", default=DEFAULT_BACKEND_BASE_URL)
    parser.add_argument("--creator-username", default=DEFAULT_CREATOR_USERNAME)
    parser.add_argument("--creator-password", default=DEFAULT_CREATOR_PASSWORD)
    parser.add_argument("--canvas-runtime-id", default=DEFAULT_CANVAS_RUNTIME_ID)
    parser.add_argument("--chromium-executable", default=str(DEFAULT_CHROMIUM_EXECUTABLE))
    parser.add_argument("--headed", action="store_true")
    parser.add_argument("--slow-mo-ms", type=int, default=250)
    parser.add_argument("--output", default="")
    parser.add_argument("--artifacts-dir", default="artifacts/browser-smoke")
    return parser.parse_args()


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def append_result(results: list[dict], name: str, passed: bool, detail: str, artifact: Optional[str] = None) -> None:
    entry = {
        "name": name,
        "passed": passed,
        "detail": detail,
    }
    if artifact:
        entry["artifact"] = artifact
    results.append(entry)


def backend_login(backend_base_url: str, username: str, password: str) -> str:
    request = urllib.request.Request(
        f"{backend_base_url}/api/auth/login",
        data=json.dumps(
            {
                "loginType": "password",
                "username": username,
                "password": password,
            }
        ).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"backend login failed: status={error.code}") from error

    access_token = payload.get("data", {}).get("accessToken")
    assert_true(isinstance(access_token, str) and access_token, "backend login missing accessToken")
    return access_token


def take_screenshot(page, artifacts_dir: Path, name: str) -> str:
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    path = artifacts_dir / f"{name}.png"
    page.screenshot(path=str(path), full_page=True)
    return str(path)


def body_text(page, limit: int = 2400) -> str:
    return page.locator("body").inner_text(timeout=10_000)[:limit]


def goto(page, url: str, wait_until: str = "domcontentloaded", pause_ms: int = 1200) -> None:
    page.goto(url, wait_until=wait_until, timeout=60_000)
    page.wait_for_timeout(pause_ms)


def normalize_text(value: str) -> str:
    return value.replace("\r\n", "\n").replace("\r", "\n")


def count_notification_requests(page) -> int:
    return page.evaluate(
        """
        () => performance
          .getEntriesByType('resource')
          .filter((entry) => String(entry.name || '').includes('/api/me/notifications/recent'))
          .length
        """
    )


def run_case(results: list[dict], name: str, fn, page=None, artifacts_dir: Optional[Path] = None) -> None:
    try:
        detail = fn()
        append_result(results, name, True, detail)
    except Exception as error:  # noqa: BLE001
        artifact = None
        if page is not None and artifacts_dir is not None:
            try:
                artifact = take_screenshot(page, artifacts_dir, name.replace(".", "-"))
            except Exception:  # noqa: BLE001
                artifact = None
        append_result(results, name, False, str(error), artifact)


def main() -> int:
    args = parse_args()
    frontend_base_url = args.frontend_base_url.rstrip("/")
    backend_base_url = args.backend_base_url.rstrip("/")
    canvas_route = f"/canvas/{args.canvas_runtime_id}"
    protected_routes = [
        "/home",
        "/featured",
        "/discussions",
        "/publish",
        "/me",
        "/discussions/new",
        canvas_route,
    ]
    artifacts_dir = Path(args.artifacts_dir) / "latest"
    results: list[dict] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=not args.headed,
            slow_mo=args.slow_mo_ms if args.headed else 0,
            executable_path=args.chromium_executable,
        )

        anonymous_context = browser.new_context(viewport={"width": 1440, "height": 960})
        anonymous_page = anonymous_context.new_page()

        def anonymous_root() -> str:
            goto(anonymous_page, f"{frontend_base_url}/", wait_until="networkidle", pause_ms=1500)
            text = body_text(anonymous_page)
            assert_true("Drama TV" in text, "public root missing brand text")
            assert_true("Get Inspired with Us." in text, "public root missing hero text")
            return f"url={anonymous_page.url}"

        run_case(results, "public.root", anonymous_root, anonymous_page, artifacts_dir)

        for route in protected_routes:

            def make_protected_route_case(expected_route: str):
                def case() -> str:
                    goto(anonymous_page, f"{frontend_base_url}{expected_route}", wait_until="networkidle", pause_ms=800)
                    expected_redirect = f"{frontend_base_url}/login?redirectTo={urllib.parse.quote(expected_route, safe='')}"
                    assert_true(
                        anonymous_page.url == expected_redirect,
                        f"expected redirect to {expected_redirect} but got {anonymous_page.url}",
                    )
                    return anonymous_page.url

                return case

            case_name = f"public.redirect.{route.strip('/').replace('/', '-') or 'root'}"
            run_case(results, case_name, make_protected_route_case(route), anonymous_page, artifacts_dir)

        def login_form_flow() -> str:
            goto(
                anonymous_page,
                f"{frontend_base_url}/login?redirectTo=%2Fhome",
                wait_until="networkidle",
                pause_ms=1000,
            )
            inputs = anonymous_page.locator("input")
            assert_true(inputs.count() >= 2, "login page missing username/password inputs")
            inputs.nth(0).fill(args.creator_username)
            inputs.nth(1).fill(args.creator_password)
            anonymous_page.locator('button[type="submit"]').click()
            anonymous_page.wait_for_url(re.compile(rf"^{re.escape(frontend_base_url)}/home(?:[/?#].*)?$"), timeout=20_000)
            anonymous_page.wait_for_timeout(2000)
            text = body_text(anonymous_page)
            assert_true("Rina Flux" in text, "post-login home missing creator name")
            return f"url={anonymous_page.url}"

        run_case(results, "auth.login-form", login_form_flow, anonymous_page, artifacts_dir)
        anonymous_context.close()

        access_token = backend_login(backend_base_url, args.creator_username, args.creator_password)
        authenticated_context = browser.new_context(viewport={"width": 1440, "height": 960})
        authenticated_context.add_cookies(
            [
                {
                    "name": "dramatv_access_token",
                    "value": access_token,
                    "domain": "127.0.0.1",
                    "path": "/",
                    "httpOnly": False,
                    "sameSite": "Lax",
                }
            ]
        )
        authenticated_page = authenticated_context.new_page()

        authenticated_routes = [
            ("/home", ["Rina Flux", "灵感迸发", "进入无限画布"]),
            ("/featured", ["Rina Flux", "视频提示词"]),
            ("/discussions", ["发起讨论", "本周创作交流：你最近在试什么镜头？"]),
            ("/me", ["AI video director", "作品"]),
            ("/publish", ["发布内容", "视频提示词"]),
            ("/discussions/new", ["发起一篇值得讨论的帖子", "Markdown", "发布帖子"]),
            (canvas_route, ["Canvas Runtime", "Ready"]),
        ]

        for route, markers in authenticated_routes:

            def make_authenticated_case(expected_route: str, expected_markers: list[str]):
                def case() -> str:
                    goto(authenticated_page, f"{frontend_base_url}{expected_route}", wait_until="domcontentloaded", pause_ms=1800)
                    assert_true(
                        authenticated_page.url.startswith(f"{frontend_base_url}{expected_route}"),
                        f"expected auth route {expected_route} but got {authenticated_page.url}",
                    )
                    text = normalize_text(body_text(authenticated_page))
                    for marker in expected_markers:
                        assert_true(marker in text, f"route {expected_route} missing marker {marker!r}")
                    return authenticated_page.url

                return case

            case_name = f"auth.route.{route.strip('/').replace('/', '-') or 'root'}"
            run_case(results, case_name, make_authenticated_case(route, markers), authenticated_page, artifacts_dir)

        def notification_bell() -> str:
            goto(authenticated_page, f"{frontend_base_url}/home", wait_until="domcontentloaded", pause_ms=1800)
            before_count = count_notification_requests(authenticated_page)
            authenticated_page.locator(".notification-bell-trigger").click()
            panel = authenticated_page.locator(".notification-bell-panel")
            panel.wait_for(timeout=10_000)
            authenticated_page.wait_for_timeout(1200)
            after_count = count_notification_requests(authenticated_page)
            panel_text = normalize_text(panel.inner_text(timeout=10_000))
            assert_true(
                ("最近互动" in panel_text)
                or ("还没有新的互动" in panel_text)
                or ("赞了你的" in panel_text)
                or ("收藏了你的" in panel_text)
                or ("评论了你的" in panel_text)
                or ("回复了你的评论" in panel_text),
                "notification panel missing title or expected content",
            )
            request_delta = after_count - before_count
            assert_true(
                request_delta <= 2,
                f"notification refresh expected at most 2 new requests but got {request_delta}",
            )
            return f"requestDelta={request_delta}, panel={panel_text[:240]}"

        run_case(results, "auth.notification-bell", notification_bell, authenticated_page, artifacts_dir)

        def notification_comment_anchor() -> str:
            goto(authenticated_page, f"{frontend_base_url}/home", wait_until="domcontentloaded", pause_ms=1800)
            authenticated_page.locator(".notification-bell-trigger").click()
            panel = authenticated_page.locator(".notification-bell-panel")
            panel.wait_for(timeout=10_000)

            items = authenticated_page.locator(".notification-bell-copy")
            href = None
            target_comment_id = None

            for index in range(items.count()):
                candidate_href = items.nth(index).get_attribute("href")
                if candidate_href and "#comment-" in candidate_href:
                    href = candidate_href
                    target_comment_id = candidate_href.split("#comment-", 1)[1]
                    break

            assert_true(href is not None and target_comment_id is not None, "notification list missing comment anchor target")

            goto(authenticated_page, f"{frontend_base_url}{href}", wait_until="domcontentloaded", pause_ms=1800)
            locator = authenticated_page.locator(f"#comment-{target_comment_id}")
            locator.wait_for(timeout=10_000)
            highlighted = locator.evaluate("node => node.classList.contains('thread-entry-highlighted')")
            assert_true(highlighted, f"target comment {target_comment_id} missing highlighted class")
            return f"targetCommentId={target_comment_id}"

        run_case(results, "auth.notification-comment-anchor", notification_comment_anchor, authenticated_page, artifacts_dir)

        def logout_flow() -> str:
            goto(authenticated_page, f"{frontend_base_url}/home", wait_until="domcontentloaded", pause_ms=1500)
            authenticated_page.locator(".home-session-logout").click()
            authenticated_page.wait_for_url(re.compile(rf"^{re.escape(frontend_base_url)}/(?:[?#].*)?$"), timeout=20_000)
            goto(authenticated_page, f"{frontend_base_url}/me", wait_until="networkidle", pause_ms=800)
            expected_redirect = f"{frontend_base_url}/login?redirectTo=%2Fme"
            assert_true(authenticated_page.url == expected_redirect, f"expected logout redirect to {expected_redirect}")
            return authenticated_page.url

        run_case(results, "auth.logout", logout_flow, authenticated_page, artifacts_dir)
        authenticated_context.close()
        browser.close()

    summary = {
        "frontendBaseUrl": frontend_base_url,
        "backendBaseUrl": backend_base_url,
        "headed": args.headed,
        "passed": sum(1 for item in results if item["passed"]),
        "failed": sum(1 for item in results if not item["passed"]),
        "results": results,
    }

    output_text = json.dumps(summary, ensure_ascii=False, indent=2)
    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(output_text, encoding="utf-8")

    print(output_text)
    return 0 if summary["failed"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
