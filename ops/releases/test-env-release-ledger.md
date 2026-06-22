# 测试环境发布台账

规则：

- 这份台账主表仍以测试环境社区前台 / 社区后端联合发布为主；自 `2026-05-21` 起，后台 `apps/admin` 的独立云发布也纳入同一份台账追加记录。
- 采用 append-only 方式追加，不回改历史条目。
- 稳定版本必须写清前端 release、后端 release、验证口径和回滚目标。

## 当前稳定基线

- 稳定版本标识：`test-stable-2026-05-19-community-r1`
- 固化时间：`2026-05-19`
- 前端当前云 release：`/opt/dramatv-community-web/releases/20260509-141400`
- 后端当前云 release：`/opt/dramatv-community-server/releases/20260509-123834`
- 来源说明：这两个 release 是“补 release 元数据与回滚规范之前”的历史测试环境当前版本，现已通过 `scripts/stamp-test-stable-baseline.ps1` 回填远端 `release.json`
- 版本身份说明：虽然远端已有 `release.json`，但它们仍然是 `legacy baseline`，`commitSha / branch` 只能保留为 `unknown`，不能反推精确源码版本
- 用途：作为后续测试环境异常时的第一回滚锚点

## 发布记录

| 日期 | 稳定标识 / 发布批次 | 范围 | 前端 release | 后端 release | 验证结果 | 回滚备注 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-05-19 | test-stable-2026-05-19-community-r1 | baseline capture | 20260509-141400 | 20260509-123834 | 基线固化，后续发布从此对照 | 回滚优先回到这组 legacy release |
| 2026-05-19 | r2-20260519-community | community frontend + backend sync | 20260519-212618 | 20260519-212502 | `deploy:test:backend` / `deploy:test:web` + `deploy:verify:pre/post:test` 全部通过 | 当前测试环境新批次，后续异常优先回看这一组 |

| 2026-05-24 | t6-media-upload-cloud-r1 | community backend media/upload T6 sync | 20260523-122542 (unchanged) | 20260524-140356 | 云端 `preview/cover backlog=0`；`T6-5` 重复上传去重通过；`T6-6` `Cache-Control/ETag/304/206` 与 `MEDIA_PROXY_BUSY` 并发保护通过 | 优先仅回滚 backend；上一版可回到 `20260524-131800`，稳定兜底回到 `20260522-201207`；web 保持当前 release |
| 2026-05-24 | hover-play-source-fallback-sync-2026-05-24 | community frontend web sync | 20260524-154158 | 20260524-140356 (unchanged) | `apps/web` typecheck/build 通过；`deploy-test-web.ps1 -VerifyAfterDeploy` 通过；公网登录态下已验证无 `preview` 卡片悬浮后会回退请求 `source` mp4 | 优先仅回滚 web；上一版可回到 `20260523-122542`，稳定兜底仍可回到 `20260519-212618` |
## 管理后台补充

- 2026-05-21 起，管理后台 `apps/admin` 也已纳入同一套测试环境 release 体系：
  - `scripts/deploy-test-admin.ps1`
  - `scripts/rollback-test-admin.ps1`
  - `scripts/list-test-releases.ps1 -Runtime admin`
  - 远端 `release.json`
- 当前还没有首条真实 admin 云发布记录。
- 第一次执行 `deploy:test:admin` 成功后，再把实际 admin release 追加到本台账。



