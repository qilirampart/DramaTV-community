import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any, Optional

from playwright.sync_api import sync_playwright


DEFAULT_FRONTEND_BASE_URL = "http://127.0.0.1:3106"
DEFAULT_BACKEND_BASE_URL = "http://127.0.0.1:18080"
DEFAULT_CREATOR_USERNAME = "creator-a"
DEFAULT_CREATOR_PASSWORD = "dramatv-local-dev"
DEFAULT_VIDEO_ID = "3d82413b-1036-4c1b-93dd-3a102e0b4683"
DEFAULT_CHROMIUM_EXECUTABLE = Path.home() / "AppData/Local/ms-playwright/chromium-1208/chrome-win64/chrome.exe"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run local frontend performance baselines for DramaTV.")
    parser.add_argument("--frontend-base-url", default=DEFAULT_FRONTEND_BASE_URL)
    parser.add_argument("--backend-base-url", default=DEFAULT_BACKEND_BASE_URL)
    parser.add_argument("--creator-username", default=DEFAULT_CREATOR_USERNAME)
    parser.add_argument("--creator-password", default=DEFAULT_CREATOR_PASSWORD)
    parser.add_argument("--video-id", default=DEFAULT_VIDEO_ID)
    parser.add_argument("--chromium-executable", default=str(DEFAULT_CHROMIUM_EXECUTABLE))
    parser.add_argument("--headed", action="store_true")
    parser.add_argument("--slow-mo-ms", type=int, default=200)
    parser.add_argument("--skip-local-reset", action="store_true")
    parser.add_argument("--output", default="")
    parser.add_argument("--artifacts-dir", default="artifacts/frontend-performance")
    return parser.parse_args()


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def append_result(
    results: list[dict[str, Any]],
    name: str,
    passed: bool,
    detail: str,
    metrics: Optional[dict[str, Any]] = None,
) -> None:
    entry: dict[str, Any] = {
        "name": name,
        "passed": passed,
        "detail": detail,
    }
    if metrics is not None:
        entry["metrics"] = metrics
    results.append(entry)


def backend_login_request(page, backend_base_url: str, username: str, password: str) -> str:
    payload = page.request.post(
        f"{backend_base_url}/api/auth/login",
        data={
            "loginType": "password",
            "username": username,
            "password": password,
        },
        timeout=30_000,
    )
    assert_true(payload.ok, f"backend login failed: status={payload.status}")
    data = payload.json()
    access_token = data.get("data", {}).get("accessToken")
    assert_true(isinstance(access_token, str) and access_token, "backend login missing accessToken")
    return access_token


def goto(page, url: str, wait_until: str = "domcontentloaded", pause_ms: int = 1200) -> None:
    page.goto(url, wait_until=wait_until, timeout=60_000)
    page.wait_for_timeout(pause_ms)


def collect_basic_metrics(page) -> dict[str, Any]:
    return page.evaluate(
        """
        () => {
          const navigation = performance.getEntriesByType('navigation')[0];
          const resources = performance.getEntriesByType('resource');
          const videos = Array.from(document.querySelectorAll('video'));
          const links = Array.from(document.querySelectorAll('a[href]'));
          const homeArchiveCards = document.querySelectorAll('[class*="archiveCard"]').length;
          const featuredCards = document.querySelectorAll('[id^="featured-item-"]').length;

          return {
            totalResources: resources.length,
            mp4Requests: resources.filter((entry) => String(entry.name || '').includes('.mp4')).length,
            imageRequests: resources.filter((entry) => /\\.(png|jpg|jpeg|webp|avif)(\\?|$)/i.test(String(entry.name || ''))).length,
            mountedVideos: videos.length,
            playingVideos: videos.filter((video) => !video.paused && !video.ended).length,
            cards: homeArchiveCards + featuredCards,
            homeArchiveCards,
            featuredCards,
            commentEntries: document.querySelectorAll('.thread-entry').length,
            interactiveLinks: links.length,
            domNodes: document.querySelectorAll('*').length,
            domContentLoadedMs: navigation ? Math.round(navigation.domContentLoadedEventEnd) : null,
            loadEventMs: navigation ? Math.round(navigation.loadEventEnd) : null
          };
        }
        """
    )


def clear_resource_timings(page) -> None:
    page.evaluate(
        """
        () => {
          performance.clearResourceTimings();
          if (typeof performance.setResourceTimingBufferSize === 'function') {
            performance.setResourceTimingBufferSize(1000);
          }
        }
        """
    )


def collect_resource_window_metrics(page) -> dict[str, Any]:
    return page.evaluate(
        """
        () => {
          const resources = performance.getEntriesByType('resource');
          const mp4Names = resources
            .map((entry) => String(entry.name || ''))
            .filter((name) => name.includes('.mp4'));
          const imageNames = resources
            .map((entry) => String(entry.name || ''))
            .filter((name) => /\\.(png|jpg|jpeg|webp|avif)(\\?|$)/i.test(name));

          return {
            resourceCount: resources.length,
            mp4Requests: mp4Names.length,
            uniqueMp4Requests: Array.from(new Set(mp4Names)).length,
            imageRequests: imageNames.length
          };
        }
        """
    )