| 2026-05-24 | admin-ui-structure-sync-20260524-193217 | admin frontend sync | 20260524-193217 | 20260524-140356 (unchanged) | public smoke `13 passed / 0 failed`; full smoke `24 passed / 1 failed` (`root.redirect` expectation mismatch only) | use `/admin` as the public base path |
| 2026-05-24 | public-cache-bust-for-feed-ops-publish-20260524-222205 | community frontend web sync | 20260524-222205 | 20260524-215718 (unchanged) | `apps/web -> npm.cmd run build`; `deploy:test:web -VerifyBeforeDeploy -VerifyAfterDeploy` passed; public landing/home/featured now read live backend data instead of stale `unstable_cache` | keep backend release `20260524-215718`; no backend change |
| 2026-05-25 | prompt-asset-popup-ui-sync-20260525-140650 | community frontend web sync | 20260525-140650 | 20260524-215718 (unchanged) | `deploy:test:web` passed twice (`20260525-135652` then compatibility re-release `20260525-140650`); readiness `11 passed / 0 failed`; public prompt detail now shows `查看素材` and opens the asset popup even when cloud prompt `examples[]` omit `role` | keep backend unchanged; frontend added backward-compatible prompt asset role inference for older cloud prompt payloads |
| 2026-05-25 | audio-upload-policy-cloud-sync-20260525-144731 | community backend sync | 20260525-140650 (unchanged) | 20260525-144731 | public audio upload root cause closed; `deploy:test:backend` completed with `verify:quick`; post-deploy readiness `11 passed / 0 failed`; cloud backend now includes `/api/uploads/audio-policy` | prefer backend-only rollback if needed; prior backend anchor `20260524-215718` |
| 2026-05-25 | publish-reference-panel-bounded-20260525-145458 | community frontend web sync | 20260525-145458 | 20260525-144731 (unchanged) | publish page reference panels now use bounded-height scroll areas; `deploy:test:web` passed with readiness `11 passed / 0 failed`; build output includes `/api/uploads/audio-policy` route | prefer web-only rollback if needed; prior web anchor `20260525-140650` |
| 2026-05-25 | publish-reference-panel-tightened-20260525-155547 | community frontend web sync | 20260525-155547 | 20260525-144731 (unchanged) | publish page reference panels tightened again from the previous tall bounded area to fixed-height blocks (`320 / 312 / 288`); `scripts/deploy-test-web.ps1 -VerifyAfterDeploy` passed; public `/publish` Playwright spot check confirmed the reference area now renders at fixed `320px` height | prefer web-only rollback if needed; prior web anchor `20260525-145458` |
## 2026-05-26

### web

- release: `20260526-144312`
- label: `nav-switch-performance-2026-05-26`
- scope:
  - reduce shared route transition minimum dwell from `500ms` to `160ms`
  - add proactive top-nav prefetch for `/ /home /featured /discussions`
  - add authenticated lazy featured prompt inventory route `/api/featured-prompts`
  - stop authenticated `/featured` from blocking first render on full prompt inventory
  - stop `/home` from issuing an extra hero-only prompt request
- verify:
  - remote production build passed
  - `artifacts/runtime-readiness/test/web-deploy-20260526-144312-summary.json`
  - result: `11 passed / 0 failed`
- note:
  - default `deploy:test:web` pre-verify was blocked by unrelated in-flight backend compilation errors in local workspace
  - actual cloud sync was completed with web-only deploy path `scripts/deploy-test-web.ps1 -VerifyAfterDeploy`

- release: `20260526-180222`
- label: `home-hero-refinements-2026-05-26`
- scope:
  - sync recent home hero coverflow perspective refinements
  - remove first-screen hero title overlays
  - remove the hero bottom black rounded band under dots
  - widen the home shelf area slightly on both sides
- verify:
  - remote production build passed
  - `artifacts/runtime-readiness/test/web-deploy-20260526-180222-summary.json`
  - result: `12 passed / 0 failed`
- note:
  - deployed through the web-only path `scripts/deploy-test-web.ps1 -VerifyAfterDeploy`
  - backend remained unchanged in this sync

- release: `20260528-161045`
- label: `20260528-161045`
- scope:
  - community backend featured inventory sync
  - keep `activity` tab but remove `post` from public featured inventory and `featured-activity`
  - add mixed `video_prompt / image_prompt` continuation strategy for public `all` inventory
- verify:
  - public `GET http://8.141.20.130/api/feed/featured-inventory?filter=all&limit=3` returned `activity=0`
  - public `GET http://8.141.20.130/api/feed/featured` returned `featured-activity.items=[]`
  - authenticated `npm.cmd run readiness:test -- --creator-username creator-b --creator-password 123456` -> `17 passed / 0 failed`
- note:
  - first backend deploy attempt was blocked locally by a running `18080` JVM locking `apps/server/target/*.jar`
  - second attempt completed the real remote release, but the script tail health probe hit a Spring Boot restart timing window before port `18080` finished binding
  - current remote active backend release has been rechecked with `scripts/list-test-releases.ps1 -Runtime server`

- release: `20260528-161330`
- label: `20260528-161330`
- scope:
  - community frontend featured sync
  - keep `activity` tab visible while switching it to curated slot consumption
  - align public `/featured` with the new backend contract that excludes posts from public featured
- verify:
  - `artifacts/runtime-readiness/test/web-deploy-20260528-161330-summary.json`
  - result: `13 passed / 0 failed`
  - authenticated `npm.cmd run readiness:test -- --creator-username creator-b --creator-password 123456` -> `17 passed / 0 failed`
- note:
  - deployed through `scripts/deploy-test-web.ps1 -VerifyAfterDeploy`
  - current remote active web release has been rechecked with `scripts/list-test-releases.ps1 -Runtime web`

## 2026-05-29

### admin

- release: `20260529-095822`
- label: `admin-media-proxy-internal-origin-sync-2026-05-29`
- scope:
  - split admin server-side web origin from browser-visible public origin
  - add `DRAMATV_WEB_BASE_URL=http://127.0.0.1:3106` to the cloud admin env
  - make `/admin/__admin_proxy__/seedance-videos/*` and `/admin/__admin_proxy__/nano-banana-images/*` prefer the ECS-local community web upstream instead of the public `8.141.20.130:80`
- verify:
  - `artifacts/runtime-readiness/test/admin-deploy-20260529-095822-public-summary.json`
  - result: `14 passed / 0 failed`
  - `artifacts/runtime-readiness/test/admin-deploy-20260529-095822-internal-summary.json`
  - result: `34 passed / 0 failed`
  - internal proxy check: `curl -I http://127.0.0.1:3206/admin/__admin_proxy__/nano-banana-images/000029-13311/01.jpg -> 200 OK`
  - post-restart `journalctl -u dramatv-community-admin -n 30` no longer shows new `connect ETIMEDOUT 8.141.20.130:80`
- note:
  - deployed through `./scripts/deploy-test-admin.ps1 -VerifyAfterDeploy`
  - prior admin cloud anchor: `20260528-094801`

### admin

- release: `20260529-160920`
- label: `20260529-admin-feed-ops-modal-sync`
- scope:
  - remove the outer candidate-pool column from featured feed-ops main view
  - keep candidate loading only inside the arrange modal
  - expose the featured `latest / hot` switch inside the arrange modal header
- verify:
  - `artifacts/runtime-readiness/test/admin-deploy-20260529-160920-public-summary.json`
  - result: `14 passed / 0 failed`
  - `artifacts/runtime-readiness/test/admin-deploy-20260529-160920-internal-summary.json`
  - result: `34 passed / 0 failed`
- note:
  - deployed through `./scripts/deploy-test-admin.ps1 -VerifyAfterDeploy`
  - prior admin cloud anchor: `20260529-134708`

## 2026-06-11

### server

- release: `20260611-192256`
- label: `manual-backend-deploy-2026-06-11`
- scope:
  - sync the recent shared backend changes required by creator page, featured inventory, taxonomy, media, auth, and admin/frontend integration
  - complete the large test-environment sync after predeploy backup and local preflight
- verify:
  - remote `systemctl is-active dramatv-community-server` -> `active`
  - remote `curl http://127.0.0.1:18080/actuator/health` -> `{"status":"UP"}`
  - remote `GET http://127.0.0.1:18080/api/feed/featured?limit=3` -> `200`
  - remote `GET http://127.0.0.1:18080/api/feed/featured-inventory?limit=3` -> `200`
- note:
  - scripted path `scripts/deploy-test-backend.ps1 -SkipBuild -VerifyAfterDeploy` timed out twice without creating a new remote release directory
  - this release was completed through a manual fallback: upload `release.json` + jar, switch current symlink, restart service
  - prior server cloud anchor: `20260529-154938`

### admin

- release: `20260611-194322`
- label: `large-sync-20260611-admin`
- scope:
  - sync featured feed-ops latest/hot configuration support and recent admin-side operating changes
  - align admin runtime with the new backend/frontend behavior in the same large sync window
- verify:
  - remote `curl -I http://127.0.0.1:3206/admin/login` -> `200`
  - remote `systemctl is-active dramatv-community-admin` -> `active`
  - `artifacts/runtime-readiness/test/admin-deploy-20260611-194322-internal-summary.json`
  - result: `34 passed / 0 failed`
- note:
  - local-machine public checks against `community.8.141.20.130.nip.io` were polluted by Aliyun ICP interception and were not used as the source of truth
  - prior admin cloud anchor: `20260529-160920`

### web

- release: `20260611-194522`
- label: `large-sync-20260611-web`
- scope:
  - sync the recent home / featured / creator / login / canvas / community display refinements
  - keep the shared ECS entry pinned to `community.8.141.20.130.nip.io`