def collect_console_errors(page) -> list[str]:
    messages: list[str] = []

    def on_console(msg) -> None:
        if msg.type == "error":
            messages.append(msg.text)

    page.on("console", on_console)
    return messages


def run_case(results: list[dict[str, Any]], name: str, fn) -> None:
    try:
        detail, metrics = fn()
        append_result(results, name, True, detail, metrics)
    except Exception as error:  # noqa: BLE001
        append_result(results, name, False, str(error), None)


def click_first_matching(page, selectors: list[str]) -> bool:
    for selector in selectors:
        locator = page.locator(selector)
        if locator.count() > 0:
            locator.first.click()
            return True
    return False


def is_local_host(base_url: str) -> bool:
    return base_url.startswith("http://127.0.0.1") or base_url.startswith("http://localhost")


def reset_local_smoke_state(workspace: Path) -> None:
    script = workspace / "scripts" / "reset-local-browser-smoke-state.ps1"
    subprocess.run(
        [
            "powershell",
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            str(script),
        ],
        check=True,
        cwd=str(workspace),
    )


def main() -> int:
    args = parse_args()
    frontend_base_url = args.frontend_base_url.rstrip("/")
    backend_base_url = args.backend_base_url.rstrip("/")
    output_path = args.output
    artifacts_dir = Path(args.artifacts_dir) / "latest"
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    workspace = Path(__file__).resolve().parent.parent
    results: list[dict[str, Any]] = []

    should_reset_local_state = (
        not args.skip_local_reset and is_local_host(frontend_base_url) and is_local_host(backend_base_url)
    )

    if should_reset_local_state:
        reset_local_smoke_state(workspace)

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                headless=not args.headed,
                slow_mo=args.slow_mo_ms if args.headed else 0,
                executable_path=args.chromium_executable,
            )

            page = browser.new_page(viewport={"width": 1440, "height": 960})
            access_token = backend_login_request(page, backend_base_url, args.creator_username, args.creator_password)

            browser.close()

            browser = playwright.chromium.launch(
                headless=not args.headed,
                slow_mo=args.slow_mo_ms if args.headed else 0,
                executable_path=args.chromium_executable,
            )
            context = browser.new_context(viewport={"width": 1440, "height": 960})
            context.add_cookies(
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
            page = context.new_page()
            console_errors = collect_console_errors(page)

            def home_baseline():
                goto(page, f"{frontend_base_url}/home", wait_until="networkidle", pause_ms=1800)
                metrics = collect_basic_metrics(page)
                assert_true(metrics["homeArchiveCards"] >= 8, f"/home archive cards too few: {metrics['homeArchiveCards']}")
                assert_true(metrics["mountedVideos"] <= 6, f"/home mountedVideos too high: {metrics['mountedVideos']}")
                assert_true(metrics["mp4Requests"] <= 8, f"/home mp4Requests too high: {metrics['mp4Requests']}")
                return f"/home dom={metrics['domContentLoadedMs']}ms load={metrics['loadEventMs']}ms", metrics

            run_case(results, "O3-1.home-baseline", home_baseline)

            def root_baseline():
                goto(page, f"{frontend_base_url}/", wait_until="networkidle", pause_ms=1800)
                metrics = collect_basic_metrics(page)
                assert_true(metrics["interactiveLinks"] >= 3, f"/ interactiveLinks too few: {metrics['interactiveLinks']}")
                assert_true(metrics["totalResources"] <= 80, f"/ totalResources too high: {metrics['totalResources']}")
                return f"/ resources={metrics['totalResources']} dom={metrics['domContentLoadedMs']}ms", metrics

            run_case(results, "O3-1.root-baseline", root_baseline)

            def featured_stress():
                goto(page, f"{frontend_base_url}/featured", wait_until="domcontentloaded", pause_ms=2200)
                labels = ["工作流", "视频提示词", "图片提示词", "全部"]
                for _ in range(5):
                    for label in labels:
                        page.get_by_role("button", name=re.compile(label)).click(timeout=10_000)
                        page.wait_for_timeout(220)
                metrics = collect_basic_metrics(page)
                assert_true(metrics["featuredCards"] >= 6, f"/featured cards too few after tab stress: {metrics['featuredCards']}")
                assert_true(metrics["mountedVideos"] <= 6, f"/featured mountedVideos too high after tab stress: {metrics['mountedVideos']}")
                assert_true(metrics["mp4Requests"] <= 4, f"/featured mp4Requests too high after tab stress: {metrics['mp4Requests']}")
                assert_true(len(console_errors) == 0, f"/featured console errors detected: {len(console_errors)}")
                return f"/featured tab-stress mp4={metrics['mp4Requests']} videos={metrics['mountedVideos']}", metrics

            run_case(results, "O3-2.featured-tab-stress", featured_stress)

            def detail_back_stress():
                goto(page, f"{frontend_base_url}/featured?filter=video_prompt&sort=hot", wait_until="domcontentloaded", pause_ms=2200)
                clear_resource_timings(page)
                clicked = click_first_matching(
                    page,
                    [
                        "a[href^='/prompts/']",
                        "a[href^='/videos/']",
                        "a[href^='/workflows/']",
                    ],
                )
                assert_true(clicked, "no detail card link found on /featured")

                for _ in range(3):
                    page.wait_for_timeout(1800)
                    detail_metrics = collect_basic_metrics(page)
                    assert_true(detail_metrics["mountedVideos"] <= 3, f"detail mountedVideos too high: {detail_metrics['mountedVideos']}")
                    back_locator = page.get_by_role("link", name=re.compile("返回"))
                    assert_true(back_locator.count() > 0, "detail page missing back link")
                    back_locator.first.click(timeout=10_000)
                    page.wait_for_timeout(1800)
                    if _ < 2:
                        clicked_again = click_first_matching(
                            page,
                            [
                                "a[href^='/prompts/']",
                                "a[href^='/videos/']",
                                "a[href^='/workflows/']",
                            ],
                        )
                        assert_true(clicked_again, "failed to re-enter detail during back stress")

                metrics = collect_basic_metrics(page)
                resource_window = collect_resource_window_metrics(page)
                metrics["resourceWindow"] = resource_window
                assert_true(metrics["featuredCards"] >= 6, f"featured cards too few after back stress: {metrics['featuredCards']}")
                assert_true(metrics["mountedVideos"] <= 3, f"mountedVideos too high after back stress: {metrics['mountedVideos']}")
                assert_true(resource_window["mp4Requests"] <= 8, f"back stress mp4Requests too high: {resource_window['mp4Requests']}")
                assert_true(
                    resource_window["uniqueMp4Requests"] <= 4,
                    f"back stress uniqueMp4Requests too high: {resource_window['uniqueMp4Requests']}",
                )
                assert_true(len(console_errors) == 0, f"console errors detected after back stress: {len(console_errors)}")
                return f"detail-back mp4={metrics['mp4Requests']} resources={metrics['totalResources']}", metrics

            run_case(results, "O3-3.detail-back-stress", detail_back_stress)

            def comment_interaction_baseline():
                goto(page, f"{frontend_base_url}/videos/{args.video_id}", wait_until="domcontentloaded", pause_ms=2200)
                before_resources = len(page.evaluate("() => performance.getEntriesByType('resource').map((entry) => entry.name)"))
                thread_entries_before = page.locator(".thread-entry").count()

                expand_button = page.get_by_role("button", name=re.compile("展开\\s+\\d+\\s+条回复"))
                if expand_button.count() > 0:
                    expand_button.first.click(timeout=10_000)
                    page.wait_for_timeout(320)

                reply_button = page.get_by_role("button", name="回复")
                assert_true(reply_button.count() > 0, "comment thread missing reply button")
                reply_button.first.click(timeout=10_000)
                page.wait_for_timeout(320)

                inline_textarea = page.locator(".thread-inline-composer textarea")
                assert_true(inline_textarea.count() > 0, "inline reply composer missing")
                inline_textarea.fill("性能基线回复测试")
                submit_button = page.locator(".thread-inline-composer button.button")
                submit_button.click(timeout=10_000)
                page.wait_for_timeout(1800)

                after_resources = len(page.evaluate("() => performance.getEntriesByType('resource').map((entry) => entry.name)"))
                metrics = collect_basic_metrics(page)
                metrics["resourceDeltaAfterReply"] = after_resources - before_resources
                metrics["threadEntriesBefore"] = thread_entries_before
                metrics["threadEntriesAfter"] = page.locator(".thread-entry").count()

                assert_true(metrics["resourceDeltaAfterReply"] <= 12, f"comment submit triggered too many resource fetches: {metrics['resourceDeltaAfterReply']}")
                assert_true(metrics["threadEntriesAfter"] >= thread_entries_before, "comment submit reduced visible comment entries unexpectedly")
                assert_true(metrics["commentEntries"] >= 2, f"comment entries too few after interaction: {metrics['commentEntries']}")
                return (
                    f"comments delta={metrics['resourceDeltaAfterReply']} entries={metrics['threadEntriesAfter']}",
                    metrics,
                )

            run_case(results, "O3-4.comment-interaction-baseline", comment_interaction_baseline)

            browser.close()
    finally:
        if should_reset_local_state:
            reset_local_smoke_state(workspace)

    summary = {
        "generatedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "frontendBaseUrl": frontend_base_url,
        "backendBaseUrl": backend_base_url,
        "passed": len([item for item in results if item["passed"]]),
        "failed": len([item for item in results if not item["passed"]]),
        "results": results,
    }

    text = json.dumps(summary, ensure_ascii=False, indent=2)
    if output_path:
        output = Path(output_path)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(text + "\n", encoding="utf-8")

    print(text)
    if summary["failed"] > 0:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