- verify:
  - remote `systemctl is-active dramatv-community-web` -> `active`
  - remote host-header checks:
    - `/` -> `200`
    - `/login` -> `200`
    - `/canvas` -> `200`
    - `/home` -> `307` unauthenticated redirect expected
    - `/featured` -> `307` unauthenticated redirect expected
    - `/discussions` -> `307` unauthenticated redirect expected
    - `/api/feed/featured` -> `200`
    - `/api/feed/featured-inventory` -> `200`
  - media proxy sample:
    - `/media/community/test/video/preview/.../video-preview.mp4` -> `200`
    - response includes `X-Request-Id` and `X-Trace-Id`
  - `nginx -t` passed and `server_name community.8.141.20.130.nip.io` preserved
- note:
  - prior web cloud anchor: `20260609-172654`

### web

- release: `20260612-191508`
- label: `featured-waterfall-pagination-20260612`
- scope:
  - sync the featured waterfall pagination/load-more stability fix
  - keep the active test entry on `drama-community-dev.dzkjm.cn` instead of reverting nginx back to the old `nip.io` host
- verify:
  - remote build completed under `/opt/dramatv-community-web/releases/20260612-191508`
  - remote `systemctl is-active dramatv-community-web` -> `active`
  - `artifacts/runtime-readiness/test/web-deploy-20260612-191508-summary.json`
  - result: `13 passed / 0 failed`
- note:
  - deploy command used explicit `-PublicBaseUrl http://drama-community-dev.dzkjm.cn -ServerNames drama-community-dev.dzkjm.cn` because repo defaults still point at the deprecated `community.8.141.20.130.nip.io`
  - first upload attempt aborted around `95%`; second retry with identical parameters succeeded

### backend

- release: `20260618-185556`
- label: `featured-prompt-preview-fix-followup`
- scope:
  - carry the server-side featured prompt preview fix that stops curated featured slots from exposing source video as preview when no real preview asset exists
  - verify the live test backend is actually switched onto the uploaded jar instead of only creating a new release directory
- findings:
  - uploaded release jar hash:
    - `262a6224491bc5dad4d1e9ad8dee4b0cf2e19f9af3c36645fef331771de4f42b`
  - stale active runtime before final repair:
    - current symlink still pointed to `20260618-183056`
    - active runtime hash was `f595d2af150bf3f6e45cb39a4cd85227d9e3e0a5f5bb858ca270ca556b3de7d3`
  - this mismatch fully explained why `/api/feed/featured?sort=latest` kept returning 9 bad `previewUrl == sourceUrl` items even though the new jar had already been uploaded
- repair:
  - repointed:
    - `/opt/dramatv-community-server/current/dramatv-community-server.jar`
    - -> `/opt/dramatv-community-server/releases/20260618-185556/dramatv-community-server.jar`
  - restarted:
    - `systemctl restart dramatv-community-server`
- verify:
  - `systemctl status dramatv-community-server` -> `active (running)`
  - `ss -ltnp | grep 18080` -> Java listening on `*:18080`
  - direct backend check:
    - `GET http://127.0.0.1:18080/api/feed/featured?sort=latest`
    - `featured-video-prompt.count = 12`
    - `featured-video-prompt.badCount = 0`
- note:
  - for future backend test-env deploys, treat “release directory exists” as insufficient evidence
  - minimum post-deploy proof must include:
    - current symlink target
    - active jar hash
    - target business endpoint behavior

### web

- release: `20260618-193956`
- label: `featured-cross-page-restore-fix`
- scope:
  - sync the featured top-nav leave-page snapshot fix
  - make `/featured` cross-page return restore work even when the user only scrolls and switches pages without entering detail
  - make the same restore keep refreshing on later `/home|/discussions` switches instead of only working once after a detail return
- changed area:
  - `apps/web/src/components/shared/CommunityRouteTransitionProvider.tsx`
  - before internal route transitions, persist the current full route including hash via `rememberBackAnchorSource(currentHref)`
- verify:
  - remote release dir:
    - `/opt/dramatv-community-web/releases/20260618-193956`
  - remote `systemctl status dramatv-community-web` -> `active (running)`
  - readiness artifact:
    - `artifacts/runtime-readiness/test/web-deploy-20260618-193956-summary.json`
  - result:
    - `13 passed / 0 failed`
