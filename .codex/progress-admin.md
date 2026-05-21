# 鍚庡彴绠＄悊绾胯繘搴?
## 褰撳墠蹇収

- 2026-04-29 璧凤紝鍚庡彴绠＄悊绾胯缁嗚繘搴︾粺涓€璁板綍鍦ㄦ湰鏂囦欢锛沗.codex/progress.md` 鍙繚鐣欐€荤储寮曘€佽法绾跨姸鎬佸拰鍏ㄥ眬閲岀▼纰戙€?- 褰撳墠鐘舵€佷负 `鍙户缁帹杩沗锛氬悗鍙扮鐞嗙嚎宸插叿澶囩嫭绔嬭繘搴﹁处鏈笌鐙珛鍓嶇鍏ュ彛锛屽悗缁彲涓庣ぞ鍖轰富绾垮苟琛屽紑鍙戙€?- 褰撳墠闃舵宸茬粡钀藉埌鈥渀apps/admin` 姝ｅ紡宸ョ▼宸茶捣姝ワ紝`auth + users + comments + moderation + reports + taxonomy + feed-ops + media-tasks + audit-logs` 绗竴鎵圭湡鎺ュ彛闂幆宸叉帴閫氾紱`dashboard overview` 涔熷凡鍒囧埌鐪熷疄鏁版嵁锛屽綋鍓嶄富瑕佸墿 `smoke + browser acceptance` 寰呮敹鍙ｂ€濄€?- 宸ョ▼鏂规宸插浐瀹氾細鍓嶅彴绀惧尯缁х画璧?`apps/web`锛屽悗鍙扮鐞嗙嫭绔嬭蛋 `apps/admin`锛屾湰鍦扮鍙?`3206`锛涘悗绔粺涓€澶嶇敤 `apps/server`锛岄€氳繃 `/api/admin/**` 鎻愪緵鍚庡彴鎺ュ彛銆?- 涓氬姟杈圭晫宸插浐瀹氾細鍚庡彴鍜屽墠鍙板叡浜悓涓€濂楃ぞ鍖洪鍩熸ā鍨嬨€佸彂甯冨鏍搁摼璺笌娌荤悊鏁版嵁锛屼絾涓嶄綔涓轰袱濂楀绔嬬郴缁熸帹杩涖€?- 鏈湴杩愯鎬佹敞鎰忕偣宸茶ˉ璁帮細鍚庡彴椤靛鏋滅户缁樉绀?fallback/鍗犱綅锛屼笉鍏堟€€鐤戜唬鐮佹湰韬紝鍏堢‘璁?`127.0.0.1:18080` 鏄惁宸查噸鍚埌鏈€鏂?`apps/server` 杩涚▼锛涙湰杞?`reports / taxonomy` 閮藉嚭鐜拌繃鈥滄簮鐮佸凡鏇存柊銆佽繍琛岃繘绋嬩粛鏄棫鐗堟湰鈥濆鑷寸殑鍋囧紓甯搞€?
## 褰撳墠鐪嬫澘

### 鐘舵€佽鍒?
- `寰呭仛`锛氫换鍔″凡纭锛屼絾杩樻病寮€濮嬪疄鏂姐€?- `杩涜涓璥锛氬凡缁忓紑濮嬶紝褰撳墠搴斾紭鍏堟帹杩涖€?- `闃诲`锛氫緷璧栧墠鍙般€佽繍缁淬€佽璁℃垨澶栭儴璧勬簮锛屽綋鍓嶄笉鑳界嫭绔嬫敹鍙ｃ€?- `宸插畬鎴恅锛氫唬鐮併€佽仈璋冨拰褰撳墠闃舵楠屾敹閮藉凡閫氳繃銆?
### 澶т换鍔℃澘

- `A0 鍚庡彴宸ョ▼鍩虹嚎` `宸插畬鎴恅
  - `A0-1` `apps/admin` 鐙珛宸ョ▼銆佽矾鐢遍鏋躲€佸悗鍙颁富甯冨眬钀藉湴 `宸插畬鎴恅
  - `A0-2` 鍚庡彴鐧诲綍銆佷細璇濄€侀€€鍑恒€佽鑹插畧鍗帴鐪熸帴鍙?`宸插畬鎴恅
  - `A0-3` 鍚庡彴鏈湴鐙珛绔彛涓?`apps/server /api/admin/**` 鍏变韩鍚庣鏂规鍥哄畾 `宸插畬鎴恅

- `A1 棣栨壒鐪熷疄娌荤悊椤甸棴鐜痐 `宸插畬鎴恅
  - `A1-1` 鐢ㄦ埛鍒楄〃椤垫帴閫氱湡瀹炴暟鎹?`宸插畬鎴恅
  - `A1-2` 璇勮娌荤悊椤垫帴閫氱湡瀹炴煡璇€侀殣钘忋€佹仮澶嶃€佸垹闄ゃ€佽瘎璁哄尯寮€鍏?`宸插畬鎴恅
  - `A1-3` 瀹℃牳涓績鎺ラ€氱湡瀹炴煡璇€佽鎯呫€侀€氳繃銆侀┏鍥炪€佷笅绾裤€佹仮澶?`宸插畬鎴恅
  - `A1-4` 甯栧瓙琛ュ叆 `audit_records`锛屽鏍告睜瑕嗙洊 `瑙嗛 / 鎻愮ず璇?/ 宸ヤ綔娴?/ 甯栧瓙` `宸插畬鎴恅

- `A2 涓炬姤宸ュ崟涓績` `宸插畬鎴恅
  - `A2-1` 鏂板 `admin/reports` 鍚庣妯″潡涓庡伐鍗曞垪琛ㄦ帴鍙?`宸插畬鎴恅
  - `A2-2` 琛ヤ妇鎶ヨ鎯呫€佺姸鎬佹祦杞€佸鐞嗗娉ㄣ€佸叧闂伐鍗曟帴鍙?`宸插畬鎴恅
  - `A2-3` 鏄庣‘ `reports` 涓?`moderation` 鐨勮仈鍔ㄨ竟鐣岋紝閬垮厤涓ゅ鐘舵€佹贩涔?`宸插畬鎴恅
  - `A2-4` `apps/admin /reports` 浠庡崰浣嶆暟鎹垏鍒扮湡瀹炲伐鍗曟暟鎹?`宸插畬鎴恅
  - `A2-5` 瀹屾垚涓炬姤閾捐矾娴忚鍣ㄧ骇楠屾敹涓庡洖褰掕褰?`宸插畬鎴恅

- `A3 鍒嗙被娌荤悊涓績` `宸插畬鎴恅
  - `A3-1` 鍩轰簬 `prompt_entries.model_category / content_category / composition_category` 璁捐鍚庡彴鐪熷疄鏌ヨ鍙ｅ緞 `宸插畬鎴恅
  - `A3-2` 鏂板 `admin/taxonomy` 鏌ヨ鎺ュ彛涓庡熀纭€缁熻 `宸插畬鎴恅
  - `A3-3` `apps/admin /taxonomy` 浠庨潤鎬佸弬鑰冮〉鍒囧埌鐪熷疄鏁版嵁 `宸插畬鎴恅
  - `A3-4` 棰勭暀鍒嗙被鍚仠銆佹帓搴忋€佸墠鍙板睍绀哄紑鍏崇殑娌荤悊浣?`宸插畬鎴恅

- `A4 杩愯惀缂栨帓涓績` `宸插畬鎴恅
  - `A4-1` 瀹氫箟 `feed-ops/home` 鐨勬暟鎹粨鏋勪笌閰嶇疆钀藉簱瀛樺偍 `宸插畬鎴恅
  - `A4-2` 瀹氫箟 `feed-ops/featured` 鐨勬帓搴忋€佸垎绫诲睍绀恒€佹帹鑽愪綅閰嶇疆鎺ュ彛 `宸插畬鎴恅
  - `A4-3` 瀹氫箟 `feed-ops/discussions` 鐨勯閬撴帓搴忋€佺疆椤躲€佹椿鍔ㄤ綅閰嶇疆鎺ュ彛 `宸插畬鎴恅
  - `A4-4` `apps/admin /feed-ops/*` 浠庨潤鎬佽繍钀ュ３鍒囧埌鐪熷疄閰嶇疆璇诲啓 `宸插畬鎴恅

- `A5 濯掍綋浠诲姟涓庢帓闅滀腑蹇僠 `宸插畬鎴恅
  - `A5-1` 鐩樼偣绀惧尯鐜版湁寮傛浠诲姟銆佸獟浣撶姸鎬併€佸け璐ラ噸璇曞叆鍙ｇ殑鐪熷疄鏁版嵁婧?`宸插畬鎴恅
  - `A5-2` 鏂板 `admin/media-tasks` 鏌ヨ鎺ュ彛锛岃嚦灏戣鐩栦换鍔″垪琛ㄣ€佺姸鎬併€侀敊璇憳瑕?`宸插畬鎴恅
  - `A5-3` 鏂板 `admin/audit-logs` 鏈€灏忔煡璇㈡帴鍙ｏ紝鍏堣В鍐冲悗鍙版帓闅滃彲瑙佹€?`宸插畬鎴恅
  - `A5-4` `apps/admin /media-tasks` 涓?`/audit-logs` 浠庡崰浣嶉〉鍒囧埌鐪熷疄鏁版嵁 `宸插畬鎴恅

- `A6 璐﹀彿娌荤悊澧炲己` `宸插畬鎴恅
  - `A6-1` 鐢ㄦ埛璇︽儏椤垫帴鍙ｏ紝琛ヨ处鍙峰熀纭€淇℃伅銆佸唴瀹圭粺璁°€佹不鐞嗘憳瑕?`宸插畬鎴恅
  - `A6-2` 琛ヨ处鍙峰惎鍋溿€佸悗鍙拌鑹茶皟鏁存帴鍙?`宸插畬鎴恅
  - `A6-3` 璇勪及骞惰ˉ鈥滈噸缃瘑鐮?/ 鍒濆鍖栧瘑鐮佲€濊兘鍔?`宸插畬鎴恅
  - `A6-4` `apps/admin /users` 琛ヨ鎯呮娊灞夋垨璇︽儏椤碉紝涓嶅啀鍙仠鐣欏湪鍒楄〃 `宸插畬鎴恅

- `A7 姒傝涓庨獙鏀禶 `宸插畬鎴恅
  - `A7-1` 鏂板 `dashboard/overview` 鐪熷疄姒傝鎺ュ彛 `宸插畬鎴恅
  - `A7-2` 鍚庡彴棣栭〉鑱氬悎寰呭鏍搞€佸緟澶勭悊涓炬姤銆佸紓甯镐换鍔°€佺敤鎴锋鍐?`宸插畬鎴恅
  - `A7-3` 寤虹珛鍚庡彴鏈€灏?smoke 娓呭崟锛氱櫥褰曘€佺敤鎴枫€佽瘎璁恒€佸鏍搞€佷妇鎶ャ€佽繍钀ラ厤缃?`宸插畬鎴恅
  - `A7-4` 瀹屾垚涓€杞悗鍙版祻瑙堝櫒绾ч獙鏀跺苟琛ヨ繘搴﹁褰?`宸插畬鎴恅

### 浠诲姟娴佽浆瑙勫垯

- 瀛愪换鍔′竴鏃﹀紑濮嬶紝灏辨妸鐘舵€佷粠 `寰呭仛` 鏀逛负 `杩涜涓璥銆?- 瀛愪换鍔″畬鎴愬悗锛岀珛鍗虫爣璁颁负 `宸插畬鎴恅锛屽苟鍦ㄢ€滆拷鍔犳棩蹇椻€濊ˉ涓€鏉″畬鎴愯褰曘€?- 鏌愪釜澶т换鍔′笅鐨勬墍鏈夊瓙浠诲姟閮藉彉鎴?`宸插畬鎴恅 鍚庯紝鍐嶆妸璇ュぇ浠诲姟鏀逛负 `宸插畬鎴恅銆?- 濡傛灉涓€斿彂鐜板閮ㄤ緷璧栭樆濉烇紝灏辨妸瀵瑰簲瀛愪换鍔℃敼涓?`闃诲`锛屽苟鍐欐竻闃诲鐐癸紝涓嶆ā绯婃寕璧枫€?
## 杩藉姞鏃ュ織

### 2026-05-08 users 鍘诲崐鍗犱綅鏀跺彛

- 鏈疆缁х画鎶?`apps/admin /users` 浠庘€滅湡鎺ュ彛宸叉帴锛屼絾绛涢€夈€佸垎椤靛拰 fallback 浠嶄繚鐣欏弬鑰冨３鈥濇敹鍙ｅ埌鐪熷疄鑳藉姏杈圭晫锛?  - 椤甸潰椤堕儴缁熻鍙ｅ緞宸叉敼鎴愮湡瀹炲悗绔彲鎻愪緵鐨勬暟鎹細
    - 鐢ㄦ埛鎬绘暟
    - 褰撳墠鏌ヨ杩斿洖鏁?    - 鍚庡彴瑙掕壊璐﹀彿鏁?    - 闈炴椿璺冭处鍙锋暟
  - 绛涢€夊尯宸茬Щ闄ゅ師鍏堟暣鍧楀亣 `鐘舵€?/ 璐﹀彿绫诲瀷 / 娉ㄥ唽鏉ユ簮 / 鏃堕棿鑼冨洿` 澹筹紝鍙繚鐣欑湡瀹?`q` 鎼滅储
  - 鍒楄〃搴曢儴宸茬Щ闄ゅ亣鍒嗛〉锛屽彧淇濈暀鈥滃浐瀹氭渶杩?50 鏉♀€濊繖涓€鐪熷疄鍚庣闄愬埗鎻愮ず
  - 鍒楄〃鏌ヨ澶辫触鏃朵笉鍐嶅洖閫€ `FALLBACK_USERS`锛屾敼涓烘槑纭敊璇€佸拰鐪熷疄绌烘€?- 鏈疆鍚屾琛ヤ簡鐢ㄦ埛椤甸€変腑鎬佷笌鍔ㄤ綔鍥炶烦淇濆弬锛?  - 璇︽儏閫夋嫨鍜屾不鐞嗕繚瀛樼幇鍦ㄤ細淇濈暀褰撳墠 `q / selected`
  - 璐﹀彿娌荤悊淇濆瓨澶辫触鏃朵篃浼氬甫鐫€褰撳墠鏌ヨ鏉′欢鍥炲埌鍘熼〉
- 鏈疆鍚屾鏀舵帀浜嗕竴涓瀵兼€ц鎯呭洖閫€锛?  - 涔嬪墠璇︽儏鎺ュ彛寮傚父鏃朵細閫€鍥炲亣璇︽儏瀵硅薄
  - 鐜板湪鏀逛负锛?    - 鍒楄〃鎴愬姛 + 璇︽儏鎴愬姛 -> 灞曠ず鐪熷疄璇︽儏
    - 鍒楄〃鎴愬姛 + 璇︽儏澶辫触 -> 灞曠ず鏄庣‘璇︽儏閿欒鎬侊紝涓嶅啀浼鎴愬凡瀹屽杽鑳藉姏
- 鏈疆楠岃瘉宸查€氳繃锛?  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 褰撳墠鍋氬埌鍝竴姝ワ細
  - `users / comments / moderation / reports / media-tasks / audit-logs` 杩欎簺鍚庡彴鏍稿績娌荤悊椤甸兘宸茬粡杩涗竴姝ユ敹鍙ｅ埌鈥滅湡鏁版嵁浼樺厛锛屼笉鍐嶆贩鍋囩瓫閫?鍋囧垎椤?鍋囪鎯呪€濈殑鐘舵€?  - 褰撳墠鏇撮€傚悎缁х画娓呯悊鍓╀綑 fallback 椤碉紝鎴栬浆鍥炵ぞ鍖哄叡浜悗绔墿浣欎换鍔?- 涓嬫鍏堝仛浠€涔堬細
  - 浼樺厛缁х画鏀?`taxonomy` 鐨?fallback 鍗犱綅鍥為€€
  - 鎴栧洖鍒扮ぞ鍖轰富绾?`T5 / C4` 缁х画鎺ㄨ繘鍏变韩鍚庣鑳藉姏

### 2026-05-08 taxonomy 鍘婚潤鎬佺ず渚嬪洖閫€

- 鏈疆缁х画鎶?`apps/admin /taxonomy` 浠庘€滅湡瀹炶鍐欏凡鎺ラ€氾紝浣嗘帴鍙ｅけ璐ユ椂浠嶅洖閫€鏁村闈欐€佺ず渚嬪垎绫烩€濇敹鍙ｅ埌鐪熷疄鑳藉姏杈圭晫锛?  - taxonomy 璇诲彇澶辫触鏃朵笉鍐嶅睍绀烘湰鍦扮ず渚嬫ā鍨嬨€佺ず渚嬪垎绫婚」鍜岀ず渚嬫不鐞嗗娉?  - 澶辫触鎬佺幇鍦ㄧ粺涓€琛ㄧ幇涓猴細
    - 缁熻鍗″綊闆?    - 鏉垮潡鍒楄〃涓虹┖
    - 缂栬緫鍖轰笉鍙啓
    - 椤甸潰鏄庣‘鎻愮ず搴斿厛鎺掓煡鐪熷疄鍚庣璇锋眰
- 杩欒疆鍚屾椂琛ヤ簡绌烘澘鍧椾繚鎶わ細
  - `sections` 涓虹┖鏃朵笉鍐嶇户缁覆鏌?tab銆佹爲鍜岄粯璁ら€変腑椤癸紝閬垮厤鎺ュ彛澶辫触鏃跺張鍥犱负 UI 绌哄紩鐢ㄤ骇鐢熺浜屽眰寮傚父
- 鏈疆楠岃瘉宸查€氳繃锛?  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 褰撳墠鍋氬埌鍝竴姝ワ細
  - 鍚庡彴鏍稿績娌荤悊椤甸噷锛宍taxonomy` 涔熷凡涓嶅啀鐢ㄩ潤鎬佺ず渚嬫暟鎹帺鐩栫湡瀹炴帴鍙ｅ紓甯?  - 鍚庡彴绗竴闃舵鐜板湪鍓╀綑鐨勨€滅湡閾捐矾宸叉帴浣嗕粛娣烽潤鎬佺ず渚嬧€濈殑鐐瑰凡缁忔槑鏄惧彉灏?- 涓嬫鍏堝仛浠€涔堬細
  - 鍥炲埌绀惧尯涓荤嚎 `T5 / C4` 缁х画鎺ㄨ繘鍏变韩鍚庣鑳藉姏
  - 鎴栫户缁壂鍚庡彴鍓╀綑鍙傝€冨３椤电殑闈欐€佸洖閫€娈嬬暀

### 2026-05-08 A7 smoke + 娴忚鍣ㄩ獙鏀舵敹鍙?
- `A7-3 / A7-4` 宸插湪鏈疆姝ｅ紡缁撴锛?  - 宸叉柊澧炲苟钀借处鏈€灏忛獙鏀舵竻鍗曪細`docs/04_瀹炴柦璁捐/鍚庡彴绠＄悊鏈€灏廠moke涓庢祻瑙堝櫒楠屾敹娓呭崟-2026-05-08.md`
  - 鏈湴绠＄悊鍛樿处鍙?`admin-chief / dramatv-admin-demo` 宸插畬鎴愪竴杞悗鍙版祻瑙堝櫒绾?smoke
  - 鏈疆閫氳繃椤靛寘鎷細
    - `/dashboard`
    - `/users`
    - `/comments`
    - `/moderation`
    - `/reports`
    - `/feed-ops/home`
    - `/feed-ops/featured`
    - `/feed-ops/discussions`
    - `/media-tasks`
    - `/audit-logs`
- 鏈疆鏄庣‘鏀舵帀涓€涓湡瀹炶繍琛屾€侀樆濉烇紝涓嶆槸婧愮爜閫昏緫缂哄け锛?  - `feed-ops/home` 鏈€鍒濇姤 `500`
  - 鍚庣 `error.log` 宸插畾浣嶆牴鍥犱负鏃ц繍琛岃繘绋嬩粛寮曠敤 `AdminFeedOpsHomeResponse$Slot`
  - 澶勭悊鏂瑰紡涓嶆槸鏀瑰墠绔?fallback锛岃€屾槸锛?    - 鍏堢‘璁?`18080` 鐩戝惉鐨勬槸鏃?Java 杩涚▼
    - 鍐嶆墽琛?`apps/server clean compile`
    - 鐒跺悗閲嶅惎 `scripts/start-server-dev-18080.ps1`
  - 閲嶅惎鍒版渶鏂?`apps/server` 浠ｇ爜鍚庯紝`feed-ops/home` 涓庡悗缁〉闈?smoke 宸插叏閮ㄦ仮澶嶉€氳繃
- 杩欒疆椤烘墜缁х画鏀舵帀涓€涓€滅湡鍔ㄤ綔 + 鍗婂崰浣嶅３鈥濈殑娈嬬暀鐐癸細
  - `apps/admin /reports` 涔嬪墠铏界劧璇︽儏涓庡姩浣滃凡鎺ョ湡鍚庣锛屼絾绛涢€夊尯銆佸垎椤靛尯鍜岀┖鎬佷粛娣锋湁鍋囦氦浜?  - 鐜板湪宸叉敼涓猴細
    - 鐪熷疄 `q / status / targetType / reason` 绛涢€?    - 绌虹粨鏋滄椂鏄剧ず鐪熷疄绌烘€侊紝涓嶅啀娣峰叆鍋囧伐鍗?    - 绉婚櫎鍋囧垎椤典笌鍋団€滃鐞嗕汉 / 鏃堕棿 / 椋庨櫓绛夌骇鈥濈瓫閫夊３
    - 宸ュ崟鍔ㄤ綔鎵ц鍚庝繚鐣欏綋鍓嶇瓫閫夋潯浠惰繑鍥?- 鏈疆楠岃瘉宸查€氳繃锛?  - `apps/server -> .\\scripts\\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminReportApiIntegrationTest test`
  - `apps/admin -> npx.cmd tsc --noEmit -p tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 褰撳墠鍋氬埌鍝竴姝ワ細
  - 鍚庡彴绠＄悊绾垮綋鍓嶇涓€闃舵鐪熼〉闈€佺湡瀹炲姩浣滃拰鏈€灏忔祻瑙堝櫒楠屾敹宸插叏閮ㄦ敹鍙?  - 鐜伴樁娈靛墿浣欏伐浣滀笉鍐嶆槸鈥滆ˉ鍚庡彴澹抽〉鈥濓紝鑰屾槸缁х画鍋氭洿缁嗙殑娌荤悊鑳藉姏鍜屼笌绀惧尯涓荤嚎鐨勫叡浜悗绔敹鍙?- 涓嬫鍏堝仛浠€涔堬細
  - 鍥炲埌绀惧尯涓荤嚎鍚庣璐︽湰锛岀户缁帹杩?`T5` 鐨勫墿浣欐不鐞嗚仈鍔ㄩ」
  - 鎴栫户缁ˉ鍚庡彴 `reports` / `moderation` 鐨勬洿缁嗙姸鎬佽涔変笌绛涢€夎兘鍔?
### 2026-05-08 audit-logs / media-tasks 鍘诲崐鍗犱綅鏀跺彛

- 鏈疆缁х画鎸夆€滃凡鎺ョ湡鍚庣鐨勯〉闈笉鍐嶄繚鐣欏亣绛涢€夈€佸亣鍒嗛〉銆佸亣璇︽儏璇存槑鈥濈殑瑙勫垯锛屾敹鎺変袱涓墿浣欏崐鍗犱綅椤碉細
  - `apps/admin /audit-logs`
  - `apps/admin /media-tasks`
- `audit-logs` 鏈疆宸叉敼涓哄彧鏆撮湶鐪熷疄鍚庣鏀寔鐨勭瓫閫夎兘鍔涳細
  - `q / module / result / risk`
  - 绉婚櫎鍘熷厛鏁村潡闈欐€?chip 绛涢€夊３涓庘€滅瓫閫夎仈鍔ㄤ笅涓€杞ˉ榻愨€濇彁绀?  - 绌虹粨鏋滄椂鏄剧ず鐪熷疄绌烘€侊紝涓嶅啀娣峰叆鍗犱綅鏃ュ織
  - 璇︽儏璇诲彇澶辫触鏃跺彧閫€鍥炲綋鍓嶅垪琛ㄦ憳瑕侊紝涓嶅啀浼鎴愬畬鏁村崰浣嶈鎯?- `media-tasks` 鏈疆宸叉敼涓哄彧鏆撮湶鐪熷疄鍚庣鏀寔鐨勭瓫閫夎兘鍔涳細
  - `q / status / targetType`
  - 绉婚櫎鍘熷厛鏈帴鑳藉姏澹筹細`鎵ц闃熷垪 / 閲嶈瘯鑳藉姏 / 鏃堕棿鑼冨洿 / 鍋囧垎椤礰
  - 璇︽儏鍖衡€滃叧鑱斿叆鍙ｂ€濇敼鎴愮湡瀹炶烦杞細
    - 鍏宠仈鍐呭 -> `/moderation?selectedType=...&selectedId=...`
    - 鎻愪氦鐢ㄦ埛 -> `/users?selected=...`
  - 搴曢儴鍙繚鐣欑湡瀹?`retry` 鍔ㄤ綔鍜岀湡瀹炲叧鑱旈摼鎺ワ紝涓嶅啀淇濈暀姝绘寜閽?- 杩欒疆鍚屾琛ヤ簡鏈嶅姟灞傜湡瀹炴煡璇㈠弬鏁帮細
  - `listAdminAuditLogs()` 鐜版敮鎸?`q / module / result / risk`
  - `listAdminMediaTasks()` 鐜版敮鎸?`q / status / targetType`
  - `retryMediaTaskAction` 鐜板湪浼氫繚鐣欏綋鍓嶇瓫閫夋潯浠跺洖璺?- 鏈疆楠岃瘉宸查€氳繃锛?  - `apps/admin -> npx.cmd tsc --noEmit -p tsconfig.json`
  - `apps/admin -> npm.cmd run build`
  - 娴忚鍣ㄧ骇澶嶉獙锛?    - `/audit-logs` 绌虹瓫閫?`q=no-such-audit-log-keyword-xyz&module=media_tasks&result=failed&risk=sensitive` 鏄剧ず鐪熷疄绌烘€?    - `/media-tasks` 绌虹瓫閫?`q=no-such-media-task-keyword-xyz&status=failed&targetType=video` 鏄剧ず鐪熷疄绌烘€?- 褰撳墠鍋氬埌鍝竴姝ワ細
  - 鍚庡彴绗竴闃舵涓昏鐪熼〉闈㈢幇鍦ㄥ凡缁忎笉鍙€滄帴鍙ｆ帴鐪熲€濓紝杩炵瓫閫?绌烘€?璇︽儏闄嶇骇绛栫暐涔熷熀鏈敹鍙ｅ埌鐪熷疄鑳藉姏杈圭晫
  - 褰撳墠鍚庡彴鍓╀綑宸ヤ綔鏇村亸璇箟缁嗗寲鍜屾不鐞嗚兘鍔涙墿灞曪紝涓嶅啀鏄ぇ闈㈢Н鍘诲崰浣嶅３
- 涓嬫鍏堝仛浠€涔堬細
  - 浼樺厛缁х画鏀?`moderation` 鐨勫亣绛涢€夊３锛屾敼鎴愬彧灞曠ず鐪熷疄鍚庣鏀寔鐨勭瓫閫?  - 鎴栫户缁墦纾?`reports` 鐨勭姸鎬佽涔変笌鍔ㄤ綔鏂囨

### 2026-05-08 moderation 鍘诲崐鍗犱綅鏀跺彛

- 鏈疆缁х画鎶?`apps/admin /moderation` 浠庘€滃姩浣滄帴鐪熴€佺瓫閫夊拰鍒嗛〉浠嶆槸鍙傝€冨３鈥濇敹鍙ｅ埌鐪熷疄鑳藉姏杈圭晫锛?  - 鏈嶅姟灞?`listAdminModerationItems()` 宸叉敮鎸佺湡瀹?`q / targetType / status`
  - 鍓嶇绛涢€夊尯宸叉敼鎴愮湡瀹炶〃鍗曪紝涓嶅啀灞曠ず鍋囦綔鑰呰緭鍏ュ３銆佸亣椋庨櫓绛涢€夈€佸亣鏃堕棿鑼冨洿澹?  - 鍒楄〃搴曢儴宸茬Щ闄ゅ亣鍒嗛〉锛屽彧淇濈暀鈥滃浐瀹氭渶杩?80 鏉♀€濊繖涓€鐪熷疄鍚庣闄愬埗鎻愮ず
  - 绌虹粨鏋滄椂鏄剧ず鐪熷疄绌烘€侊紝涓嶅啀鍥為€€ `FALLBACK_ROWS`
  - 璇︽儏璇诲彇澶辫触鏃跺彧閫€鍥炲綋鍓嶅垪琛ㄦ憳瑕侊紝涓嶅啀浼鎴愬畬鏁村崰浣嶈鎯?- 鏈疆鍚屾琛ヤ簡鍔ㄤ綔鍥炶烦淇濆弬锛?  - `approve / reject / offline / restore` 鎵ц鍚庝細淇濈暀褰撳墠 `q / targetType / status / selectedType / selectedId`
  - 澶辫触鏃朵篃浼氬甫鐫€褰撳墠绛涢€夋潯浠跺拰 `requestId` 杩斿洖鍘熼〉
- 鏈疆楠岃瘉宸查€氳繃锛?  - `apps/admin -> npx.cmd tsc --noEmit -p tsconfig.json`
  - `apps/admin -> npm.cmd run build`
  - 娴忚鍣ㄧ骇澶嶉獙锛?    - `/moderation` 棣栧睆鏄剧ず鈥滃鏍稿垪琛ㄣ€佽鎯呫€佸姩浣滃拰 q / 鍐呭绫诲瀷 / 瀹℃牳鐘舵€佺瓫閫夐兘宸叉帴鍏ョ湡瀹炲悗绔€?    - 绌虹瓫閫?`q=no-such-moderation-keyword-xyz&targetType=workflow&status=taken_down` 鏄剧ず鐪熷疄绌烘€?- 褰撳墠鍋氬埌鍝竴姝ワ細
  - 鍚庡彴涓昏娌荤悊椤?`reports / audit-logs / media-tasks / moderation` 閮藉凡浠庘€滃崐鐪熷崐鍋団€濊繘涓€姝ユ敹鍙ｅ埌鐪熷疄鍚庣鑳藉姏杈圭晫
  - 鍚庣画鍚庡彴鍓╀綑宸ヤ綔鏇村亸涓氬姟璇箟銆佸瓧娈电簿淇拰娌荤悊鑳藉姏鎵╁睍
- 涓嬫鍏堝仛浠€涔堬細
  - 浼樺厛缁х画鏀?`comments` 鐨勫垎椤?鍗犱綅鎻愮ず娈嬬暀
  - 鎴栫户缁粏鍖?`reports` / `moderation` 鐨勭姸鎬佽涔夊拰鍔ㄤ綔鏂囨

### 2026-05-08 comments 鍘诲崐鍗犱綅鏀跺彛

- 鏈疆缁х画鎶?`apps/admin /comments` 浠庘€滅湡鎺ュ彛宸查€氾紝浣嗙瓫閫?鍒嗛〉/渚ф爮浠嶆贩鍙傝€冨３鈥濇敹鍙ｅ埌鐪熷疄鑳藉姏杈圭晫锛?  - 鏈嶅姟灞?`listAdminComments()` 宸叉敮鎸佺湡瀹?`q / status / targetType / reportedOnly`
  - 鍓嶇绛涢€夊尯宸叉敼鎴愮湡瀹炶〃鍗曪紝涓嶅啀灞曠ず鍋団€滆瘎璁虹被鍨?/ 椋庨櫓鐘舵€?/ 鏄惁鍏抽棴璇勮鍖?/ 鍙戝竷鏃堕棿 / 璇勮浣滆€呪€濆３
  - 鍒楄〃搴曢儴宸茬Щ闄ゅ亣鍒嗛〉锛屽彧淇濈暀鈥滃浐瀹氭渶杩?80 鏉♀€濊繖涓€鐪熷疄鍚庣闄愬埗鎻愮ず
  - 绌虹粨鏋滄椂鏄剧ず鐪熷疄绌烘€侊紝涓嶅啀鍥為€€ `FALLBACK_COMMENT_ROWS`
  - 渚ф爮鍙睍绀虹湡瀹炶瘎璁轰笂涓嬫枃銆佷妇鎶ユ憳瑕佸拰璇勮鍖哄紑鍏崇姸鎬侊紝涓嶅啀浼娌荤悊鏃ュ織鎴栧崰浣嶅娉?- 鏈疆鍚屾琛ヤ簡璇勮鍔ㄤ綔鍥炶烦淇濆弬锛?  - `hide / restore / delete / toggle comment target settings` 鎵ц鍚庝細淇濈暀褰撳墠 `q / status / targetType / reportedOnly / selected`
  - 澶辫触鏃朵篃浼氬甫鐫€褰撳墠绛涢€夋潯浠跺拰 `requestId` 杩斿洖鍘熼〉
- 鏈疆楠岃瘉宸查€氳繃锛?  - `apps/admin -> npx.cmd tsc --noEmit -p tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 褰撳墠鍋氬埌鍝竴姝ワ細
  - 鍚庡彴涓昏娌荤悊椤?`comments / moderation / reports / media-tasks / audit-logs` 閮藉凡浠庘€滃崐鐪熷崐鍋団€濊繘涓€姝ユ敹鍙ｅ埌鐪熷疄鍚庣鑳藉姏杈圭晫
  - 鍚庣画鍚庡彴宸ヤ綔鏇村亸涓氬姟璇箟缁嗗寲鍜屾墿灞曟不鐞嗗姩浣滐紝涓嶅啀鏄ぇ闈㈢Н鍘诲崰浣嶅３
- 涓嬫鍏堝仛浠€涔堬細
  - 鍏堣ˉ `comments` 鐨勬祻瑙堝櫒绾?smoke 璁板綍
  - 鍐嶅洖鍒?`reports / moderation` 鐨勭姸鎬佽涔夊拰鍔ㄤ綔鏂囨缁嗗寲

### 2026-05-08 reports 鐘舵€佽涔夋敹鍙?
- 鏈疆缁х画鏀?`apps/admin /reports` 涓?`apps/server admin/reports` 涔嬮棿杩樻畫鐣欑殑鐘舵€佽涔夋涔夛紝涓嶅啀璁┾€滃叧闂伐鍗曗€濆悓鏃舵寚浠?`resolved` 鍜?`closed`锛?  - 鍚庣 `closeReport()` 鐜版敼涓虹湡瀹炰袱娈靛紡锛?    - `pending / processing -> resolved`锛屽墠绔涔変负鈥滄爣璁板凡澶勭悊鈥?    - `resolved -> closed`锛屽墠绔涔変负鈥滃綊妗ｅ叧闂€?  - 鍚庣鍚屾淇帀涓€涓姸鎬佸洖閫€ bug锛?    - 宸茬粡 `closed` 鐨勫伐鍗曞啀娆¤皟鐢?`/close` 涓嶄細鍐嶉敊璇洖閫€鎴?`resolved`
  - 瀹¤鏃ュ織涓庤鎯呮椂闂寸嚎鏂囨宸茶窡闅忕湡瀹炵姸鎬佸睍绀猴紝涓嶅啀绗肩粺鍐欌€滃伐鍗曞凡鍏抽棴鈥?- 鍓嶇 `/reports` 鏈疆鍚屾鏀跺彛锛?  - 椤堕儴缁熻鍗′粠鈥滃凡鍏抽棴宸ュ崟鈥濇敼涓衡€滃凡澶勭悊 / 褰掓。鈥?  - `closed` 鐘舵€佹枃妗堟敼涓衡€滃凡褰掓。鈥?  - 璇︽儏渚ф爮鍔ㄤ綔鎸夐挳鎸夊綋鍓嶇湡瀹炵姸鎬佸垏鎹负锛?    - 鏈鐞嗗畬鎴愭椂锛歚鏍囪宸插鐞哷
    - 宸插鐞嗗悗锛歚褰掓。鍏抽棴`
  - 涔嬪墠璇︽儏閲岀殑鈥滆仈鍔ㄥ鐞嗗缓璁€濅吉鎸夐挳宸叉敼涓洪潪浜や簰鎻愮ず chip锛屼笉鍐嶈瀵兼垚鍙偣鍑诲姩浣?- 鏈疆楠岃瘉宸查€氳繃锛?  - `apps/admin -> npx.cmd tsc --noEmit -p tsconfig.json`
  - `apps/admin -> npm.cmd run build`
  - `apps/server -> .\\scripts\\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminReportApiIntegrationTest test`
- 褰撳墠鍋氬埌鍝竴姝ワ細
  - `reports` 褰撳墠涓婚摼璺凡缁忎笉鍙槸鐪熸帴鍙ｅ彲鐢紝杩?`pending / processing / resolved / closed` 鐨勫墠鍚庣璇箟涔熷凡鍩烘湰瀵归綈
  - 鍚庣画濡傛灉缁х画鎵撶（ `reports`锛岄噸鐐逛細杞悜鏇寸粏鐨勫鐞嗚褰曞拰璇佹嵁涓婁笅鏂囷紝鑰屼笉鏄姸鎬佸悕娣风敤
- 涓嬫鍏堝仛浠€涔堬細
  - 鍏堣ˉ `/reports` 娴忚鍣ㄧ骇 smoke 璁板綍
  - 鍐嶇户缁敹 `moderation` 鐨勭姸鎬佽涔夊拰鍔ㄤ綔澶囨敞琛ㄨ揪

### 2026-05-07 media-tasks / audit-logs 鐪熸帓闅滈摼璺敹鍙?
- `A5 濯掍綋浠诲姟涓庢帓闅滀腑蹇僠 宸插湪鏈疆姝ｅ紡缁撴锛?  - `apps/server` 宸茶ˉ鐪熷疄鍚庡彴鎿嶄綔鏃ュ織琛ㄨ縼绉伙細`V22__add_admin_operation_logs.sql`
  - `GET /api/admin/media-tasks` 宸茬敤浜庢敮鎾戝悗鍙扮湡瀹炲獟浣撲换鍔″垪琛ㄣ€佺姸鎬併€佸け璐ユ憳瑕佷笌閲嶈瘯鍏ュ彛灞曠ず
  - `GET /api/admin/audit-logs`
  - `GET /api/admin/audit-logs/{logId}`
  - 鍚庡彴瀹¤鏃ュ織宸蹭笉鍐嶄緷璧栦笉绋冲畾鐨?filter 椤哄簭锛岃€屾槸鏀规垚鍦ㄦ垚鍔熷啓鎿嶄綔鏈嶅姟閲屾樉寮忚惤鏃ュ織
  - 褰撳墠宸茶鐩栵細`auth / comments / media-tasks / moderation / reports / taxonomy / feed-ops`
- `apps/admin` 宸叉妸 `/media-tasks` 涓?`/audit-logs` 浠庡弬鑰冨崰浣嶉〉鍒囧埌鐪熷疄鏁版嵁浼樺厛锛?  - `/media-tasks` 褰撳墠璇诲彇鐪熷疄浠诲姟鍒楄〃涓庢憳瑕侊紝淇濈暀澶辫触鍥為€€鎬?  - `/audit-logs` 褰撳墠璇诲彇鐪熷疄鎿嶄綔鏃ュ織鍒楄〃涓庤鎯咃紝鏀寔璇︽儏闈㈡澘鏌ョ湅
- 鏈疆浠ｇ爜楠岃瘉宸查€氳繃锛?  - `apps/admin -> npm.cmd run build`
  - `apps/server -> .\\scripts\\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminAuditLogApiIntegrationTest,AdminCommentApiIntegrationTest,AdminMediaTaskApiIntegrationTest test`
- 褰撳墠鍋氬埌鍝竴姝ワ細
  - 鍚庡彴鐪熸不鐞?鎺掗殰椤靛凡瑕嗙洊锛歚users / comments / moderation / reports / taxonomy / feed-ops / media-tasks / audit-logs`
  - 鍚庡彴褰撳墠涓昏鍓╀綑鐪熼摼璺凡鏀跺彛鍒帮細`users detail / account governance / dashboard overview`
- 涓嬫鍏堝仛浠€涔堬細
  - 浼樺厛鍒?`A6 users detail / account governance`
  - 鎴栬ˉ `A7 dashboard overview + 鏈€灏?smoke`

### 2026-05-07 users detail / account governance 绗竴鎵圭湡闂幆

- `A6` 宸插湪鏈疆钀界涓€鎵圭湡瀹炴不鐞嗚兘鍔涳紝涓嶅啀鍙湁 users 鍒楄〃锛?  - 鍚庣鏂板 `GET /api/admin/users/{userId}`
  - 鍚庣鏂板 `PUT /api/admin/users/{userId}/governance`

### 2026-05-21 feed-ops 资源加载策略收口

- 本轮继续收口 `apps/admin /feed-ops/*` 的媒体加载方式，目标是让运营配置页在“可见全量候选资源”的前提下，仍然保持和社区前台一致的轻量加载策略：
  - 候选池继续走分页浏览，不回退成整池一次性挂载
  - 所有缩略图区默认只挂静态封面 / poster，不再在列表、预览区、编排区提前挂载视频
  - 需要看真实视频时改成“点击缩略图打开预览弹窗”，只在弹窗内挂单个 `video`
- 本轮前端落地：
  - `FeedOpsPageClient` 全面移除首页运营页原有的缩略图自动视频预览逻辑
  - 为候选池、右侧预览区、编排工作区、已挂载内容区统一补上点击预览入口
  - 新增 `FeedOpsMediaPreview`，统一承接图片 / 视频放大预览
  - `feed-ops-media.ts` 补齐 `sourceUrl` 解析，并按资源地址判断是否属于可播放视频
- 本轮验证已通过：
  - `apps/admin -> npx.cmd tsc --noEmit -p tsconfig.json`
  - 浏览器级验证：
    - `/feed-ops/home` 首屏 `video` 节点数为 `0`
    - 点击视频缩略图后只出现 `1` 个弹窗视频节点
    - 关闭弹窗后 `video` 节点回到 `0`
    - `/feed-ops/featured` 首屏 `video` 节点数为 `0`
    - `/feed-ops/discussions` 首屏 `video` 节点数为 `0`
- 当前做到哪一步：
  - 运营配置共享页面已经从“列表区可能主动挂视频”收口到“静态缩略图优先，点击后单资源预览”
  - 这次改动不影响真实数据联动，仍保持后台对前台展示内容的真实编排能力
- 下次先做什么：
  - 继续处理 `feed-ops` 媒体 404 的资源映射问题，补齐少量本地图片路径在后台域名下无法直接访问的情况
  - 再视用户验收结果决定是否给运营配置页补“仅看视频 / 仅看图片”之外的更细粒度筛选
  - 褰撳墠璇︽儏鎺ュ彛宸茶ˉ锛氳处鍙峰熀纭€淇℃伅銆佸唴瀹圭粺璁°€佷簰鍔ㄦ矇娣€銆佹不鐞嗘憳瑕併€佹渶杩戝唴瀹?  - 褰撳墠娌荤悊鎺ュ彛宸茶ˉ锛氳处鍙风姸鎬佽皟鏁淬€佸悗鍙拌鑹茶皟鏁淬€佺鐢ㄥ悗鎾ら攢鐜版湁鐧诲綍鎬?- 褰撳墠璐﹀彿娌荤悊鏉冮檺杈圭晫宸插厛鏀朵弗锛?  - `admin / operator / moderator` 閮藉彲璇荤敤鎴疯鎯?  - 鍙湁 `admin / operator` 鍙敼瑙掕壊涓庣姸鎬?  - `operator` 涓嶈兘鎶婅处鍙锋彁鎴?`admin`
  - 褰撳墠绠＄悊鍛樹笉鑳芥妸鑷繁绂佺敤鎴栨妸鑷繁闄嶆潈
- 鍚庡彴 `/users` 宸蹭粠鈥滃垪琛?+ 鍋囧脊绐椻€濇敼鍒扳€滃垪琛?+ 鐪熷疄璇︽儏渚ф爮 + 灏卞湴娌荤悊琛ㄥ崟鈥濓細
  - 鍙充晶璇︽儏鍗″綋鍓嶄紭鍏堣鍙栫湡瀹炶鎯呮帴鍙?  - 瑙掕壊涓庣姸鎬佷繚瀛樺凡鎺?server action 鍜岀湡瀹炲悗绔啓鎺ュ彛
  - 鏃х殑鍋囩紪杈戝脊绐楀凡绉婚櫎锛岄伩鍏嶅啀鍑虹幇寮圭獥鍋囨寕杞?鍋囦笅鎷夌殑浜や簰闂
- 褰撳墠鏄庣‘鏈吉瑁呭畬鎴愮殑鑼冨洿锛?  - `A6-3 閲嶇疆瀵嗙爜 / 鍒濆鍖栧瘑鐮乣 鍙畬鎴愪簡鐜扮姸璇勪及锛屾病鏈変吉瑁呮垚鍙敤鑳藉姏
  - 褰撳墠鍚庣铏藉凡鏈?`password_hash` 浣撶郴锛屼絾鍚庡彴瀵嗙爜娌荤悊濂戠害杩樻湭鍗曠嫭鏀跺彛锛屽悗缁啀琛?- 鏈疆楠岃瘉宸查€氳繃锛?  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
  - `apps/server -> .\\scripts\\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminUserGovernanceApiIntegrationTest test`
- 褰撳墠鍋氬埌鍝竴姝ワ細
  - `A6-1 / A6-2 / A6-4` 宸插畬鎴?  - `A6-3` 淇濇寔杩涜涓紝绛夊緟瀵嗙爜娌荤悊绛栫暐鍗曠嫭鏀跺彛
- 涓嬫鍏堝仛浠€涔堬細
  - 缁х画琛?`A6-3 password reset / initialize password`
  - 鎴栧垏 `A7 dashboard overview + 鏈€灏?smoke`

### 2026-05-08 users password governance 鐪熼棴鐜?+ users 椤靛噺灏戝崰浣嶅洖閫€

- `A6-3` 宸插湪鏈疆姝ｅ紡缁撴锛屼笉鍐嶆妸鈥滈噸缃瘑鐮?/ 鍒濆鍖栧瘑鐮佲€濇寕鎴愮伆鑹插崰浣嶆寜閽細
  - 鍚庣鏂板 `POST /api/admin/users/{userId}/password/reset`
  - 褰撳墠鐪熷疄琛屼负浼氬尯鍒嗭細
    - 宸叉湁鏈湴瀵嗙爜璐﹀彿 -> `reset`
    - 鏃犳湰鍦板瘑鐮佽处鍙?-> `initialize`
  - 褰撳墠鐪熷疄瀵嗙爜娌荤悊浼氬悓鏃讹細
    - 鐢熸垚鏂扮殑涓存椂瀵嗙爜
    - 鏇存柊 `users.password_hash`
    - 灏?`identity_provider` 鏀跺彛鍒?`local`
    - 鎾ら攢鐩爣璐﹀彿鐜版湁 `auth_sessions`
    - 鍐欏叆 `admin_operation_logs`
- 褰撳墠鏉冮檺涓庝繚鎶よ竟鐣屽凡琛ラ綈锛?  - 鍙湁 `admin / operator` 鍙墽琛屽瘑鐮佹不鐞?  - 涓嶈兘缁欏綋鍓嶇櫥褰曚腑鐨勮嚜宸遍噸缃瘑鐮?  - `operator` 涓嶈兘缁?`admin` 璐﹀彿閲嶇疆瀵嗙爜
- `apps/admin /users` 鏈疆宸插悓姝ユ帴鎴愮湡瀹炲瘑鐮佹不鐞嗗姩浣滐細
  - 鍙充晶璇︽儏鍗＄幇鍦ㄤ細鏄剧ず鐪熷疄瀵嗙爜娌荤悊鐘舵€佷笌鍔ㄤ綔鏂囨锛屼笉鍐嶅啓姝烩€滈噸缃瘑鐮佸緟琛モ€?  - 鎵ц鎴愬姛鍚庝細鍦ㄥ綋鍓嶈鎯呭崱鍥炴樉鏈涓存椂瀵嗙爜鍜屾挙閿€鐧诲綍鎬佹彁绀?- 杩欒疆椤烘墜鏀舵帀涓€涓瀵兼€у崰浣嶈涓猴細
  - 涔嬪墠 `users` 椤靛湪鈥滃垪琛ㄧ湡鏁版嵁鎴愬姛銆佽鎯呮帴鍙ｅけ璐モ€濇椂浼氶潤榛樺洖閫€鎴愬亣璇︽儏
  - 鐜板湪鏀逛负璇︽儏浼樺厛璇荤湡锛屽け璐ュ氨鏁翠綋杩涘叆鏄庣‘閿欒鎬侊紝涓嶅啀浼鎴愬凡瀹屽杽鑳藉姏
- 鏈疆楠岃瘉宸查€氳繃锛?  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
  - `apps/server -> .\\scripts\\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminUserGovernanceApiIntegrationTest test`
- 褰撳墠鍋氬埌鍝竴姝ワ細
  - `A6` 鍥涗釜瀛愰」宸插叏閮ㄥ畬鎴?  - 鍚庡彴褰撳墠鍓╀綑涓讳换鍔″凡鏀跺彛鍒?`A7 dashboard overview + smoke + browser acceptance`
- 涓嬫鍏堝仛浠€涔堬細
  - 鍏堣ˉ `A7-1 / A7-2 dashboard overview`
  - 鍐嶅仛 `A7-3 / A7-4` 鍚庡彴鏈€灏?smoke 涓庢祻瑙堝櫒绾ч獙鏀?
### 2026-05-08 dashboard overview 鐪熸帴鍙?+ 姒傝椤电湡鏁版嵁鏀跺彛

- `A7-1 / A7-2` 宸插湪鏈疆涓€璧疯惤鍦帮紝涓嶅啀璁╁悗鍙伴椤电户缁睍绀洪潤鎬佹€昏鍧楋細
  - 鍚庣鏂板 `GET /api/admin/dashboard/overview`
  - 褰撳墠 overview 宸茬洿鎺ヨ仛鍚堢湡瀹炶〃锛?    - `audit_records` 寰呭鏍搁槦鍒?    - `report_tickets` 寰呭鐞嗕妇鎶?    - `async_task_records` 澶辫触濯掍綋浠诲姟
    - `users` 璐﹀彿鎬婚噺 / 闈炴椿璺?/ 鍚庡彴璐﹀彿
  - 褰撳墠杩斿洖缁撴瀯宸茶鐩栵細
    - `summary`
    - `moderationQueue`
    - `latestReports`
    - `failedMediaTasks`
    - `userWatchItems`
- `apps/admin /dashboard` 宸蹭粠闈欐€佸弬鑰冮〉鍒囧埌鐪熷疄 overview锛?  - 椤堕儴缁熻鍗°€佸緟瀹℃牳闃熷垪銆佹渶鏂颁妇鎶ャ€佸け璐ヤ换鍔°€佽处鍙峰叧娉ㄥ叏閮ㄤ紭鍏堣鐪熷疄鎺ュ彛
  - 蹇嵎鍏ュ彛宸叉寜褰撳墠鐧诲綍鍚庡彴瑙掕壊瑁佸壀锛岄伩鍏嶅啀鍑虹幇鐐硅繘鍘诲氨鏄?`403`
  - 褰撳墠濡傛灉 overview 鎺ュ彛寮傚父锛屼細鏄庣‘鏄剧ず閿欒鎬侊紝涓嶅啀闈欓粯鍥為€€鎴愬亣鎬昏
- 鏈疆楠岃瘉宸查€氳繃锛?  - `apps/server -> .\\scripts\\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminDashboardOverviewApiIntegrationTest test`
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 褰撳墠鍋氬埌鍝竴姝ワ細
  - `A7-1 / A7-2` 宸插畬鎴?  - 鍚庡彴褰撳墠鍓╀綑涓讳换鍔″凡鏀跺彛鍒?`A7-3 / A7-4`
- 涓嬫鍏堝仛浠€涔堬細
  - 鍏堝缓绔嬪悗鍙版渶灏?smoke 娓呭崟
  - 鍐嶅仛涓€杞悗鍙版祻瑙堝櫒绾ч獙鏀跺苟鍥炲～杩涘害璁板綍

### 2026-05-06 taxonomy 鍙啓娌荤悊鏀跺彛 + feed-ops/home 鐪熼厤缃涓€鍒€

- `A3-4 taxonomy 鍙啓娌荤悊` 宸插湪鏈疆姝ｅ紡缁撴锛?  - 鍚庣宸茶惤 `V20__add_admin_taxonomy_configs.sql`
  - `GET /api/admin/taxonomy` 鐜板湪浼氭妸鐪熷疄 taxonomy 鑱氬悎缁撴灉鍜屾不鐞嗛厤缃?overlay 鍚堝苟杩斿洖
  - `PUT /api/admin/taxonomy` 宸叉敮鎸佺湡瀹炲啓鍏?`statusCode / sortOrder / exposureFlags / noteText`
  - 鍚庡彴 `/taxonomy` 鍙充晶娌荤悊琛ㄥ崟涓嶅啀鏄崰浣嶏紝鍙啓鐪熷疄瀛樺湪鐨?taxonomy 椤癸紝涓嶉澶栧彂鏄庣浜屽鍒嗙被妯″瀷
- 鏈疆缁х画鍚姩 `A4`锛屼絾鍙厛鍒囨渶灏忕湡瀹為棴鐜細`feed-ops/home`
  - 鍚庣鏂板杩佺Щ `V21__add_admin_feed_slot_configs.sql`
  - 鏂板 `apps/server/src/main/java/com/dramatv/community/admin/feedops/*`
  - 鏂板鎺ュ彛锛?    - `GET /api/admin/feed-ops/home`
    - `PUT /api/admin/feed-ops/home`
  - 褰撳墠鐪熷疄瀛樺偍绛栫暐涓嶆槸澶嶅埗绀惧尯鍐呭锛岃€屾槸鎶婇椤佃繍钀ヤ綅閰嶇疆浣滀负 overlay 钀藉湪 `admin_feed_slot_configs`
  - 閰嶇疆椤瑰彧寮曠敤鐪熷疄绀惧尯瀵硅薄锛歚prompt / workflow / post`
  - 棣栭〉杩愯惀浣嶅綋鍓嶅厛鍥哄畾 4 缁勶細
    - `home-hero`
    - `home-hot`
    - `home-recommend`
    - `discussion-pinned`
- `apps/admin /feed-ops/home` 宸蹭粠绾崰浣嶄氦浜掗〉鍒囧埌鐪熷疄閰嶇疆椤碉細
  - 椤甸潰棣栧睆璇诲彇鐪熷疄 `candidatePool + slots + summary`
  - 鈥滀繚瀛樿崏绋?/ 鍙戝竷鐢熸晥鈥?宸叉帴 server action 鍜岀湡瀹炲悗绔啓鍏?  - 寮圭獥鍐呭€欓€夊唴瀹广€佸凡閫夋帓搴忋€佺Щ闄ゃ€佹竻绌恒€侀瑙堥兘鍥寸粫鐪熷疄閰嶇疆鐘舵€佽繍琛?  - `featured / discussions` 浠嶄繚鎸佸崰浣嶉〉锛岃繖杞病鏈変吉瑁呮垚宸茬粡鎺ョ湡
- 鏈疆楠岃瘉宸查€氳繃锛?  - `apps/server -> AdminFeedOpsHomeApiIntegrationTest`
  - `apps/server -> AdminTaxonomyApiIntegrationTest`
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 褰撳墠鍋氬埌鍝竴姝ワ細
  - taxonomy 宸蹭粠鈥滅湡瀹炶閾捐矾鈥濇帹杩涘埌鈥滅湡瀹炴不鐞嗛摼璺€?  - `A4` 宸蹭笉鏄函寰呭仛锛宍feed-ops/home` 宸插叿澶囩湡瀹炶鍐欏拰鏈€灏忚繍钀ラ棴鐜?- 褰撳墠閬楃暀锛?  - `feed-ops/featured` 涓?`feed-ops/discussions` 浠嶆槸闈欐€佽繍钀ュ３
  - 鍓嶅彴棣栭〉褰撳墠杩樻病鏈夋秷璐?`admin_feed_slot_configs`锛岃繖杞厛瀹屾垚鍚庡彴娌荤悊鍙帮紝涓嶉『鎵嬫敼鍓嶅彴鍒嗗彂閫昏緫
- 涓嬫鍏堝仛浠€涔堬細
  - 缁х画琛?`A4-2 / A4-3`锛屾妸 `featured / discussions` 鐨勮繍钀ラ厤缃寜鍚屾牱妯″紡鎺ュ埌鐪熷疄鍚庣
  - 鎴栬浼樺厛绾у垏鍘?`A5 media-tasks / audit-logs`

### 2026-05-06 feed-ops 鍏ㄩ〉鐪熼厤缃敹鍙?
- `A4 杩愯惀缂栨帓涓績` 宸插湪鏈疆姝ｅ紡缁撴锛屼笉鍐嶅彧鏈?`home` 涓€椤垫帴鐪燂細
  - 鍚庣 `admin/feed-ops` 宸蹭粠鍗曢〉鎵╁埌涓夐〉缁熶竴閰嶇疆鎺ュ彛锛?    - `GET /api/admin/feed-ops/home`
    - `PUT /api/admin/feed-ops/home`
    - `GET /api/admin/feed-ops/featured`
    - `PUT /api/admin/feed-ops/featured`
    - `GET /api/admin/feed-ops/discussions`
    - `PUT /api/admin/feed-ops/discussions`
  - `apps/server/src/main/java/com/dramatv/community/admin/feedops/AdminFeedOpsService.java` 宸叉敼鎴愮粺涓€ page-definition 妯″紡锛屼笉鍐嶄负 `home / featured / discussions` 缁存姢涓夊鍓茶 service
  - `featured` 褰撳墠鐪熷疄杩愯惀浣嶅浐瀹氫负 4 缁勶細
    - `featured-main`
    - `featured-workflows`
    - `featured-newcomers`
    - `featured-discussions`
  - `discussions` 褰撳墠鐪熷疄杩愯惀浣嶅浐瀹氫负 4 缁勶細
    - `discussion-channel-order`
    - `discussion-global-pinned`
    - `discussion-channel-focus`
    - `discussion-home-link`
  - `discussions` 涓嶅啀鏄崐鐪熷崐鍋囩殑璁ㄨ澹抽〉锛岄閬撻『搴忎篃宸茶繘鍏ョ湡瀹炲€欓€夋睜涓庣湡瀹炴寕杞介厤缃紱鍚庡彴鍙互鐩存帴寮曠敤 `discussion_channels` 鍋氶『搴忔不鐞?- `apps/admin /feed-ops/*` 宸插叏閮ㄥ垏鍒扮湡瀹為厤缃鍐欙細
  - `home / featured / discussions` 涓夐〉缁熶竴澶嶇敤 `FeedOpsPageClient`
  - 涓夐〉閮芥敮鎸佺湡瀹?`candidatePool + slots + summary`
  - 涓夐〉閮芥敮鎸佺湡瀹炩€滀繚瀛樿崏绋?/ 鍙戝竷鐢熸晥鈥?  - 涓夐〉閮芥敮鎸佸悓涓€濂楁寕杞戒笌鎺掑簭寮圭獥锛屼笉鍐嶄繚鐣欓潤鎬佸弬鑰冭〃鏍煎３
- 鏈疆楠岃瘉宸查€氳繃锛?  - `apps/server -> AdminFeedOpsHomeApiIntegrationTest`
  - `apps/server -> AdminFeedOpsFeaturedApiIntegrationTest`
  - `apps/server -> AdminFeedOpsDiscussionsApiIntegrationTest`
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
  - 杩愯鎬佷富璺緞妫€鏌ワ細
    - `http://127.0.0.1:3206/feed-ops/home -> 200`
    - `http://127.0.0.1:3206/feed-ops/featured -> 200`
    - `http://127.0.0.1:3206/feed-ops/discussions -> 200`
- 褰撳墠鍋氬埌鍝竴姝ワ細
  - `A4` 宸蹭粠鈥滃彧鏈夐椤垫帴鐪熴€佸叾浣欎袱椤靛崰浣嶁€濇帹杩涘埌鈥滃悗鍙拌繍钀ョ紪鎺掍腑蹇冧笁椤电粺涓€鐪熷疄鍖栤€?  - 褰撳墠鍚庡彴鐪熸不鐞嗛〉宸茶鐩栵細`users / comments / moderation / reports / taxonomy / feed-ops`
- 褰撳墠閬楃暀锛?  - 杩欒疆鍙畬鎴愪簡鍚庡彴娌荤悊鍙帮紝涓嶉『鎵嬩慨鏀圭ぞ鍖哄墠鍙板 `admin_feed_slot_configs` 鐨勬秷璐归€昏緫
  - `media-tasks / audit-logs / dashboard overview / users detail` 浠嶆湭杩涘叆鐪熷疄璇诲啓闃舵
- 涓嬫鍏堝仛浠€涔堬細
  - 浼樺厛鍒?`A5 media-tasks / audit-logs`
  - 鎴栧垏 `A6 users detail / role & status management`

### 2026-05-05 reports 鐪熷伐鍗曚腑蹇冩敹鍙?+ taxonomy 鐪熻閾捐矾钀藉湴

- `apps/server` 宸叉柊澧?`admin/taxonomy` 鐪熸煡璇㈡ā鍧楋細
  - `GET /api/admin/taxonomy`
  - 褰撳墠鍥寸粫 `prompt_entries.model_category / content_category / composition_category` 涓変釜姝ｅ紡瀛楁鑱氬悎锛屼笉鍐嶇户缁秷璐归潤鎬?mock taxonomy
- `apps/server` 鏂板鏂囦欢锛?  - `apps/server/src/main/java/com/dramatv/community/admin/taxonomy/AdminTaxonomyController.java`
  - `apps/server/src/main/java/com/dramatv/community/admin/taxonomy/AdminTaxonomyService.java`
  - `apps/server/src/main/java/com/dramatv/community/admin/taxonomy/dto/response/AdminTaxonomyResponse.java`
  - `apps/server/src/test/java/com/dramatv/community/integration/AdminTaxonomyApiIntegrationTest.java`
- `apps/admin` 宸叉妸 `/taxonomy` 浠庣函鍙傝€冮〉鍒囧埌鈥滅湡瀹炲垎绫荤粺璁?+ 瀹炴椂鍒嗙被椤瑰垪琛?+ 鍙璇︽儏鈥濓細
  - `apps/admin/src/lib/admin-service.ts` 宸叉柊澧?`getAdminTaxonomy()`
  - `apps/admin/src/app/(dashboard)/taxonomy/page.tsx` 宸叉敼涓虹湡瀹炴暟鎹紭鍏堣鍙?  - `apps/admin/src/app/(dashboard)/taxonomy/page.module.css` 宸插悓姝ヨˉ鐪熷疄璇婚摼璺墍闇€鏍峰紡
- 杩欒疆 taxonomy 鏈夋剰鍙仛鐪熷疄璇婚摼璺紝涓嶄吉瑁呮垚鍙啓娌荤悊鍙帮細
  - 宸插彲鐢細鍒嗙被缁熻銆佸垎绫婚」鍒楄〃銆佽鐩栦綔鑰呮暟銆佹渶杩戝彂甯冩椂闂淬€佹牱渚嬫爣棰?  - 鏆傛湭鎺ワ細鍚仠銆佹帓搴忋€佸墠鍙版洕鍏夊紑鍏炽€佹壒閲忎慨姝?- `reports` 杩欒疆涔熷凡姝ｅ紡浠庘€滀氦鎺ユ枃妗ｉ噷鐨勬渶楂樹紭鍏堢骇寰呭姙鈥濈粨鎴愮湡宸ュ崟涓績锛?  - 鍚庣 `admin/reports` 妯″潡銆佽鎯呫€佺姸鎬佹祦杞€佽仈鍔ㄤ笅绾裤€佽仈鍔ㄩ殣钘忚瘎璁洪兘宸叉帴閫?  - 鍓嶇 `/reports` 宸茬敤鐪熷疄 `report_tickets`锛屼笉鍐嶅睍绀虹函鍗犱綅鍒楄〃
- 鏈湴杩愯鎬侀獙鏀剁粨鏋滐細
  - 娴忚鍣ㄥ凡瀹炴祴 `reports` 鐨?`鏍囪澶勭悊涓璥
  - 娴忚鍣ㄥ凡瀹炴祴 `reports` 鐨?`鑱斿姩涓嬬嚎鍐呭`锛屽伐鍗曠姸鎬佷細鏀规垚宸插鐞嗭紝鐩爣鍐呭鐘舵€佷細鍙樻垚 `taken_down`
  - 娴忚鍣ㄥ凡瀹炴祴 `reports` 鐨?`鍏抽棴宸ュ崟`锛岄〉闈繚鎸佸湪 `/reports`锛岀粺璁″崱鍜屽垪琛ㄧ姸鎬佷細瀹炴椂鍥炲啓
  - 娴忚鍣ㄥ凡瀹炴祴 `taxonomy` 灞曠ず瀹炴椂鍒嗙被缁熻涓庡垎绫婚」锛屼笉鍐嶆槸鍘熸潵鐨勫亣缂栬緫琛ㄥ崟
- 浠ｇ爜绾ч獙璇佸凡閫氳繃锛?  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
  - `apps/server -> AdminReportApiIntegrationTest`
  - `apps/server -> AdminTaxonomyApiIntegrationTest`
- 鏈疆棰濆纭涓€涓湡瀹炴帓闅滅偣锛?  - `18080` 鑻ヤ笉閲嶅惎鍒版渶鏂?`apps/server` 浠ｇ爜锛宍reports / taxonomy` 椤甸潰浼氱户缁洖閫€鏃ц涓猴紝鐪嬭捣鏉ュ儚鈥滀唬鐮佹病鐢熸晥鈥?  - 杩欒疆宸叉墜鍔ㄥ仠姝㈡棫鍚庣 PID `41204`锛岄噸鍚悗鐩戝惉 PID 鍙樹负 `41720`
- 褰撳墠鍋氬埌鍝竴姝ワ細
  - 鍚庡彴绗竴鎵圭湡娌荤悊椤靛凡鎵╁睍涓?`users / comments / moderation / reports`
  - taxonomy 宸茬粡涓嶅啀鏄潤鎬佸弬鑰冨３锛岃€屾槸杩涘叆鐪熷疄璇婚摼璺樁娈?- 褰撳墠閬楃暀锛?  - `reports` 鐨勨€滃叧闂伐鍗曗€濇寜閽綋鍓嶄細鎶?`processing -> resolved(宸插鐞?`锛岃€屼笉鏄洿鎺ヨ惤鍒?`closed(宸插叧闂?`锛涗笟鍔″姩浣滃彲鐢紝浣嗙姸鎬佽涔夊拰鎸夐挳鏂囨杩樺彲浠ョ户缁敹鍙?  - `3206` 鐨?dev 浼氳瘽閲屼粛鏈?Next HMR websocket 鎻℃墜鍣煶锛岃繖涓嶅奖鍝嶆湰杞笟鍔￠獙鏀讹紝浣嗗悗缁鏋滅户缁仛鍓嶇寮€鍙戜綋楠岋紝闇€瑕佸崟鐙帓鏌ユ湰鍦?dev 杩愯鏂瑰紡
- 涓嬫鍏堝仛浠€涔堬細
  - 缁х画琛?`A3-4`锛屾妸 taxonomy 鐨勫惎鍋?/ 鎺掑簭 / 鏇濆厜娌荤悊浣嶆帴鎴愮湡瀹炲彲鍐欐帴鍙?  - 鎴栫洿鎺ュ垏涓嬩竴鍧?`A4 feed-ops`锛屾妸棣栭〉 / 绮鹃€?/ 璁ㄨ鍖鸿繍钀ラ厤缃粠闈欐€佸３鍒囧埌鐪熷疄閰嶇疆璇诲啓

### 2026-05-05 鍚庡彴浠诲姟鏉块噸鏋?
- 宸叉寜鈥渀澶т换鍔?-> 瀛愪换鍔?-> 鐘舵€佹祦杞鍒檂鈥濋噸鍐欏悗鍙板綋鍓嶇湅鏉匡紝鍚庣画涓嶅啀鍙啓鏉炬暎鐨勪笅涓€姝ヨ鏄庛€?- 褰撳墠浠诲姟鏉胯璁″師鍒欙細
  - 鍏堟妸宸插畬鎴愮殑鍚庡彴鍩虹嚎涓庨鎵规不鐞嗛〉鍗曠嫭缁撴锛岄伩鍏嶅悗缁弽澶嶆贩鍦ㄥ緟鍔為噷
  - 鎶婄湡姝ｈ繕鏈惤鍦扮殑鍚庡彴宸ヤ綔鏀跺彛涓?`涓炬姤 / taxonomy / feed-ops / media-tasks / users 澧炲己 / dashboard 楠屾敹` 鍏粍浠诲姟
  - 姣忎釜澶т换鍔′笅闈㈤兘鎷嗘垚鍙互鍗曠嫭鍕炬帀鐨勫皬浠诲姟锛屾柟渚垮帇缂╁璇濆悗缁х画鎺ㄨ繘
- 鍚庣画鎵ц鍙ｅ緞鍥哄畾涓猴細
  - 瀹屾垚涓€涓皬浠诲姟灏辩珛鍗虫敼鐘舵€?  - 灏忎换鍔″叏瀹屾垚鍚庡啀缁撴帀瀵瑰簲澶т换鍔?  - 璇︾粏瀹屾垚杩囩▼缁х画鍙鍦ㄦ湰鏂囦欢锛屼笉鍥炴祦涓昏繘搴︽枃妗?
### 2026-05-05 鍚庡彴鑱斿姩鍙樻洿璇存槑琛ユ。

- 宸叉柊澧炲悗鍙板紑鍙戜氦鎺ユ枃妗ｏ細`docs/04_瀹炴柦璁捐/鍚庡彴寮€鍙戣繎鏈熻仈鍔ㄥ彉鏇磋鏄?2026-05-05.md`
- 杩欎唤鏂囨。涓嶆槸閲嶅鍐欏悗鍙拌鍒掞紝鑰屾槸涓撻棬缁欏悗鍙板紑鍙戠嚎琛モ€滄渶杩戝嚑澶╁摢浜涚ぞ鍖?鍚庣鏀瑰姩宸茬粡钀藉湴锛屽苟浼氱洿鎺ュ奖鍝嶅悗鍙扮户缁紑鍙戔€濈殑浜ゆ帴璇存槑銆?- 褰撳墠鏂囨。閲嶇偣宸叉槑纭細
  - 鍚庡彴鐪熷疄閾捐矾宸叉帴閫氱殑鑼冨洿锛歚auth / users / comments / moderation`
  - 鍓嶅彴涓炬姤鎻愪氦娴佺▼宸茬粡鐪熷疄钀藉湴鍒?`report_tickets`
  - 鍚庡彴 `reports` 椤靛綋鍓嶄粛鏄崰浣嶆暟鎹紝鍚庣画搴斾紭鍏堟壙鎺ョ湡鎺ュ彛
  - `prompt_entries` 宸叉柊澧?`model_category / content_category / composition_category`
  - 甯栧瓙宸茶ˉ鍏?`audit_records`锛屽鏍告睜涓嶅啀鍙鐩栦綔鍝佺被鍐呭
- 鍚庡彴绾垮悗缁户缁紑鍙戞椂锛屽厛璇昏繖浠戒氦鎺ユ枃妗ｏ紝鍐嶆帴 `reports / taxonomy / feed-ops / media-tasks / audit-logs`锛岄伩鍏嶆寜鏃ц鐭ラ噸澶嶉€犲３鎴栭敊鎺ユ暟鎹簮銆?
### 2026-04-29 comments 鐪熸帴鍙ｉ棴鐜涓€姝?
- 鏈疆鍏堟妸鍚庡彴绾夸笅涓€姝ヤ粠鈥滃ぇ鑰屾硾鐨?moderation / reports / comments鈥濇敹鍙ｆ垚涓€涓彲楠屾敹鐨勫瀭鐩村垏鐗囷細浼樺厛鎵撻€?`comments`銆?- `apps/server` 宸叉柊澧?`admin/comments` 妯″潡锛屽綋鍓嶅凡鎻愪緵锛?  - `GET /api/admin/comments`
  - `POST /api/admin/comments/{commentId}/hide`
  - `POST /api/admin/comments/{commentId}/restore`
  - `DELETE /api/admin/comments/{commentId}`
  - `PATCH /api/admin/comments/targets/{targetType}/{targetId}/settings`
- 杩欐潯閾捐矾娌℃湁鍙﹁捣鍚庡彴涓撶敤璇勮浣撶郴锛岃€屾槸缁х画澶嶇敤绀惧尯姝ｅ紡璇勮琛ㄤ笌鏃㈡湁浜掑姩鏈嶅姟锛涘垹闄や笌璇勮鍖哄紑鍏崇洿鎺ュ寘瑁呯幇鏈夌ぞ鍖鸿兘鍔涳紝闅愯棌/鎭㈠鍒欏湪鍚庡彴娌荤悊灞傝ˉ涓婁笓鐢ㄧ姸鎬佹祦杞€?- `apps/server/src/test/java/com/dramatv/community/integration/AdminCommentApiIntegrationTest.java` 宸叉柊澧?2 鏉″畾鍚戦泦鎴愭祴璇曪紝瑕嗙洊锛?  - 鍚庡彴璇勮鍒楄〃涓庤繃婊ゅ悗鎽樿缁熻
  - 闅愯棌 / 鎭㈠ / 鍒犻櫎璇勮涓庤瘎璁哄尯寮€鍏?- 鍚庣瀹氬悜楠岃瘉宸查€氳繃锛歚powershell -NoProfile -ExecutionPolicy Bypass -File ..\\..\\scripts\\use-local-java17-maven.ps1 -Dtest=AdminCommentApiIntegrationTest test`
- `apps/admin` 璇勮娌荤悊椤典篃宸叉帴鍒扮湡鏁版嵁璇诲彇锛?  - `apps/admin/src/lib/admin-service.ts` 宸叉柊澧?`listAdminComments()`
  - `apps/admin/src/app/(dashboard)/comments/page.tsx` 宸叉敼涓衡€滅湡鏁版嵁浼樺厛锛屽け璐ュ洖閫€鍙傝€冨浘鍗犱綅鏁版嵁鈥?- 鍓嶇缂栬瘧楠岃瘉宸查€氳繃锛?  - `apps/admin -> npx.cmd tsc --noEmit`
  - `apps/admin -> npm.cmd run build`
- 褰撳墠鍋氬埌鍝竴姝ワ細
  - 鍚庡彴宸蹭笉鍐嶅彧鏈?`auth + users` 涓や釜鐪熷叆鍙ｏ紝璇勮娌荤悊宸茬粡鎴愪负绗竴鏉＄湡瀹炲彲璇诲啓鐨勬不鐞嗛〉
  - 浣?`comments` 椤电洰鍓嶄粛鏄€滅湡鏁版嵁 + 闈欐€佸姩浣滃３鈥濇贩鍚堟€侊紝绛涢€夊櫒涓庢寜閽姩浣滅殑鍓嶇浜や簰杩樻病鏈夊畬鍏ㄦ帴鍒扮湡鎺ュ彛
- 涓嬫鍏堝仛浠€涔堬細
  - 鍏堟妸 `comments` 椤甸噷鐨勯殣钘?/ 鎭㈠ / 鍒犻櫎 / 璇勮鍖哄紑鍏虫寜閽帴鍒扮湡鎺ュ彛
  - 鍐嶇户缁帹杩?`reports`锛屾妸涓炬姤宸ュ崟椤典粠闈欐€佸崰浣嶆敼鎴愮湡瀹炲伐鍗曚腑蹇?
### 2026-04-29 comments 椤电湡瀹炲姩浣滄帴绾挎敹鍙?
- `apps/admin/src/app/(dashboard)/comments/page.tsx` 鏈疆宸蹭粠鈥滅湡鏁版嵁 + 闈欐€佸姩浣滃３鈥濇敹鍙ｅ埌鈥滅湡鏁版嵁 + 鐪熷姩浣溾€濓細
  - 鎶藉眽閫変腑鎬佹敼涓鸿窡闅?`?selected=` 鍙傛暟绋冲畾鍒囨崲锛屼笉鍐嶅彧璁ら粯璁ら€変腑椤?  - 璇︽儏鎶藉眽閲岀殑涓婁笅鏂囩嚎绋嬫敼涓烘寜褰撳墠閫変腑鐨勭湡瀹炶瘎璁洪噸鏂拌绠楋紝涓嶅啀澶嶇敤鍒濆榛樿绾跨▼
  - 闅愯棌 / 鎭㈠ / 鍒犻櫎璇勮涓庤瘎璁哄尯寮€鍏冲凡鍏ㄩ儴鎺ュ埌 `actions.ts` 閲岀殑 server actions
  - 淇濈暀澶辫触鍥為€€鍗犱綅鏁版嵁鑳藉姏锛屼絾鍗犱綅妯″紡涓嬩細鏄惧紡绂佺敤娌荤悊鍐欏姩浣滐紝閬垮厤浼鎴愬彲鐢ㄨ兘鍔?- `apps/admin/src/app/(dashboard)/comments/page.module.css` 鍚屾琛ヤ簡杩欎竴杞湡瀹炰氦浜掗渶瑕佺殑鏍峰紡缂哄彛锛氶敊璇彁绀烘潯銆佸姩浣滈摼鎺ャ€佸紑鍏冲叧闂€併€佹寜閽鐢ㄦ€併€佽〃鍗曞竷灞€銆?- 鍓嶇瀹氬悜楠岃瘉宸插啀娆￠€氳繃锛?  - `apps/admin -> npx.cmd tsc --noEmit`
  - `apps/admin -> npm.cmd run build`
- 褰撳墠鍋氬埌鍝竴姝ワ細
  - `comments` 宸茬粡浠庘€滃垪琛ㄨ兘璇荤湡鏁版嵁鈥濇帹杩涘埌鈥滃垪琛?+ 璇︽儏鎶藉眽 + 鍩虹娌荤悊鍔ㄤ綔鈥濋兘璧扮湡瀹炲悗绔?  - 褰撳墠鍓╀笅鐨勪笉鏄瘎璁洪〉娈嬬暀澹抽棶棰橈紝鑰屾槸 `reports / moderation` 杩樻病鎺ユ垚鍚岀瓑绾х殑鐪熷疄娌荤悊涓績
- 涓嬫鍏堝仛浠€涔堬細
  - 浼樺厛鎺ㄨ繘 `reports` 鐪熷伐鍗曞垪琛ㄤ笌澶勭悊鍔ㄤ綔
  - 鍐嶅喅瀹?`moderation` 鏄鐢?`reports` 鑱氬悎瑙嗗浘锛岃繕鏄繚鐣欐垚鏇村亸鎬昏绛涢€夐〉

### 2026-04-29 鍚庡彴绾挎仮澶嶅苟琛岃褰?
- 褰撳墠杩涗竴姝ユ槑纭細鎷嗗垎杩涘害鏂囨。鐨勭洰鐨勪笉鏄鍚庡彴绠＄悊绾垮仠鎺夛紝鑰屾槸璁╁悗鍙扮嚎鍙互缁х画鎺ㄨ繘锛屽悓鏃朵笉鍜岀ぞ鍖轰富绾挎贩鍐欏湪鍚屼竴浠借处鏈噷銆?- 鍚庣画鍚庡彴鐩稿叧鐨勫姛鑳藉紑鍙戙€佹帴鍙ｈ仈璋冦€侀〉闈㈢粏鍖栥€侀樆濉炵偣鍜屼笅涓€姝ュ姩浣滐紝缁熶竴缁х画杩藉姞鍦ㄦ湰鏂囦欢涓€?
### 2026-04-30 moderation 鐪熸帴鍙ｉ棴鐜涓€姝?
- 鎸夋渶鏂扮瓥鐣ワ紝`reports` 鏆備笉鎺ョ湡瀹炲悗绔紝缁х画淇濇寔鍗犱綅锛涙湰杞悗鍙扮嚎涓绘敾 `moderation`銆?- 褰撳墠宸叉柊澧?`apps/server` `admin/moderation` 妯″潡锛岄杞凡鎻愪緵锛?  - `GET /api/admin/moderation/items`
  - `GET /api/admin/moderation/items/{targetType}/{targetId}`
  - `POST /api/admin/moderation/items/{targetType}/{targetId}/approve`
  - `POST /api/admin/moderation/items/{targetType}/{targetId}/reject`
  - `POST /api/admin/moderation/items/{targetType}/{targetId}/offline`
  - `POST /api/admin/moderation/items/{targetType}/{targetId}/restore`
- 杩欒疆鍚屾椂琛ラ綈浜嗕竴涓湡瀹炴暟鎹己鍙ｏ細甯栧瓙鍙戝竷閾捐矾涔嬪墠娌℃湁鍐欏叆 `audit_records`锛屽鑷村悗鍙板鏍告睜澶╃劧缂轰竴绫诲唴瀹癸紱鐜板湪 `PublishedContentPersistenceService.upsertDiscussionThreadForPublish(...)` 宸插悓姝ヨˉ鍐?`publish_review / pending_review` 瀹℃牳璁板綍锛岀‘淇?`瑙嗛浣滃搧 / 鎻愮ず璇?/ 宸ヤ綔娴?/ 甯栧瓙` 閮借兘杩涘叆鍚屼竴瀹℃牳姹犮€?- `apps/admin /moderation` 宸蹭粠绾崰浣嶉〉鍒囧埌鈥滅湡瀹炴暟鎹紭鍏堬紝澶辫触鍥為€€鍗犱綅鏁版嵁鈥濓細
  - 鍒楄〃浼樺厛璇诲彇 `/api/admin/moderation/items`
  - 璇︽儏鎶藉眽浼樺厛璇诲彇 `/api/admin/moderation/items/{targetType}/{targetId}`
  - `閫氳繃 / 椹冲洖 / 涓嬬嚎 / 鎭㈠` 宸叉帴鍒扮湡瀹?server actions
  - 鍗犱綅鍥為€€妯″紡涓嬩細鏄惧紡绂佺敤鐪熷疄瀹℃牳鍔ㄤ綔
- 瀹氬悜楠岃瘉宸查€氳繃锛?  - `apps/admin -> npx.cmd tsc --noEmit`
  - `apps/admin -> npm.cmd run build`
  - `powershell -NoProfile -ExecutionPolicy Bypass -Command "& '.\\scripts\\use-local-java17-maven.ps1' '-f' 'apps/server/pom.xml' '-Dtest=AdminModerationApiIntegrationTest' 'test'"`
  - 缁撴灉锛歚Tests run: 2, Failures: 0, Errors: 0, Skipped: 0`
- 褰撳墠鍋氬埌鍝竴姝ワ細
  - 鍚庡彴鐪熷疄娌荤悊椤靛凡浠?`users -> comments -> moderation` 鎵╂垚涓夋潯鐪熼摼璺?  - `reports` 鎸夊綋鍓嶇‘璁ょ户缁仠鐣欏湪鍗犱綅锛屼笉涓庡墠鍙版湭钀藉湴鐨勪妇鎶ラ摼璺姠鎺掓湡
- 涓嬫鍏堝仛浠€涔堬細
  - 缁х画鎶?`feed-ops/home / featured / discussions` 浠庨潤鎬佽繍钀ュ３鎺ㄨ繘鍒扮湡瀹炲悗绔厤缃?  - 鍐嶈ˉ `taxonomy / media-tasks / audit-logs` 涓紭鍏堢骇鏇撮珮鐨勭湡瀹炲叆鍙?
### 2026-04-28 auth + users 鏈€灏忕湡鎺ュ彛闂幆

- `apps/server` 宸叉柊澧?`/api/admin/auth/**` 涓?`/api/admin/users`锛屽鐢ㄧ幇鏈?`auth_sessions + users.role_code`锛屽苟琛ュ悗鍙拌鑹插畧鍗€?- `apps/admin` 宸蹭粠鍗犱綅 Cookie 浼氳瘽鍒囧埌鐪熷疄 token 鐧诲綍/浼氳瘽/閫€鍑洪摼璺紝`/users` 椤甸潰涔熷凡鏀逛负璇诲彇鐪熷疄鐢ㄦ埛鍒楄〃銆?- 褰撳墠鍚庡彴鍓嶇宸蹭粠鈥滄湰鍦板彲鐙珛澶嶇幇涓庢瀯寤洪獙璇侀€氳繃鐨勬寮忓伐绋嬭捣鐐光€濇帹杩涘埌鈥渀auth + users` 宸叉帴閫氥€佸叾浣欐不鐞嗛〉浠嶅崰浣嶁€濈殑闃舵銆?
### 2026-04-27 鍚庡彴宸ョ▼鎷嗗垎鏂规鍥哄畾

- 宸插浐瀹氬悗鍙板伐绋嬫柟鍚戜负鈥滅ぞ鍖哄墠鍙?/ 绀惧尯鍚庡彴 鍒嗙寮€鍙戯紝鍚庡彴鏈湴鐙珛绔彛鈥濄€?- 褰撳墠寤鸿涓庡凡鍐欏叆瑙勫垝鐨勬柟妗堬細
  - 鏂板缓 `apps/admin`
  - 鏈湴绔彛浣跨敤 `3206`
  - 浜戜笂鍏ュ彛涓庣ぞ鍖哄墠鍙板垎寮€
  - 鍚庡彴涓€鏈熺户缁鐢?`apps/server`锛岄€氳繃 `/api/admin/**` 鎻愪緵鎺ュ彛
- 鍏变韩杈圭晫鍥哄畾涓猴細绀惧尯鍓嶅悗鍙板叡浜悓涓€濂楃ぞ鍖轰笟鍔℃暟鎹簱锛涚ぞ鍖轰笌鐢诲竷鍙叡浜韩浠藉拰缁戝畾鍏崇郴锛屼笉鍏变韩鏃犺竟鐣屽啓鏉冮檺銆?## 2026-05-12 feed ops media restore

- 宸叉妸鍚庡彴 `feed-ops` 鐨勫€欓€夋睜銆佹Ы浣嶅拰鍙充晶棰勮鍏ㄩ儴鍒囧埌鐪熷疄濯掍綋娓叉煋锛屼笉鍐嶅彧鐢昏壊鍧椼€?- 宸叉娊鍑哄墠绔畨鍏ㄧ殑 `feed-ops-types` / `feed-ops-media`锛岄伩鍏嶅鎴风缁х画鐩存帴渚濊禆 `admin-service.ts`銆?- 宸茶ˉ鍚庣鍥炲綊娴嬭瘯锛歚AdminFeedOpsHomeApiIntegrationTest` 鐜板湪浼氬垱寤?`apps-web-public` 濯掍綋璧勪骇骞舵柇瑷€ `coverUrl / posterUrl / previewUrl / sourceUrl`銆?- 宸查獙璇侊細
  - `apps/admin -> npx.cmd tsc --noEmit`
  - `apps/admin -> npm.cmd run build`
  - `& .\scripts\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminFeedOpsHomeApiIntegrationTest test`
- 杩愯鎬侊細
  - 鏈湴 `18080` 鍚庣宸查噸鍚苟鍋ュ悍鍙敤
  - 褰撳墠鐩戝惉 PID 涓?`21184`
- 涓嬩竴姝ワ細
  - 鐢ㄦ埛鎵撳紑鍚庡彴 `feed-ops` 椤电洿鎺ラ獙鏀跺皝闈㈠拰棰勮鏄惁鎭㈠姝ｅ父

## 2026-05-12 feed-ops/home 鐪熷疄棣栭〉缁撴瀯鏀跺彛

- 宸叉妸 `apps/admin /feed-ops/home` 浠庢棫鐨?`home-hero / home-hot / home-recommend / discussion-pinned` 鍙ｅ緞锛屾敹鍙ｆ垚鍜屽墠鍙伴椤典竴鑷寸殑鐪熷疄缁撴瀯锛?  - `home-hero`锛氶椤?3 涓疆鎾棰戜綅
  - `recommended-primary`锛氫负浣犳帹鑽愶紙涓伙級
  - `recommended-secondary`锛氫负浣犳帹鑽愶紙娆★級
  - `canvas`锛氱簿閫夌敾甯?  - `commercial`锛氱數瑙嗗箍鍛?  - `animation`锛氬姩鐢?  - `narrative`锛氬彊浜嬬煭鐗?  - `mv`锛歁V
  - `creative`锛氬垱鎰?- 宸叉妸 home 椤靛€欓€夋睜鏀剁揣涓?`prompt / workflow`锛屼笉鍐嶅厑璁告妸甯栧瓙鎸傝繘棣栭〉閰嶇疆浣嶃€?- 鍚庡彴棣栭〉棰勮鍖轰篃鍚屾鏀规垚浜嗏€滈椤佃疆鎾瑙?+ 棣栭〉鍒嗗尯棰勮 + 棣栭〉閰嶇疆浣嶆竻鍗曗€濈殑缁撴瀯锛屼笉鍐嶆部鐢ㄦ棫鐨?4 妲芥憳瑕佸彛寰勩€?- 宸查獙璇侊細
  - `apps/admin -> npm.cmd run build`
  - `apps/server -> .\\scripts\\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminFeedOpsHomeApiIntegrationTest test`
  - `apps/server -> .\\scripts\\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminFeedOpsLoggingIntegrationTest test`
- 褰撳墠鍋氬埌鍝竴姝ワ細
  - 棣栭〉杩愯惀浣嶈繖椤靛凡缁忓拰鍓嶅彴鐪熷疄棣栭〉甯冨眬瀵归綈锛屽悗缁鏋滅户缁仛鍚庡彴杩愯惀锛屼紭鍏堝啀鐪嬬簿閫夐〉鍜岃璁洪〉鐨勫疄闄呮槧灏勬槸鍚﹁繕闇€瑕佺户缁敹鍙ｃ€?

## 2026-05-12 feed-ops/featured realigned to actual featured structure

- 宸叉妸鍚庡彴 `feed-ops/featured` 鏀跺彛鍒扮湡瀹炵簿閫夐〉缁撴瀯锛歚鍏ㄩ儴棣栧睆 12 鏉?+ 5 涓?tab`銆?- 5 涓繍钀ヤ綅宸插浐瀹氫负锛?  - `featured-all`
  - `featured-workflow`
  - `featured-video-prompt`
  - `featured-image-prompt`
  - `featured-activity`
- 鍚勬Ы浣嶄笂闄愬凡缁熶竴涓?`12` 鏉★紝绮鹃€夐〉棰勮涔熸敼涓烘寜鐪熷疄棣栧睆鍜屽垎绫绘竻鍗曞睍绀猴紝涓嶅啀娌跨敤鏃ф爮鐩３銆?- 宸查獙璇侊細
  - `apps/admin -> npm.cmd run build`
  - `apps/server -> .\\scripts\\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminFeedOpsFeaturedApiIntegrationTest test`

## 2026-05-12 feed-ops/discussions realigned to actual discussions structure

- 宸叉妸鍚庡彴 `feed-ops/discussions` 鏀跺彛鍒扮湡瀹炶璁洪〉缁撴瀯锛屼笉鍐嶆妸鍙充晶娲剧敓淇℃伅褰撴垚鍙墜鍔ㄧ紪鎺掔殑妲戒綅銆?
- 褰撳墠璁ㄨ鍖鸿繍钀ヤ綅鍥哄畾涓猴細
  - `discussion-channel-order`
  - `discussion-global-pinned`
  - `discussion-channel-focus`
  - `discussion-home-link`
- 宸叉槑纭繖杞粨鏋勮竟鐣岋細
  - `热门话题 / 活跃贡献者` 灞炰簬鍓嶅彴娲剧敓鍖猴紝涓嶈繘鍚庡彴鎵嬪姩閰嶇疆
  - `home / featured / discussions` 鏄笁濂椾笉鍚屽伐浣滃尯锛屼笉鑳藉啀鍏辩敤鏃х殑鎶借薄妲戒綅璁ょ煡
  - `apps/admin/src/lib/admin-content.ts` 涓嶅啀鏄繖鏉＄嚎鐨剆ource of truth锛岀湡瀹為〉闈㈢粨鏋勪互 `apps/web` 瀵瑰簲椤甸潰瀹炵幇涓哄噯
- `FeedOpsPageClient` 涓?`AdminFeedOpsService` 宸插悓姝ユ敼鎴愭寜椤甸潰绫诲瀷杈撳嚭鐪熷疄棰勮鏂囨鍜屾Ы浣嶈涔夛細
  - `home`锛?`首页结构预览 / 首页轮播预览 / 首页配置位清单`
  - `featured`锛?`精选页结构预览 / 全部 tab 首屏 12 条 / 精选 tab 清单`
  - `discussions`锛?`讨论区结构预览 / 置顶讨论流预览 / 讨论工作区清单`
- 宸查獙璇侊細
  - `apps/admin -> npx.cmd tsc --noEmit -p tsconfig.json`
  - `apps/admin -> npm.cmd run build`
  - `apps/server -> .\\scripts\\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminFeedOpsHomeApiIntegrationTest test`
  - `apps/server -> .\\scripts\\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminFeedOpsFeaturedApiIntegrationTest test`
  - `apps/server -> .\\scripts\\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminFeedOpsDiscussionsApiIntegrationTest test`
- 鏈疆琛ヨ涓€涓噸瑕侀獙鏀剁害鏉燂細
  - `AdminFeedOpsHomeApiIntegrationTest / AdminFeedOpsFeaturedApiIntegrationTest / AdminFeedOpsDiscussionsApiIntegrationTest` 闇€瑕佷覆琛屾墽琛?
  - 骞惰璺戜細浜夌敤鏈湴娴嬭瘯搴撳拰 `apps/server/target`锛屽嚭鐜?`403`銆佸閿竻鐞嗗啿绐併€乻NoClassDefFoundError: MediaStorageProperties` 绛変竴绫诲亣澶辫触
- 褰撳墠鍋氬埌鍝竴姝ワ細
  - `feed-ops` 涓夐〉宸茬粡鎸夌湡瀹炲墠鍙伴〉闈㈢粨鏋勬敹鍙ｏ紝鍚庡彴涓€鏈熺湅鏉跨殑 `A4` 鍙互鎸夆€滃凡瀹屾垚涓斿彲楠屾敹鈥濆鐞?
- 涓嬫鍏堝仛浠€涔堬細
  - 濡傜户缁仛鍚庡彴浜岄樁澧炲己锛屼紭鍏堝洖鍒癶taxonomy 鎵归噺淇 / 绛涢€夋不鐞嗚兘鍔涳紝鎴栫户缁ˉ绀惧尯鍏变韩鍚庣鐨勭湡瀹炴暟鎹仈鍔?

## 2026-05-12 taxonomy filtering governance landed

- 宸插湪 `apps/admin /taxonomy` 琛ヨ冻绗竴杞?鈥滅瓫閫夋不鐞嗏€濊兘鍔涳紝涓嶅啀鍙槸鈥滅粺璁?+ 鍗曢」缂栬緫鈥濄€?
- 鏈疆鏂板鐨勭湡瀹炵瓫閫夊彛寰勶細
  - 鍏抽敭璇?`q`
  - 閫傜敤鑼冨洿 `scope`
  - 娌荤悊鐘舵€?`status`
  - 鏇濆厜浣?`exposure`
  - 鑷畾涔夐厤缃€?`config`
- 绛涢€夊凡鍚屾浣滅敤鍒帮細
  - 宸︿晶鍒嗙被鏍?tree
  - 涓棿鍒嗙被琛ㄦ牸
  - 鍙充晶娌荤悊缂栬緫鍖?
  - 椤甸潰椤堕儴鈥滃綋鍓嶅彲瑙侀」鏁?+ 绛涢€夋憳瑕佲€濇彁绀?
- 鏈疆鍚屾鏀剁揣浜嗕竴涓湡瀹炰氦浜掗棶棰橈細淇濆瓨鍒嗙被娌荤悊鍚庯紝褰撳墠 `section / selected / q / scope / status / exposure / config` 浼氬叏閮ㄤ繚鐣欙紝涓嶅啀淇濆瓨涓€娆″氨鍥炲埌鏈瓫閫夌姸鎬併€?
- 鏈疆娌℃湁鏂板鍚庣鎺ュ彛锛屽厛鍦ㄧ幇鏈?`GET /api/admin/taxonomy` + `PUT /api/admin/taxonomy` 鐪熼摼璺笂鎶婄瓫閫夋不鐞嗚兘鍔涜涓鸿ˉ瀹屾暣锛屼笉鍙﹂€犱竴濂楀亣鎵归噺鎺ュ彛銆?
- 宸查獙璇侊細
  - `apps/admin -> npx.cmd tsc --noEmit -p tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 褰撳墠鍋氬埌鍝竴姝ワ細
  - `taxonomy` 宸茬粡浠庘€滃彲鍗曢」娌荤悊鈥濇帹杩涘埌鈥滃彲鎸夋潯浠跺揩閫熺瓫鍑哄緟娌荤悊椤光€濄€?
- 涓嬫鍏堝仛浠€涔堬細
  - 濡傛灉瑕佺户缁繁鍖?taxonomy锛屼紭鍏堣ˉ鍚庣鐪熷疄鈥滄壒閲忎慨姝ｆ彁绀鸿瘝鍒嗙被鈥濋摼璺紝鑰屼笉鏄彧缁х画鍫嗗墠绔閫夋帶浠?

## 2026-05-12 feed-ops/discussions synced to real discussions page

- Admin `讨论运营` page now matches the real `/discussions` page structure instead of the old 4 abstract slots.
- Manual configurable slots were reduced to:
  - `discussion-channel-order`
  - `discussion-thread-stream`
- Right-side `热门话题` / `活跃贡献者` and the top `发起讨论` CTA remain derived from live page data and are not exposed as manual挂载位.
- Verified with:
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/server -> .\\scripts\\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminFeedOpsDiscussionsApiIntegrationTest test`
  - live admin runtime at `http://127.0.0.1:3206/feed-ops/discussions`

## 2026-05-12 discussions channel-level ordering landed

- `讨论运营` 已从“单一主讨论流”改为真实可控模型：
  - `话题栏目顺序`
  - `全部帖子顺序`
  - 各栏目独立 `前 8 条帖子顺序`
- 当前动态工作区已覆盖：
  - `提示词拆解帖子顺序`
  - `视频制作经验帖子顺序`
  - `画布工作流经验帖子顺序`
  - `官方活动帖子顺序`
  - `闲聊茶水间帖子顺序`
- 前台 `/api/discussions/home` 与 `?channel=<slug>` 已接入这套发布配置：
  - 后台已发布顺序优先
  - 未配置满的剩余位置回落系统排序
- 已完成验证：
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/server -> .\\scripts\\use-local-java17-maven.ps1 -f apps/server/pom.xml "-Dtest=AdminFeedOpsDiscussionsApiIntegrationTest,DiscussionReadApiIntegrationTest" test`
  - 真实接口校验：发布配置后，`/api/discussions/home` 与 `/api/discussions/home?channel=video-production` 的首条帖子顺序已按后台配置切换

## 2026-05-13 feed-ops displayed-items takeover fix

- `apps/admin /feed-ops/*` 的编排器继续收口到“按前台真实展示内容编辑”口径，而不再把右侧列表误当成“仅手工配置数组”。
- 已修复一类真实错位问题：
  - 当 `前台真实展示内容` 里混有系统回退补位项时，原先右侧列表的 `替换 / 上移 / 下移 / 移除` 会按 `activeItems` 索引操作，容易和实际看到的内容错位。
  - 现在右侧列表所有动作都改为基于 `displayedItems` 执行；如果用户操作的是 `系统补位` 项，会自动接管成手工编排内容。
- 本轮前端交互补强包括：
  - 为补位项显式标记 `系统补位`
  - 将补位项按钮文案改为 `接管此位 / 接管第 N 位`
  - 候选池对已在前台展示中的内容显示 `前台已展示`
  - 底部提示补充“系统补位内容，操作后会自动接管成手工编排”
- 已完成验证：
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
- 当前做到哪一步：
  - `feed-ops` 现在不仅能展示更接近前台真实首屏的内容，也能直接对这些真实展示位做接管式编排，交互语义和数据行为已经对齐。
- 下次先做什么：
  - 等用户对 `home / featured / discussions` 三页编排器做一轮视觉与操作验收；若仍有理解偏差，再补后端提供“已发布真实展示快照”而不是仅靠 admin 前端回退推导。

## 2026-05-13 feed-ops featured candidate-panel layout polish

- Tightened the `featured` arrange modal candidate-pool layout in `apps/admin/src/app/(dashboard)/feed-ops/shared/page.module.css`.
- Prevented the left candidate panel from visually coupling its height to the right-side displayed-content panel by forcing self-start sizing inside `.arrangeColumns`.
- Rebalanced the two-column width ratio, added a dedicated inset surface for the left scroll area, and stabilized the scrollbar gutter so the candidate list reads as one compact block.
- Aligned candidate cards to top-start and centered only the CTA button to remove the previous loose vertical spacing.
- Verified with:
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
- Current checkpoint:
  - Wait for user visual acceptance on `/feed-ops/featured`; if spacing is still off, continue polishing CSS only without changing data behavior.

## 2026-05-14 feed-ops real publish verification and frontend regression guard

- Turned the user's two concerns into hard backend checks instead of a verbal reminder:
  - `真实发布效果验证`
  - `后台修改不能给前台公共读链路带来隐性 bug`
- Closed a real shared-layer risk in `apps/server`:
  - `CommunityCatalogJdbcQueryService.mapHomeLayoutItem(...)` had been using feed-op target id as `author.id` when admin-published slot items were mapped back into public home/featured responses.
  - This is now fixed to use the real author identity carried by `AdminFeedOpsPageResponse.ContentItem`.
- Feed-ops content DTO and SQL snapshots/candidate queries now carry:
  - `authorId`
  - `authorAvatarUrl`
  - aligned `targetSlug` contract on the admin frontend type side
- Added/strengthened public-chain integration regression coverage:
  - `FeedReadApiIntegrationTest`
    - published home layout really changes `/api/feed/home`
    - published featured layout really changes `/api/feed/featured`
    - draft home config does not force content into public home layout
    - draft featured config does not force old content into public featured slots
    - public home/featured slot items return the real author id
  - `DiscussionReadApiIntegrationTest`
    - published discussion ordering still has highest priority
    - draft discussion ordering does not push old posts into channel first-screen ordering
- Verified with:
  - `apps/server -> .\\scripts\\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=FeedReadApiIntegrationTest,DiscussionReadApiIntegrationTest,AdminFeedOpsFeaturedApiIntegrationTest test`
  - Result: `Tests run: 10, Failures: 0, Errors: 0, Skipped: 0`
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
- Current checkpoint:
  - `feed-ops -> public home / featured / discussions` now has automated proof for both `published takes effect` and `draft does not take priority`.
  - The next backend work should continue under this rule: any admin-first shared-layer change that can affect public reads must add a regression test on the real public API, not just admin API coverage.

## 2026-05-17 feed-ops empty-config recovery after reboot

- Root cause confirmed:
  - local PostgreSQL `dramatv.public.admin_feed_slot_configs` had become empty (`0` rows)
  - candidate content tables were still populated, so this was not a full DB loss
  - admin audit logs prove home/featured publish had succeeded earlier on `2026-05-13`, so the disappearance was caused by later data loss on the config table, not by save failure
- Backend hardening:
  - `CommunityCatalogJdbcQueryService.homeLayoutSlots()` no longer returns empty `layout.slots` just because published home config rows are missing
  - `AdminFeedOpsService.loadPageConfig(...)` now synthesizes visible fallback slot items from the real candidate pool when a page has no saved slot rows, so `/api/admin/feed-ops/*` does not collapse to an empty workspace after config-table loss
- Recovery action executed:
  - restarted local backend on `18080`
  - logged in with local admin bootstrap account
  - re-published inferred current structures for `home`, `featured`, and `discussions`
  - current DB state:
    - `home => slots=9, items=35, status=published`
    - `featured => slots=5, items=40, status=published`
    - `discussions => slots=7, items=9, status=published`
- Regression coverage added:
  - `AdminFeedOpsHomeApiIntegrationTest` now asserts empty-config home admin read still returns visible slot items
  - `FeedReadApiIntegrationTest` now asserts public `/api/feed/home` still returns 9 layout slots when home config rows are absent
- Verified with:
  - `apps/server -> .\\scripts\\use-local-java17-maven.ps1 -f apps/server/pom.xml "-Dtest=AdminFeedOpsHomeApiIntegrationTest,FeedReadApiIntegrationTest" test`
  - result: `Tests run: 7, Failures: 0, Errors: 0, Skipped: 0`
  - local API checks after restart:
    - `/api/admin/feed-ops/home -> summary.statusCode = published`
    - `/api/feed/home -> layout.slots restored`

## 2026-05-18 taxonomy bulk correction backend landed

- ��̨ `taxonomy` �ڶ��׶��ѿ�ʼ�ӡ�ֻ������������ء����롰��ʵ����������ʾ�ʷ��ࡱ��
- ����������������������ɢȥ������ҳ UI�������ӿڣ�
  - `GET /api/admin/taxonomy/prompts`
  - `POST /api/admin/taxonomy/prompts/bulk-apply`
- ��ǰ��������Ѹ��ǣ�
  - ����ʵ�ѷ��� `prompt_entries` ��ѯ��������ʾ���嵥
  - ֧�� `q / modality / needsAttention / modelCategory / contentCategory / compositionCategory` ����
  - ������д `model_category / content_category / composition_category`
  - ͬ������ `tag_names`
  - ����ԭ�з� taxonomy ҵ���ǩ�����ٴֱ��������� `tag_names`
  - ��������д�� admin audit log�������� `taxonomy_prompt_batch` ҵ��������
- �����ر��տڵĹ������գ�
  - ����������ֱ�Ӹ��� `tag_names`������ɾ `youmind / campaign / editorial` ֮��ǰ̨�������ѵ�ҵ���ǩ
  - ���Ѹĳɡ�ֻ�Ƴ��� taxonomy ��ǩ���ٺϲ��� taxonomy ��ǩ���������̨������ǰ̨չʾ������ź�ϴ��
- �Ѳ����򼯳ɲ��ԣ�
  - `AdminTaxonomyApiIntegrationTest`
    - taxonomy ��ʾ���嵥��ʵ����
    - bulk apply ��д�����ֶ�
    - bulk apply ����� taxonomy ��ǩ
    - bulk apply ģ̬��ͻ�ܾ�
  - `AdminTaxonomyLoggingIntegrationTest`
    - bulk apply �ɹ���־Я�� batch ҵ��������
- ����֤��
  - `apps/server -> powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile`
  - `apps/server -> powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml "-Dtest=AdminTaxonomyApiIntegrationTest,AdminTaxonomyLoggingIntegrationTest" test`
  - �����`Tests run: 8, Failures: 0, Errors: 0, Skipped: 0`
- ��ǰ������һ����
  - `taxonomy` ����Ѳ�ֻ���������ҳ���Ѿ��߱���ʵ����ʾ�ʷ���������������
  - �����Ȱѽӿںͻع���ס��������һ���� `apps/admin /taxonomy` �Ͻ���ʵ��ѡ�غ���������������
- �´�����ʲô��
  - �� `apps/admin /taxonomy` �ӵ�ǰ����������ҳ���������ɡ����� + ��������ʾ�ʳ� + ����������һ��ҳ��
  - �������ֹ����κλ�Ӱ��ǰ̨��ʾ�ʶ�ȡ/չʾ�ĺ�̨ taxonomy �Ķ�����Ҫ�������ع���ԣ�������ֻ�� admin API
## 2026-05-18 admin usability cleanup pass

- Priority for this pass was not feature expansion, but making existing admin behavior clearly real and non-misleading.
- Cleaned mock-era signals in `apps/admin`:
  - removed `DRAMATV_ADMIN_DATA_MODE=mock` from `.env.example`
  - updated `apps/admin/README.md` to describe the real `apps/admin + apps/server` runtime path
  - reduced `src/lib/admin-content.ts` to shared UI types only, removing dead static business sample data from the active code path
  - removed old `前端占位` pill matching from `src/components/AdminDataTable.tsx`
- Corrected misleading fallback semantics on live admin pages:
  - `feed-ops` fallback page data now uses `statusCode = unavailable` instead of pretending to be a draft config
  - `feed-ops` header now renders an explicit mode badge for `real writable` vs `API failure read-only`
  - `taxonomy` governance badge now says `接口异常，只读` instead of `占位模式`
- Verification:
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
  - both passed
- Current checkpoint:
  - admin frontend no longer advertises mock mode in local setup
  - current follow-up should continue with runtime validation of real admin pages and real backend data, not new placeholder UI

## 2026-05-18 admin runtime validation + semantics cleanup

- Continued the current priority of `making existing admin functionality truly usable` instead of adding new admin features.
- Revalidated the protected-route redirect fix in runtime:
  - anonymous access now preserves the original target for `/`, `/dashboard`, `/users`, `/moderation`, `/reports`, `/feed-ops/home`
  - verified redirect targets such as `/login?redirectTo=%2Fusers`
  - browser validation also confirmed login returns to the original protected page instead of collapsing back to `/dashboard`
- Strengthened route smoke coverage:
  - `scripts/smoke-admin-routes.mjs` no longer only checks `redirects to /login`
  - it now also asserts exact `redirectTo` values for protected routes
- Closed a remaining usability/semantics issue on several live admin detail panes:
  - `reports` no longer labels summary blocks as `证据截图 / 被举报内容预览` without clarification; the UI now makes clear these are backend-provided evidence clues and content summaries, not guaranteed raw screenshots or full media previews
  - `moderation` changed the large right-side block from implied `内容预览` to explicit `内容摘要卡`, with a note that it is context for review, not a full raw-media preview/player capability
  - `media-tasks` changed the right-side context block to `任务上下文摘要`, with an explicit note that it is for troubleshooting context rather than a real media preview player
- Also unified root-route auth behavior:
  - `apps/admin/src/app/page.tsx` now redirects anonymous `/` access to `/login?redirectTo=%2F` so root entry follows the same login-return contract as other protected routes
- Verification:
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
  - `node .\scripts\smoke-admin-routes.mjs --base-url http://127.0.0.1:3206`
  - browser runtime checks on `/users`, `/reports`, `/moderation`, `/taxonomy`, `/media-tasks`, `/audit-logs`
  - browser console errors: `0`
- Current checkpoint:
  - admin login redirect/return path is now consistent and verified
  - several pages that previously looked more complete than they really were now expose honest real-data semantics instead of pseudo-preview wording
- Next recommended step:
  - continue runtime validation on remaining actionable pages such as `comments` and the write paths under `reports / moderation / media-tasks`, with the same rule: any incomplete capability must be visually explicit rather than styled like a finished end-user preview

## 2026-05-18 admin real write-path validation + reports metric semantics fix

- Continued the current priority of `making existing admin functionality truly usable with real data`, and validated real write paths instead of only read pages.
- Runtime-validated `comments` on live backend data:
  - selected real active comment `cc233d57-9d8b-43b3-ab49-1e3d04f65d31`
  - executed `隐藏评论` -> verified row state changed to `已隐藏`, risk tone changed, summary card `已隐藏评论` incremented to `1`
  - executed `恢复评论` -> verified row state returned to `正常`, summary card rolled back to `0`
  - result: comment-governance hide/restore is confirmed to be a real reversible backend action, not a dead UI shell
- Runtime-validated `reports` on live backend data:
  - selected pending ticket `6c7d3db8-90c6-402c-bed6-24188bc0e951`
  - executed `标记处理中`
  - verified row state moved from `待处理` to `处理中`, assignee became `admin-chief`, detail timeline appended a real processing record
- During the report validation, found a real admin usability bug:
  - the first report summary card used backend field `pendingTickets`
  - backend semantics are `open tickets = pending + processing`
  - but admin UI labeled it as `待处理举报`, which became misleading immediately after moving a ticket into `处理中`
- Fixed the report metric semantics in `apps/admin/src/app/(dashboard)/reports/page.tsx`:
  - summary card label changed from `待处理举报` to `打开工单`
  - metric helper text changed to `待处理 + 处理中`
  - this aligns frontend wording with real backend summary semantics and avoids false bug reports during acceptance
- Runtime-validated `media-tasks` on live backend data:
  - selected failed retryable task `9d2c232b-5ca1-4d5a-ae5e-803cd2558ab9`
  - executed `重试任务`
  - verified task state changed from `失败` to `待处理`
  - verified retry count changed from `0 / 3` to `1 / 3`
  - verified `失败任务数` and `待重试任务` summary cards both dropped from `1` to `0`
  - verified retry button became disabled after transition
  - result: media-task retry is confirmed to be a real backend state transition
- Browser/runtime verification for this pass:
  - console errors remained `0`
  - `comments` write path passed
  - `reports` processing action passed
  - `media-tasks` retry action passed
- Static/regression verification for this pass:
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
  - `node .\scripts\smoke-admin-routes.mjs --base-url http://127.0.0.1:3206 --output .\artifacts\admin-smoke\latest\summary.json`
  - result: build passed, route smoke `7 passed / 0 failed`
- Current checkpoint:
  - admin no longer only proves readable real data; several key operator actions are now runtime-validated against the real backend
  - current known risky area left for later is `moderation` write actions, because they directly change public content availability more materially than comments/reports/media retries
- Next recommended step:
  - validate one low-risk `moderation` transition with the same rule: pick a reversible or low-blast-radius item first, and stop immediately if the action semantics are broader than the page currently communicates

## 2026-05-18 moderation verification closed with real runtime proof

- Closed the pending `moderation` verification loop under the current rule of `make existing admin functionality truly usable with real data`.
- Backend regression signal is now clean again:
  - `apps/server -> powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml "-Dtest=AdminModerationApiIntegrationTest,AdminModerationLoggingIntegrationTest" test`
  - result: `Tests run: 5, Failures: 0, Errors: 0, Skipped: 0`
- Important clarification on the earlier `403`:
  - this round could not reproduce it anymore
  - isolated single test and combined suite both passed
  - current judgment: no confirmed code-level auth regression remains on the moderation endpoints
- Real runtime/browser validation on `http://127.0.0.1:3206/moderation` is now complete:
  - `not_required` items no longer render as `pending`; real rows now show `无需审核`
  - selected real rows verified in UI:
    - `workflow:ac6d6c40-a384-41f7-8ef1-2182094280f7 -> 无需审核`
    - `prompt:341f0a54-0ff4-49e3-9e49-2046ad1ace53 -> 已通过`
  - for `无需审核` detail view, all decision buttons are disabled:
    - `通过 / 驳回 / 下线 / 恢复` all disabled
- A real runtime mismatch was found and resolved during validation:
  - code and tests already contained the `processedToday` fix, but local backend `18080` was still serving an older process version
  - symptom before restart: page and API both still showed `今日已处理 = 0`
  - action taken: restarted local backend with `scripts/start-server-dev-18080.ps1`
  - after restart, real API returned `processedToday = 1`, and browser page also updated to `今日已处理 = 1`
- Current checkpoint:
  - `moderation` read semantics, summary metrics, and action availability are now aligned with the real backend state in local runtime
  - the earlier acceptance confusion on this page was caused by stale local backend runtime, not by remaining frontend cache behavior
- Next recommended step:
  - continue the same `real usability` audit on the next admin page that already claims capability, prioritizing `taxonomy` front-end/runtime alignment with the real backend batch-correction APIs

## 2026-05-18 taxonomy bulk-correction runtime verification closed

- Closed the pending `taxonomy` front-end/runtime verification loop under the current rule of `make existing admin functionality truly usable with real data`.
- Real runtime/browser write-path validation on `http://127.0.0.1:3206/taxonomy` is now complete:
  - first verified the candidate pool was live backend data, not mock content:
    - initial `待修正提示词池` count was `30`
    - first real candidate prompt was `eb22efba-4bf8-577f-924b-50cc4df62c48`
  - executed real bulk taxonomy correction for image prompts with:
    - `modelCategory = nanobanana`
    - `contentCategory = scene`
    - `compositionCategory = multi-model`
  - browser/runtime proof after submit:
    - candidate count moved `30 -> 29`
    - corrected prompt disappeared from the `needsAttention=true` candidate pool
  - direct backend API proof after submit:
    - `GET /api/admin/taxonomy/prompts?modality=image&needsAttention=true&q=Knolling -> totalItems = 0`
    - `GET /api/admin/taxonomy/prompts?modality=image&q=Knolling` returned:
      - `modelCategory = nanobanana`
      - `contentCategory = scene`
      - `compositionCategory = multi-model`
      - `needsAttention = false`
- During this verification, found and fixed a real admin usability gap in `apps/admin`:
  - bulk correction had no explicit success feedback after redirect
  - the taxonomy header/editor copy still partially described the page as if batch correction were not a real capability
- Frontend cleanup landed:
  - `apps/admin/src/app/(dashboard)/taxonomy/actions.ts`
    - success redirects now append a `success` message
    - fixed a subtle server-action bug where `redirect()` had briefly been placed inside `try`, causing Next redirect exceptions to be misread as failure
  - `apps/admin/src/app/(dashboard)/taxonomy/page.tsx`
    - renders `success` banner
    - updates page-level and editor-level wording to match the real capability boundary
  - `apps/admin/src/app/(dashboard)/taxonomy/page.module.css`
    - adds success banner styles
- Re-verified after the UX fix with another real write action:
  - second submit produced URL query `success=已批量修正 1 条提示词分类。`
  - page rendered visible success feedback
  - candidate count continued `28 -> 27`
  - selected prompt disappeared from the candidate pool
- Verification:
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
  - browser console errors on taxonomy page: `0`
- Current checkpoint:
  - `taxonomy` is no longer only backend-complete; the admin UI write path is now runtime-verified and gives honest success feedback
  - current remaining direction should continue the same `real usability` audit pattern on the next already-claimed admin capability, instead of adding new placeholder surfaces

## 2026-05-19 users runtime cache cleared + real write-path verification closed

- Continued the current priority of `making already-claimed admin capabilities truly usable with real data`, and closed the pending `/users` runtime and write-path verification loop.
- Cleared the stale local admin frontend runtime state on `http://127.0.0.1:3206`:
  - restarted the `apps/admin` Next dev server
  - confirmed fresh page loads on `/users` no longer produce the old `initialResetPasswordActionState` module error in the current navigation session
  - current browser recheck on `/users` returned `0` new console errors for the revalidation pass
- Re-validated real governance write path on live backend data for test account `qa-smoke-20260518141148` (`91eb07d0-602c-4804-acd1-ecf07607cc97`):
  - changed status `active -> pending` in browser
  - page redirected with `success=账号治理已保存。` and showed visible success feedback
  - list row and detail panel both updated to `观察中`
  - backend `/api/admin/users/{id}` confirmed `statusCode = pending`, `canLogin = false`, `canPublish = false`
  - changed the same account back `pending -> active`
  - backend `/api/admin/users/{id}` confirmed rollback to `statusCode = active`, `canLogin = true`, `canPublish = true`
- Re-validated real password governance write path on the same live account:
  - browser `重置密码` action succeeded and returned a new temporary password in UI
  - did not record the temporary password into progress logs
  - verified the issued temporary password by calling real community login API `POST /api/auth/login`
  - result: login succeeded and returned a real access token for the target user, proving password reset is not a fake frontend-only action
- Current checkpoint:
  - `/users` governance save and password reset are both runtime-verified against the real backend
  - the earlier acceptance confusion on this page was caused by stale local dev runtime history, not by the current source tree
- Next recommended step:
  - continue the same `real usability` audit on the next admin page that already claims a reversible write action, and keep the rule that any unfinished capability must remain explicitly marked rather than styled as complete

## 2026-05-19 feed-ops discussions success feedback + publish effect verified

- Continued the current priority of `making already-claimed admin capabilities truly usable with real data`, and used `feed-ops/discussions` to verify the public-facing publish effect end to end.
- Frontend usability cleanup landed across the three feed-ops pages:
  - `apps/admin/src/app/(dashboard)/feed-ops/home/actions.ts`
  - `apps/admin/src/app/(dashboard)/feed-ops/featured/actions.ts`
  - `apps/admin/src/app/(dashboard)/feed-ops/discussions/actions.ts`
  - `apps/admin/src/app/(dashboard)/feed-ops/home/page.tsx`
  - `apps/admin/src/app/(dashboard)/feed-ops/featured/page.tsx`
  - `apps/admin/src/app/(dashboard)/feed-ops/discussions/page.tsx`
  - `apps/admin/src/app/(dashboard)/feed-ops/shared/FeedOpsPageClient.tsx`
  - `apps/admin/src/app/(dashboard)/feed-ops/shared/page.module.css`
- The feed-ops save flow now emits explicit success feedback instead of only redirecting silently, so the operator can immediately see whether a publish action actually landed.
- Runtime verification on live data for `feed-ops/discussions`:
  - selected the existing discussions config set and published it without changing the content set itself
  - admin page showed a visible success banner: `讨论运营配置已保存。`
  - backend summary changed from `draft` to `published`
  - backend summary fields confirmed a real publish record:
    - `updatedByDisplayName = admin-chief`
    - `publishedAt = 2026-05-19T02:43:20.936041Z`
- Backend and public read-path proof:
  - admin `/api/admin/feed-ops/discussions` now returns the channel order with `闲聊茶水间` first, followed by `官方活动`, `视频制作经验`, `画布工作流经验`, `提示词拆解`
  - public `/api/discussions/home` now returns the same channel order
  - browser runtime on `http://127.0.0.1:3106/discussions` now shows the left channel nav in the same priority order, proving the public page is reflecting the published admin configuration rather than an unrelated placeholder order
- Browser/runtime verification for this pass:
  - admin `feed-ops/discussions` page console errors: `0`
  - public `/discussions` page console errors: `0`
- Static/regression verification for this pass:
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- Current checkpoint:
  - `feed-ops/discussions` is now visually honest about save success and is runtime-verified against the real public discussion page
  - the next safest continuation is the same treatment on `feed-ops/home` or `feed-ops/featured`, keeping the rule that backend-written configuration must be observable in the public page without guesswork

## 2026-05-19 feed-ops home publish effect verified from current runtime

- Continued the current priority of `making already-claimed admin capabilities truly usable with real data`, and used `feed-ops/home` to verify that the admin publish action really changes the public `/home` layout.
- Fresh runtime state before publish:
  - admin `/api/admin/feed-ops/home` was `draft`
  - the draft already contained 35 configured items across all 9 homepage slots
  - public `/api/feed/home` was still serving the previous published layout, so draft and public were visibly diverged before this pass
  - one concrete mismatch before publish: `recommended-secondary` draft first target was `workflow:ac6d6c40-a384-41f7-8ef1-2182094280f7`, while the public layout still started with `prompt:341f0a54-0ff4-49e3-9e49-2046ad1ace53`
- Runtime publish verification on `http://127.0.0.1:3206/feed-ops/home`:
  - clicked `发布配置`
  - admin page redirected with visible success feedback `首页运营配置已保存。`
  - page body now includes `已发布`
- Backend proof after publish:
  - `/api/admin/feed-ops/home` now returns `statusCode = published`
  - `updatedByDisplayName = admin-chief`
  - `publishedAt = 2026-05-19T03:05:26.638512Z`
- Public read-path proof after publish:
  - `/api/feed/home` now matches the admin slot order for all 9 homepage slots
  - verified first target alignment for each slot key:
    - `home-hero -> prompt:341f0a54-0ff4-49e3-9e49-2046ad1ace53`
    - `recommended-primary -> prompt:341f0a54-0ff4-49e3-9e49-2046ad1ace53`
    - `recommended-secondary -> workflow:ac6d6c40-a384-41f7-8ef1-2182094280f7`
    - `canvas -> prompt:2c3ec234-2533-4039-8cac-6b803195e307`
    - `commercial -> prompt:602a091c-056f-4826-b659-66e9d8e1faaa`
    - `animation -> prompt:0769e71a-e16c-5f1c-8ca8-a4527cf63fac`
    - `narrative -> prompt:6f7c8f0d-60c9-5608-950b-5b860405a925`
    - `mv -> prompt:2cd95b43-c4b4-5423-b8ee-80933904f34a`
    - `creative -> prompt:a5367c36-58a0-5e76-b071-10ef9b1aa3ee`
- Browser/runtime proof on `http://127.0.0.1:3106/home`:
  - hero first visible item is still `QA 视频提示词链路验证 2026-05-07`
  - the second `为你推荐` block now starts with workflow `ac6d6c40-a384-41f7-8ef1-2182094280f7`
  - `精选画布 / 电视广告 / 动画 / 叙事短片 / MV / 创意` first cards all match the newly published slot order
- Browser/runtime verification for this pass:
  - admin `feed-ops/home` page console errors: `0`
  - public `/home` page console errors: `0`
- Current checkpoint:
  - `feed-ops/home` is now runtime-verified end to end
  - this page is no longer only “configured in admin”; the public homepage is now provably reflecting the published admin layout

## 2026-05-19 feed-ops featured publish effect re-verified from current runtime

- Rechecked `feed-ops/featured` before logging the previous handoff result, and found that the live runtime truth had drifted: the admin page was currently back in `draft`, so the earlier unpublished note could not be treated as the current state.
- Fresh runtime state before this pass:
  - admin `/api/admin/feed-ops/featured` returned `statusCode = draft`
  - admin draft `featured-all` first target was `workflow:ac6d6c40-a384-41f7-8ef1-2182094280f7`
  - public `/api/feed/featured` still started with `prompt:341f0a54-0ff4-49e3-9e49-2046ad1ace53`
- Runtime publish verification on `http://127.0.0.1:3206/feed-ops/featured`:
  - clicked `发布配置`
  - admin page redirected with visible success feedback `精选运营配置已保存。`
  - page body now includes `已发布`
- Backend proof after publish:
  - `/api/admin/feed-ops/featured` now returns `statusCode = published`
  - `updatedByDisplayName = admin-chief`
  - `publishedAt = 2026-05-19T03:09:02.168862Z`
- Public read-path proof after publish:
  - `/api/feed/featured` now matches the admin-published first item for the key tabs checked in this pass:
    - `featured-all -> workflow:ac6d6c40-a384-41f7-8ef1-2182094280f7`
    - `featured-workflow -> workflow:ac6d6c40-a384-41f7-8ef1-2182094280f7`
- Browser/runtime proof on `http://127.0.0.1:3106/featured`:
  - default `全部` tab first card is now workflow `QA 工作流链路验证 2026-05-07`
  - this matches the published admin slot order and no longer shows the previous prompt-first state at the top of the page
- Browser/runtime verification for this pass:
  - admin `feed-ops/featured` page console errors: `0`
  - public `/featured` page console errors: `0`
- Current checkpoint:
  - `feed-ops/featured` is now re-verified from the current runtime truth rather than relying on stale handoff memory
  - together with the already-verified `feed-ops/discussions`, the three existing feed-ops pages have now all been proven against real public-page effect at least once in the current local runtime

## 2026-05-19 dashboard real read-path verification + media retry feedback landed

- Continued the current priority of `making already-claimed admin capabilities truly usable with real data`, and moved from `feed-ops` into the remaining admin pages that already claim live backend data.
- Dashboard overview runtime verification on `http://127.0.0.1:3206/dashboard`:
  - confirmed the page is reading the real backend endpoint `/api/admin/dashboard/overview`, not placeholder cards
  - current summary values matched API output during this pass:
    - `pendingModerationCount = 13`
    - `pendingReportCount = 2`
    - `failedMediaTaskCount = 1`
    - `retryableMediaTaskCount = 1` before the media retry pass below
    - `totalUsers = 71`
    - `backendRoleUsers = 1`
  - current live content cards also matched the API read-path:
    - moderation queue first item target id `602a091c-056f-4826-b659-66e9d8e1faaa`
    - latest report first item `reportId = da701aa3-61be-400d-97fd-55ae9dc89b7c`
    - failed media task first item `taskId = 9d2c232b-5ca1-4d5a-ae5e-803cd2558ab9`
    - user watch first item `userId = d92e64d9-05b6-4286-b050-08a820dd10e9`
  - clicked the dashboard entry `查看全部待审核内容` and confirmed it opens the real moderation page at `/moderation`
- During the media task audit, found a real admin usability gap in `apps/admin`:
  - `media-tasks` retry was already a real backend action, but the UI redirected silently with no explicit success feedback
  - after a real retry, the operator had to infer success only from changed counters/detail state
- Frontend usability cleanup landed for `media-tasks`:
  - `apps/admin/src/app/(dashboard)/media-tasks/actions.ts`
  - `apps/admin/src/app/(dashboard)/media-tasks/page.tsx`
  - `apps/admin/src/app/(dashboard)/media-tasks/page.module.css`
- The retry flow now redirects with an explicit success message:
  - `Retry submitted. Check the current status and retry count on the right.`
- Real media task write-path verification on `http://127.0.0.1:3206/media-tasks?selected=9d2c232b-5ca1-4d5a-ae5e-803cd2558ab9`:
  - selected the live failed task `9d2c232b-5ca1-4d5a-ae5e-803cd2558ab9`
  - before the final verified pass in this round, the task was still `failed`, `retryCount = 2 / 3`, `retryable = true`
  - clicked `重试任务`
  - page redirected with the new visible success banner
  - backend detail then confirmed a real state transition:
    - `statusCode = failed`
    - `retryCount = 3 / 3`
    - `retryable = false`
    - `startedAt = 2026-05-19T03:27:20.207244Z`
    - `finishedAt = 2026-05-19T03:27:20.211487Z`
  - list summary also changed consistently:
    - `retryableTasks = 0`
    - `failedTasks = 1`
  - this proves the retry action is not fake UI behavior: it really hit the backend and mutated the task state, even though the task failed again immediately for the same root cause (`prompt target not found`)
- Audit log linkage verification on `http://127.0.0.1:3206/audit-logs?q=9d2c232b-5ca1-4d5a-ae5e-803cd2558ab9`:
  - confirmed the latest retry action is visible in the audit log read-path
  - matched fields from the real API result:
    - `actionCode = retry`
    - `moduleCode = media_tasks`
    - `requestPath = /api/admin/media-tasks/9d2c232b-5ca1-4d5a-ae5e-803cd2558ab9/retry`
    - `targetId = 9d2c232b-5ca1-4d5a-ae5e-803cd2558ab9`
- Verification for this pass:
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
  - browser console errors:
    - `/dashboard = 0`
    - `/media-tasks = 0`
    - `/audit-logs = 0`
- Current checkpoint:
  - `dashboard` is runtime-verified as a real overview rather than a placeholder shell
  - `media-tasks` now has honest retry feedback on top of a real backend write action
  - `audit-logs` has been proven to surface the media retry operation from the current local runtime
- Next recommended step:
  - continue the same audit pattern on `comments` or `reports` with focus on cross-page action traceability and whether detail-side state changes remain obvious after the page redirects

## 2026-05-19 shared sync backfill aligned with latest admin runtime proofs

- Read and adopted the new shared-chain rule from `.codex/backend-codex-shared-sync-handoff-2026-05-19.md`.
- Shared-impact facts are no longer allowed to live only in `progress-admin.md`; the single source of truth is now `.codex/community-admin-shared-sync.md`, with this file acting as the admin-side execution log.
- Backfilled the shared ledger before any further shared work:
  - `S5 feed-ops` now explicitly records the current runtime proof for `home / featured / discussions`, including public-page effect and the requirement that slot-shape changes must update the shared ledger first
  - `S6 media-tasks` now explicitly records the real retry-state mutation and audit-log traceability proof, plus the rule that future front-end user-state copy must stay aligned with backend task semantics
  - `U3 shared acceptance` now narrows to one common rule: admin feedback + backend state change + public/read-path observable effect
- Current checkpoint:
  - the process debt from earlier 2026-05-19 shared verification work has been cleared
  - next shared-impact work should update `.codex/community-admin-shared-sync.md` first, then `progress-admin.md`, and only then optionally `progress.md`

## 2026-05-19 shared ledger expanded with admin-side verification map

- Continued the new shared-doc-first workflow and extended `.codex/community-admin-shared-sync.md` with admin-side reality mapping, instead of leaving that context scattered only in `progress-admin.md`.
- Added `4A.6` to separate pages/actions that already have current-runtime shared verification from pages that merely exist.
- Added `4A.7` to explicitly mark the items that must not be mistaken for shared-closure-complete yet:
  - `moderation` write actions
  - `reports` page-level runtime linkage, especially `offline-target / hide-comment`
  - `comments` governance write-path effect on public comment visibility
  - `dashboard` downstream jump targets not being equivalent to verified downstream governance actions
- Current checkpoint:
  - the shared ledger now tells the admin side both what is already proven and what still needs real cross-surface verification
  - next backend/admin work should use this map to avoid repeating already-verified work and to keep the next shared validation focused on real remaining gaps

## 2026-05-19 moderation public visibility regression proof landed

- Returned to the optimization mainline under shared-regression protection, and closed the first missing proof for `moderation -> public visibility`.
- Backend regression already landed in:
  - `apps/server/src/test/java/com/dramatv/community/integration/AdminModerationApiIntegrationTest.java`
- New proof scope:
  - `moderationActionsChangePublicPromptVisibilityAcrossListAndDetail`
  - verifies one real shared chain for `prompt`:
    - initial state: visible in public `GET /api/prompts` list and `GET /api/prompts/{id}` detail
    - `reject`: hidden from list and detail returns `PROMPT_NOT_FOUND`
    - `approve`: visible again
    - `offline`: hidden again
    - `restore`: visible again
- Shared-doc-first updates completed before logging here:
  - `.codex/community-admin-shared-sync.md`
    - `S3` is now recorded as first-round verified for the prompt public list/detail chain
    - `U1` is narrowed from “missing regression” to “partial coverage only”
    - `/moderation` in `4A.6 / 4A.7` now distinguishes what is already proven from what is still missing
  - `.codex/shared-regression-taskboard-2026-05-18.md`
    - `R3` moved to `进行中`
    - `R3-6` moved to `已完成一轮`
  - `.codex/dramatv-optimization-taskboard-2026-05-18.md`
    - `O4-2` moved to `进行中`
- Verification for this pass:
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-backend-integration-suite.ps1 -Suite admin`
  - result: `Tests run: 33, Failures: 0, Errors: 0, Skipped: 0`
- Current checkpoint:
  - the admin/shared layer now has stable regression protection for one real moderation write chain that changes public visibility
  - this is not yet full closure for moderation as a whole
- Next recommended step:
  - extend the same level of proof to either:
    - `reports/offline-target -> public visibility`
    - or `comments hide/restore -> public comment visibility`

## 2026-05-19 comment governance public visibility regression proof landed

- Continued the optimization mainline by extending shared-regression protection from `moderation` into `comments`.
- Added a new backend regression in:
  - `apps/server/src/test/java/com/dramatv/community/integration/AdminCommentApiIntegrationTest.java`
- New proof scope:
  - `adminHideAndRestoreAreReflectedOnPublicCommentList`
  - verifies the real shared chain for direct admin comment governance:
    - initial state: the comment is visible in public `GET /api/comments`
    - `hide`: comment disappears from the public list and `videoCommentCount` changes `1 -> 0`
    - `restore`: comment reappears in the public list and `videoCommentCount` changes `0 -> 1`
- Shared ledger updated first:
  - `.codex/community-admin-shared-sync.md`
    - `/comments` is now listed in `4A.6` as having first-round shared backend proof
    - `/comments` in `4A.7` is narrowed to the remaining gaps:
      - `reports/hide-comment` shared regression
      - admin page runtime evidence
- Verification for this pass:
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-backend-integration-suite.ps1 -Suite admin`
  - result: `Tests run: 34, Failures: 0, Errors: 0, Skipped: 0`
- Current checkpoint:
  - shared regression protection now covers two real admin write chains that directly change public read results:
    - `moderation` on prompt public visibility
    - direct admin `comments hide/restore` on public comment visibility
- Next recommended step:
  - target `reports/offline-target` or `reports/hide-comment` so that report-driven governance reaches the same verification level as direct moderation/comment actions

## 2026-05-19 report-driven public visibility regression proof landed

- Continued the optimization mainline by closing the remaining report-driven shared-regression gap at the backend level.
- Extended:
  - `apps/server/src/test/java/com/dramatv/community/integration/AdminReportApiIntegrationTest.java`
- New proof scope:
  - `offlineTargetHidesVideoFromPublicDetail`
    - initial state: public `GET /api/videos/{id}` is available
    - `reports/offline-target`: public detail becomes `VIDEO_NOT_FOUND`
    - backend `video.publish_status` and latest audit status both become `taken_down`
  - `hideCommentRemovesCommentFromPublicList`
    - initial state: the comment is visible in public `GET /api/comments`
    - `reports/hide-comment`: the comment disappears from the public list
    - report ticket status becomes `resolved`
- Shared ledger updated first:
  - `.codex/community-admin-shared-sync.md`
    - `S3` now includes report-driven video detail visibility proof
    - `/reports` is now listed in `4A.6` as having first-round shared backend proof
    - `/reports` in `4A.7` is narrowed to remaining runtime/page evidence rather than “no proof”
  - `.codex/shared-regression-taskboard-2026-05-18.md`
    - added `R3-8 举报治理到前台展示联动回归`
    - narrowed `R3-6 / R3-7` remaining gaps to page-level runtime evidence and broader target-type coverage
- Verification for this pass:
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminReportApiIntegrationTest test`
  - result: `Tests run: 5, Failures: 0, Errors: 0, Skipped: 0`
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-backend-integration-suite.ps1 -Suite admin`
  - result: `Tests run: 36, Failures: 0, Errors: 0, Skipped: 0`
- Current checkpoint:
  - shared regression protection now covers three real admin write families that change public read behavior:
    - `moderation`
    - direct admin `comments`
    - report-driven `offline-target / hide-comment`
- Next recommended step:
  - switch from backend-only regression proof to page-level runtime proof on `/reports`, `/moderation`, and `/comments`, so the remaining gap becomes operational verification rather than contract uncertainty

### 2026-05-19 reports / moderation 页面级 runtime 联动验收补记

- 本轮补齐了 `A2-5 / A7-4` 在共享链路上的页面级 runtime 证据，目标聚焦 `prompt` 可见性真实联动，不再只停留在后端自动化回归。
- `/reports` 页面级 runtime 已完成：
  - 在后台 `/reports` 选中真实举报工单 `175db69e-5f5c-4855-99d4-e8c574d87ebc`
  - 对真实提示词 `f0eb4682-5271-47a1-a802-f4942de49daf` 执行 `offline-target`
  - 后台工单状态即时变为“已处理”，目标摘要状态即时变为 `taken_down`
  - 公共接口 `GET /api/prompts/f0eb4682-5271-47a1-a802-f4942de49daf` 已验证返回 `404 PROMPT_NOT_FOUND`
  - 本轮保留的 requestId：`codex-runtime-report-offline-20260519-1`
- `/moderation` 页面级 runtime 已完成：
  - 在后台 `/moderation` 筛中同一提示词后执行 `restore`
  - 后台审核状态即时从“已下线”变为“已通过”
  - 公共接口 `GET /api/prompts/f0eb4682-5271-47a1-a802-f4942de49daf` 已验证恢复 `200 OK`
  - 公共列表 `GET /api/prompts?page=1&pageSize=50` 已重新出现该目标
  - 本轮保留的 requestId：`codex-runtime-moderation-restore-20260519-1`、`codex-runtime-moderation-restore-20260519-2`
- 共享文档已同步更新：`.codex/community-admin-shared-sync.md`
- 当前做到哪一步：
  - `comments / reports / moderation` 三条最关键共享治理链路，都已经至少具备“后端自动化回归 + 页面级 runtime 证据”的一部分
  - 其中 `comments` 已补到前台页面重新进入后的可观察变化，`reports` 与 `moderation` 已补到公共 `prompt` 可见性联动
- 下次先做什么：
  - 继续补 `reports processing / close / hide-comment` 的页面级 runtime 证据
  - 继续补 `moderation approve / reject / offline` 的页面级 runtime 证据
  - 评估是否为 `workflow / post` 扩同等级共享回归


### 2026-05-19 reports 状态流页面级 runtime 补记

- 继续在后台 `/reports` 用真实 QA 工单 `b5e6d25f-f076-468c-84af-57c28e3c1f43` 补页面级状态流验收。
- 已在同一条工单上依次执行：
  - `标记处理中`
  - `标记已处理`
  - `归档关闭`
- 页面级证据已成立：
  - 列表与详情状态依次从 `待处理 -> 处理中 -> 已处理 -> 已归档`
  - 详情时间线已连续出现 `工单状态更新为 处理中 / 已处理 / 已归档`
  - 按钮文案也按真实状态流从 `标记已处理` 切换到 `归档关闭`
- 共享台账已同步把 `/reports` 剩余页面级缺口收窄到 `hide-comment`。
- 下次先做什么：
  - 如果要补齐 `/reports hide-comment` 页面级 runtime，需要先手动准备 comment 类型举报工单，或者找到一条现成的 comment 举报数据。

### 2026-05-19 reports hide-comment 页面级 runtime 补记

- 为补齐 `/reports hide-comment` 页面级验收，本轮先用 JDBC 向本地 PostgreSQL 插入了一条真实 `comment` 举报工单：
  - `reportId = ff934a3b-93c3-457c-a1e6-268be5620320`
  - `commentId = 044c864e-f364-4ab9-8fa0-65d173dc1b78`
  - `threadId = ca27ffdc-c143-4cef-a986-f9ac87a25acd`
  - `token = runtime-report-comment-1779181340960`
- 随后在后台 `/reports` 真实执行 `隐藏评论`。
- 页面级证据已成立：
  - 后台工单状态即时变为 `已处理`
  - 目标摘要状态即时从 `评论 · 状态 active` 变为 `评论 · 状态 hidden`
- 公共读链路已回验：
  - `GET /api/comments?targetType=post&targetId=ca27ffdc-c143-4cef-a986-f9ac87a25acd`
  - 已确认不再返回评论 `044c864e-f364-4ab9-8fa0-65d173dc1b78`
  - 保留 requestId：`codex-runtime-report-hide-comment-20260519-3`
- 共享台账已同步更新，`/reports` 当前动作集的页面级 runtime 证据已补齐。
- 下次先做什么：
  - 回到 `/moderation` 剩余 `approve / reject / offline` 页面级 runtime
  - 评估是否为 `workflow / post` 扩同等级共享回归
### 2026-05-19 moderation 全动作页面级 runtime 补齐

- 本轮把 `/moderation` 在 `prompt` 目标上的剩余页面级 runtime 证据补齐，不再只停在先前那次 `restore` 单动作验证。
- 已在后台 `/moderation` 对真实提示词 `f0eb4682-5271-47a1-a802-f4942de49daf` 完整执行：
  - `reject`
  - `approve`
  - `offline`
  - `restore`
- 页面级证据已成立：
  - `reject` 后后台审核状态即时变为 `已驳回`，公共 `/api/prompts/{id}` 返回 `404 PROMPT_NOT_FOUND`，公共 `/api/prompts` 列表同步移除该目标
  - `approve` 后后台审核状态即时变回 `已通过`，公共详情恢复 `200 OK`，公共列表重新出现该目标
  - `offline` 后后台审核状态即时变为 `已下线`，公共详情再次返回 `PROMPT_NOT_FOUND`，公共列表再次移除该目标
  - `restore` 后后台审核状态最终恢复 `已通过`，公共详情最终恢复 `200 OK`，公共列表最终重新出现该目标
- 本轮保留的 requestId：
  - `codex-runtime-moderation-reject-20260519-1`
  - `codex-runtime-moderation-reject-20260519-2`
  - `codex-runtime-moderation-approve-20260519-1`
  - `codex-runtime-moderation-approve-20260519-2`
  - `codex-runtime-moderation-offline-20260519-1`
  - `codex-runtime-moderation-offline-20260519-2`
  - `codex-runtime-moderation-restore-final-20260519-1`
  - `codex-runtime-moderation-restore-final-20260519-2`
- 共享文档已先同步更新：`.codex/community-admin-shared-sync.md`
- 当前做到哪一步：
  - `prompt` 这条 `/moderation` 公共可见性链路，已经同时具备“后端自动化回归 + 页面级 runtime 全动作证据”
- 下次先做什么：
  - 把 `/moderation` 的页面级 runtime 继续扩到 `workflow / post` 或 `/moderation` 直连 `video`，不要只在 `prompt` 上闭环

### 2026-05-19 moderation workflow/post 公共可见性共享回归

- 继续沿优化主线扩共享回归保护，这轮没有加新业务功能，只把 `moderation` 对其他真实前台目标类型的保护补上。
- 已扩展：
  - `apps/server/src/test/java/com/dramatv/community/integration/AdminModerationApiIntegrationTest.java`
- 新增用例：
  - `moderationActionsChangePublicWorkflowAndPostVisibilityAcrossDetails`
- 本轮已证明：
  - `workflow` 目标在公共 `/api/workflows/{id}` 详情上，`offline / restore` 会按预期隐藏或恢复
  - `post` 目标在公共 `/api/discussions/threads/{slug}` 详情上，`reject / approve` 会按预期隐藏或恢复
  - 对应数据库 `publish_status` 与最新 `audit_records.status_code` 同步变化
- 共享文档已先同步更新：
  - `.codex/community-admin-shared-sync.md`
  - `.codex/shared-regression-taskboard-2026-05-18.md`
- 本轮验证：
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminModerationApiIntegrationTest test`
  - 结果：`Tests run: 5, Failures: 0, Errors: 0, Skipped: 0`
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-backend-integration-suite.ps1 -Suite admin`
  - 结果：`Tests run: 38, Failures: 0, Errors: 0, Skipped: 0`
- 当前做到哪一步：
  - `moderation` 共享自动回归已不再只覆盖 `prompt`，而是扩大到 `workflow / post`
  - 当前剩余缺口主要收窄到这些目标类型的后台页面级 runtime 证据，而不是共享后端契约未知
- 下次先做什么：
  - 继续补 `workflow / post` 的 `/moderation` 页面级 runtime
  - 或者补 `/moderation` 直连 `video` 的页面级 runtime，和现有 `reports/offline-target -> video` 形成对照
### 2026-05-19 moderation workflow/post 页面级 runtime 复核

- 本轮补齐了 `workflow / post` 的后台页面级 runtime 证据。
- 浏览器复核结果：
  - `workflow` 目标 `ac6d6c40-a384-41f7-8ef1-2182094280f7` 在 `/moderation` 里显示 `已下线`
  - `post` 目标 `ca27ffdc-c143-4cef-a986-f9ac87a25acd` 在 `/moderation` 里显示 `已下线`
  - 两条公共详情链路当前都返回 `404`
- 当前结论：
  - `workflow / post` 已经不是只靠后端自动化证明，而是已经补到页面级 runtime 复核
  - 下一步可以继续收口 `video` 在 `/moderation` 直连动作下的同等级页面级 runtime
- 备注：
  - 浏览器控制台仍能看到一些与当前 `/moderation` 无关的 admin 路由编译错误日志，后续再单独清理

### 2026-05-19 admin 编译噪音复核 + smoke 补强

- 本轮先停掉“继续猜浏览器报错是不是源码坏了”的无效方向，回到当前源码和运行态做真相复核。
- 先确认的现态结论：
  - `apps/admin/src/app/(dashboard)/users/actions.ts` 之前那段损坏的错误文案模板字符串，当前源码已经是有效版本
  - `UsersPageClient.tsx` 当前也已经本地定义 `initialResetPasswordActionState`，不再依赖不存在的导出
  - `media-tasks/actions.ts` 与 `media-tasks/page.tsx` 当前源码可正常通过类型检查与构建
  - 因此，之前浏览器里那批 `/users`、`/media-tasks` 相关错误，当前更接近旧 dev bundle / HMR 残留噪音，而不是现态源码故障
- 本轮已做源码级和运行态复核：
  - `apps/admin -> npx.cmd tsc --noEmit -p tsconfig.json`
  - `apps/admin -> npm.cmd run build`
  - 浏览器实测 `http://127.0.0.1:3206/users`
  - 浏览器实测 `http://127.0.0.1:3206/media-tasks`
  - 两页当前都能正常打开，控制台无现态 error
- 本轮顺手把这次真实排过的点补进了后台 smoke：
  - 已更新 `scripts/smoke-admin-routes.mjs`
  - 原先只校验匿名守卫重定向
  - 现在新增真实 admin 登录后页面可达校验，覆盖：
    - `/dashboard`
    - `/users`
    - `/media-tasks`
    - `/moderation`
    - `/reports`
  - 校验方式不是只看 `200`，而是同时断言页面包含真实标题文案，避免“空白页/错误页也返回 200”
- 本轮验证结果：
  - `apps/admin -> npm.cmd run smoke`
  - 结果从 `7 passed / 0 failed` 提升到 `13 passed / 0 failed`
  - `apps/admin -> npx.cmd tsc --noEmit -p tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 当前做到哪一步：
  - admin 当前源码、构建、最小运行态和 smoke 已重新对齐
  - `/users` 与 `/media-tasks` 这类页面，不再只靠人工浏览器复核，已补到脚本级保护
- 下次先做什么：
  - 继续把已登录 smoke 扩到 `audit-logs / taxonomy / feed-ops/*`
  - 然后再回到共享主线，继续补 `moderation / reports` 这类会影响前台展示的页面级 runtime 证据

### 2026-05-19 admin 全量真实页面 smoke 扩展

- 延续上一轮“不要只靠人工复核 admin 运行态”的方向，这轮继续把剩余真实页面补进同一份 smoke 脚本。
- 已继续更新：
  - `scripts/smoke-admin-routes.mjs`
- 本轮新增覆盖：
  - 匿名守卫检查新增：
    - `/comments`
    - `/taxonomy`
    - `/feed-ops/featured`
    - `/feed-ops/discussions`
    - `/media-tasks`
    - `/audit-logs`
  - 已登录真实页面检查新增：
    - `/comments -> 评论治理`
    - `/taxonomy -> 分类管理`
    - `/feed-ops/home -> 首页运营`
    - `/feed-ops/featured -> 精选运营`
    - `/feed-ops/discussions -> 讨论运营`
    - `/audit-logs -> 操作日志`
- 这轮保持的校验口径：
  - 先真实登录 admin 账号
  - 再用 `dramatv_admin_access_token` 访问后台页面
  - 不只断言 `200`，同时断言页面包含真实标题文案，避免空白页或错误壳页漏过
- 本轮验证结果：
  - `apps/admin -> npm.cmd run smoke`
  - 结果从 `13 passed / 0 failed` 提升到 `25 passed / 0 failed`
- 当前做到哪一步：
  - admin 当前这套已落地真实页面主路径：
    - `/dashboard`
    - `/users`
    - `/comments`
    - `/moderation`
    - `/reports`
    - `/taxonomy`
    - `/feed-ops/home`
    - `/feed-ops/featured`
    - `/feed-ops/discussions`
    - `/media-tasks`
    - `/audit-logs`
  - 现在都已经有匿名守卫校验和已登录页面可达校验
- 下次先做什么：
  - 回到共享主线，优先补 `moderation / reports` 对前台可见性有影响的页面级 runtime 证据
  - 如果继续补 admin 自动化，再考虑给关键治理动作加“执行后状态变化”的脚本级校验，而不只是页面可达

### 2026-05-19 users 页面选中用户回顶修复

- 本轮处理了一个真实交互问题：`/users` 页面在列表中点选用户后，会整页跳回顶部，导致中下部列表无法连续查看。
- 根因已确认：
  - `apps/admin/src/app/(dashboard)/users/UsersPageClient.tsx` 之前在表格行点击里直接使用 `window.location.href`
  - 这会触发整页导航，自然丢失当前滚动位置
  - 同页内几个只切换 `selected` 查询参数的 `Link` 也没有显式关闭 Next 默认滚动
- 已修复：
  - 表格行点击改为 `useRouter().push(..., { scroll: false })`
  - 行内“查看”入口改为 `scroll={false}`
  - 详情侧栏里的关闭与“重新加载详情”入口也统一改为 `scroll={false}`
- 本轮验证：
  - `apps/admin -> npx.cmd tsc --noEmit -p tsconfig.json`
  - 浏览器实测 `http://127.0.0.1:3206/users`
  - 复核结果：
    - 先把页面滚到 `scrollTop = 1200`
    - 点击列表中部用户后，URL 正常切到 `?selected=...`
    - 页面滚动位置仍保持 `1200`，不再回顶
- 当前做到哪一步：
  - `users` 页现在已经支持在长列表里连续查看不同用户，而不会每次选中都打断浏览位置
- 下次先做什么：
  - 顺手扫一遍 `comments / reports / moderation / media-tasks` 是否也存在同类“同页切详情却回顶”的交互问题

### 2026-05-19 users 右侧详情区独立滚动修复

- 本轮继续处理 `users` 页的一个真实交互问题：右侧账号详情卡片虽然是悬浮的，但内容过长时只能跟着整页一起滚，不能单独滚动。
- 根因已确认：
  - `apps/admin/src/app/(dashboard)/users/page.module.css` 里，`.detailCard` 只有 `position: sticky`
  - 但没有像 `moderation / reports` 等页那样给内层详情区设置“视口内最大高度 + overflow”
  - 结果就是详情卡只会跟随页面整体滚动，而不会形成独立滚动容器
- 已修复：
  - `.detailCard` 增加 `max-height: calc(100vh - 28px)`
  - `.detailBody` 增加：
    - `max-height: calc(100vh - 84px)`
    - `overflow-y: auto`
    - `scrollbar-gutter: stable`
- 本轮验证：
  - `apps/admin -> npx.cmd tsc --noEmit -p tsconfig.json`
  - 浏览器实测 `http://127.0.0.1:3206/users?selected=3297c859-ccc9-4407-99ce-fb1929ddc19b`
  - 复核结果：
    - 详情区当前 `bodyOverflowY = auto`
    - `bodyScrollHeight = 1667`
    - `bodyClientHeight = 890`
    - 手动把详情区滚到 `320` 后，页面整体 `scrollTop` 仍保持 `0`
- 当前做到哪一步：
  - `users` 页右侧账号详情区已经和 `moderation / reports` 一样，具备独立滚动能力
- 下次先做什么：
  - 顺手扫一遍 `media-tasks` 和 `audit-logs` 的右侧详情卡在长内容下是否也需要统一成相同滚动模式

### 2026-05-19 users 真分页落地

- 本轮把 `/users` 从“后端固定最近 50 条 + 前端提示文案”升级成真实分页，不再伪装成列表已完整可控。
- 后端已改为真实分页契约：
  - `GET /api/admin/users` 新增 `page / pageSize`
  - `AdminUserListResponse` 新增 `pagination`
  - `AdminUserQueryService` 不再写死 `limit 50`，改为：
    - 默认 `page=1`
    - 默认 `pageSize=20`
    - 最大 `pageSize=100`
    - 返回 `totalItems / totalPages / hasPrevious / hasNext`
- 后端回归已补：
  - `AdminUserGovernanceApiIntegrationTest`
  - 新增分页用例，证明：
    - 第 1 页与第 2 页结果不同
    - 分页元数据正确返回
- 前端 `/users` 已同步切到真实分页：
  - `apps/admin/src/lib/admin-service.ts` 支持传 `q / page / pageSize`
  - `page.tsx` 按真实 `pagination` 组装 `PageData`
  - `UsersPageClient.tsx` 移除“固定最近 50 条”提示
  - 表格底部改成真实分页按钮
  - 搜索会把页码重置到 `1`
  - 账号治理保存后会保留当前 `q / page / selected`
  - 同页选中用户的 `scroll={false}` 行为继续保留
- 本轮验证已通过：
  - `apps/server -> powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminUserGovernanceApiIntegrationTest test`
  - `apps/admin -> npx.cmd tsc --noEmit -p tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 当前做到哪一步：
  - `/users` 现在已经不是“只展示最近 50 条”的半真页面，而是接入真实分页的治理列表
  - 当前剩余缺口主要是页面级操作体验复核，不是分页契约缺失
- 下次先做什么：
  - 浏览器复核 `/users` 的分页切换、选中态与详情回跳
  - 继续扫其他后台治理页是否也需要从固定条数切到真实分页

### 2026-05-19 users 最近内容侧栏收口

- 本轮继续收 `/users` 右侧详情卡里的“最近内容”区，不再允许内容数量直接把详情栏越撑越长。
- 页面交互已改为 `摘要列表 + 独立弹层` 两层结构：
  - 右侧详情栏只展示紧凑版最近内容摘要
  - 摘要区改为固定高度内部滚动，不再随着条数无限扩高
  - 当最近内容超过 `4` 条时，显示“查看全部 N 条”按钮
  - 完整列表进入独立弹层查看，避免右侧治理区被内容列表挤占
- 本轮同时压缩了单条内容信息密度：
  - 保留 `类型 / 状态 / 标题 / 时间`
  - 取消原先偏大卡片式纵向堆叠的视觉占用
- 本轮验证已通过：
  - `apps/admin -> npx.cmd tsc --noEmit -p tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 当前做到哪一步：
  - `/users` 右侧详情区已经从“内容越多越失控”收口到稳定高度的治理侧栏
  - 后续再增加最近内容数量时，主要影响弹层滚动，不再破坏主页面结构
- 下次先做什么：
  - 浏览器复核 `/users` 最近内容摘要区滚动、弹层开关与移动端窄屏表现
  - 如体验稳定，可把同样模式推广到其他详情侧栏中的长列表区

### 2026-05-19 moderation 列表选中交互对齐

- 本轮把 `/moderation` 列表交互对齐到 `/users` 已验收过的模式，收掉三个老问题：
  - 选中后页面回到顶部
  - 当前选中态不明显
  - 只能点“查看详情”才能选中
- 页面已改为整行可选中：
  - 审核列表每一行现在都可直接点击选中
  - 同时补了键盘 `Enter / Space` 选中支持
  - 行内保留右侧入口，但不再承担唯一选中职责
- 选中跳转已改为无滚动跳转：
  - 行选中使用 `router.push(..., { scroll: false })`
  - 行内链接也统一改成 `scroll={false}`
  - 这样切换审核项时不会再把页面滚回顶部
- 视觉已同步增强：
  - 当前选中行改成更强的蓝灰色高亮底
  - 左侧增加强调线
  - 选中行文字字重提升，和普通 hover 态明显区分
- 本轮验证已通过：
  - `apps/admin -> npx.cmd tsc --noEmit -p tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 当前做到哪一步：
  - `/moderation` 的列表选中体验已经不再落后于 `/users`
  - 这一套“整行可选中 + scroll=false + 强选中态”的模式可继续推广到其他治理表格页
- 下次先做什么：
  - 浏览器复核 `/moderation` 在长页滚动下切换多条内容时是否稳定不回顶
  - 继续扫 `reports / media-tasks / audit-logs` 是否还残留同类交互问题

### 2026-05-19 moderation 内容类型筛选口径修正

- 本轮修正了 `/moderation` 的“内容类型”筛选口径错误：
  - 之前下拉里包含了 `视频作品`
  - 但当前审核页真实重点是 `prompt` 内容，应区分 `图片提示词 / 视频提示词`
- 前端筛选项已改为：
  - `全部内容类型`
  - `图片提示词`
  - `视频提示词`
  - `工作流`
  - `帖子`
- 后端审核列表接口已同步支持真实 modality 筛选：
  - `targetType=image_prompt`
  - `targetType=video_prompt`
  - 不是只改前端文案，而是列表查询会按 `prompt.modality` 真筛
- 本轮同时避免了一个回归坑：
  - 审核动作和详情读取仍然继续使用真实对象类型 `video / prompt / workflow / post`
  - 没有把 `image_prompt / video_prompt` 误用到动作接口路径里
- 本轮新增后端回归：
  - `AdminModerationApiIntegrationTest` 新增 prompt modality 筛选用例
  - 证明 `image_prompt` 与 `video_prompt` 返回结果可正确区分
- 本轮验证已通过：
  - `apps/server -> powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminModerationApiIntegrationTest test`
  - `apps/admin -> npx.cmd tsc --noEmit -p tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 当前做到哪一步：
  - `/moderation` 的内容类型筛选现在已经和真实业务口径对齐，不再把提示词和视频作品混成一套分类
- 下次先做什么：
  - 顺手检查 `comments / dashboard / audit-logs` 是否还保留旧的 `视频作品 / 提示词` 混合口径

### 2026-05-19 reports 第一轮交互收口

- 本轮对 `/reports` 先做了一轮和 `/users`、`/moderation` 对齐的基础交互治理，收掉同类重复问题：
  - 顶部“当前为实时举报数据”提示卡已移除
  - 列表不再依赖“查看详情”按钮作为唯一选中入口
  - 列表每一行现在都支持直接点击选中
  - 行切换改为无滚动跳转，避免切换时页面回到顶部
  - 当前选中态已加强，增加明显底色和左侧强调线
- 列表右侧最后一列已从按钮壳子收成轻量提示：
  - `当前查看中`
  - `点击行查看`
- 详情抽屉关闭入口也已统一改成 `scroll={false}`，避免关闭详情时页面滚动位置跳变
- 本轮验证已通过：
  - `apps/admin -> npx.cmd tsc --noEmit -p tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 当前做到哪一步：
  - `/reports` 已完成第一轮“去壳 + 行选中 + 不回顶 + 强选中态”收口
  - 页面还可以继续做第二轮精修，但基础重复问题已先统一
- 下次先做什么：
  - 浏览器复核 `/reports` 在长列表和右侧详情联动下的滚动稳定性
  - 再扫 `comments / media-tasks / audit-logs` 是否还残留同样的老交互壳

### 2026-05-21 后台剩余页面共性交互统一收口

- 本轮继续按已验收的 `users / moderation / reports` 交互标准，统一收口后台剩余页面的共性前端问题，优先不做零散视觉微调，只先对齐交互骨架。
- 已完成统一收口的页面：
  - `comments`
  - `audit-logs`
  - `media-tasks`
  - `taxonomy`
  - `feed-ops/*`（先收顶部壳提示与右侧预览滚动）
- 本轮已统一落地的共性点：
  - 去掉低价值顶部说明壳：`comments / taxonomy / feed-ops/*`
  - 列表页改为整行可选中，不再依赖“查看详情”按钮列：`comments / audit-logs / media-tasks`
  - 选中态加强为背景高亮 + 左侧强调线 + 行内辅助提示文案：`comments / audit-logs / media-tasks / taxonomy`
  - 详情关闭与局部刷新改为 `Link + scroll={false}`，避免切换或关闭时页面回到顶部：`comments / audit-logs / media-tasks`
  - 右侧详情/预览区域改为独立滚动：`audit-logs / media-tasks / feed-ops/*`
- 本轮新增前端交互组件：
  - `apps/admin/src/app/(dashboard)/comments/CommentsTableInteractive.tsx`
  - `apps/admin/src/app/(dashboard)/audit-logs/AuditLogsTableInteractive.tsx`
  - `apps/admin/src/app/(dashboard)/media-tasks/MediaTasksTableInteractive.tsx`
- 本轮代码验证已通过：
  - `apps/admin -> npx.cmd tsc --noEmit -p tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 当前做到哪一步：
  - 后台这批仍残留旧交互壳的页面，已经基本并到同一套“整行选中 + 不回顶 + 右侧独立滚动 + 去壳提示”的交互模型上。
  - 现在更适合进入你逐页体验后的定向精修，而不是继续抽象层面的统一改造。
- 下次先做什么：
  - 根据你的逐页体验反馈，继续补单页细节问题。
  - 若发现某一页仍有回顶、选中不明显、侧栏不独立滚动等残留，再按同一模型继续补齐。

### 2026-05-21 admin 全局顶栏固定

- 本轮处理了一个跨页面共性壳层问题：后台每个页面顶部 header 条会随着页面正文一起滚动，导致导航与账号操作区在长页中丢失。
- 已收口到 `AdminShell` 壳层布局，不再逐页单独修：
  - `apps/admin/src/components/AdminShell.module.css`
- 本轮调整点：
  - `.shell` 改为视口级双栏布局，固定 `height: 100vh`，避免整页文档继续承担后台主滚动
  - `.sidebar` 改为独立纵向滚动容器，长导航不会再把整体页面撑出第二套滚动
  - `.workspace` 改为 `topbar + content` 两段式布局，并限制在视口高度内
  - `.workspaceContent` 改为后台主滚动容器，页面正文在这里滚动
  - `.topbar` 保持在工作区顶部，不再跟随正文滚走
- 这轮特意控制了作用范围：
  - 没有改各业务页内容结构
  - 没有动已经做好的右侧详情独立滚动逻辑
  - 只是把“滚动归属”从整页文档收回到后台壳层内部
- 本轮验证已通过：
  - `apps/admin -> npx.cmd tsc --noEmit -p tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 当前做到哪一步：
  - 后台全局顶栏已经并入统一固定壳层，后续不需要每个页面单独再修“顶部跟着滚动”的问题
- 下次先做什么：
  - 等你继续逐页体验，补剩余局部交互或视觉细节
  - 如果发现移动端或窄屏下壳层滚动还有边缘问题，再针对响应式断点微调

### 2026-05-21 moderation 真实媒体按需加载

- 本轮把 `/moderation` 从“静态占位预览块”升级成“接真实媒体、但不全量挂载”的形态，参考了社区前台首页/详情页的资源加载方式。
- 后端已补齐审核列表和审核详情的媒体 URL 契约：
  - 列表项增加 `media.coverUrl / posterUrl / previewUrl / sourceUrl`
  - 详情项增加同构 `media`，用于当前选中项的真实封面/视频预览
- 后端审核查询已直接复用媒体资产解析逻辑：
  - 视频目标取 `cover / poster / preview / source`
  - 图片提示词取 `cover / poster`
  - 工作流取 `cover`
  - 列表与详情都不再依赖纯渐变占位
- 前端审核页的加载策略已收口为：
  - 列表只加载缩略图，不挂载整批视频
  - 右侧详情仅对当前选中项挂载真实图片或 `preload="metadata"` 视频
  - 保留原始素材链接，但不自动加载源视频
- 本轮验证已通过：
  - `apps/server -> powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminModerationApiIntegrationTest test`
  - `apps/admin -> npx.cmd tsc --noEmit -p tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 当前做到哪一步：
  - `/moderation` 已经从“看不到真实资源”收口到“能看真实资源，但加载压力可控”的状态
- 下次先做什么：
  - 你继续看实际页面，如果还想让列表缩略图更像前台卡片，可以再做一轮视觉细化
  - 如果其他治理页也有同类资源占位问题，再按同一套按需加载方案扩展

## 2026-05-21 moderation 空值修复

- 已把后台审核页的媒体对象改成统一归一化入口：列表和详情都先走 `normalizeMedia()`，不再直接信任后端返回的 `media` 一定完整。
- `resolveThumbnailUrl()` 和详情预览读取都已改成空值安全，避免 `coverUrl` / `posterUrl` 缺失时直接炸页。
- 本轮已完成本地校验：`apps/admin -> npx.cmd tsc --noEmit`、`apps/admin -> npm.cmd run build`。
- 当前状态：`/moderation` 的“列表缩略图 + 右侧详情真实媒体”链路已恢复到空值安全状态，后续如果还有页面闪退，优先查其他治理页是否也在直接解引用 `media`。

## 2026-05-21 moderation 真实媒体代理补齐

- 这次进一步补上了 `apps/admin` 对 `/media/**` 的真实媒体代理口径：审核页现在复用运营配置页同款 `resolveFeedOpsMediaUrl()`，不再把相对媒体路径打到 `3206` 自己身上。
- 后端审核详情也补了 `prompt` 的 `example` 兜底，媒体优先级收口为 `cover -> primary example -> example`，并把原始素材链接一并带回。
- 验证已通过：`apps/server -> AdminModerationApiIntegrationTest`，`apps/admin -> npx.cmd tsc --noEmit`，浏览器刷新 `/moderation` 后控制台无 error，详情区已能挂到真实图片资源。

## 2026-05-21 moderation 视频点击播放

- 审核详情里的视频预览不再直接内嵌播放器，改成默认只显示封面图和“点击放大播放”入口。
- 点击后会打开独立弹层，弹层内的视频才开始播放，列表和详情首屏都不再自动播放。
- 本轮验证已通过：`apps/admin -> npx.cmd tsc --noEmit`、`apps/admin -> npm.cmd run build`。
### 2026-05-21 reports 真实媒体预览修复

- 本轮把 `/reports` 的右侧详情从“摘要卡”收口成“真实媒体预览 + 证据线索后续增强”的形态。
- 后端 `AdminReportService` 的详情查询已补齐并验证真实资源字段：
  - `targetCoverUrl`
  - `targetPosterUrl`
  - `targetPreviewUrl`
  - `targetSourceUrl`
- 这轮顺手修掉了两个真实问题：
  - 详情 SQL 仍残留的列歧义，已统一收口到 `rr.` 前缀后重启生效。
  - 图片提示词举报单之前会被误走成视频预览，现已按资源类型分流，图片只走封面/源图分支，视频才走 `<video>`。
- 前端 `apps/admin/src/app/(dashboard)/reports/page.tsx` 已统一接入共享媒体解析，避免本地静态资源和后端代理路径混用。
- 验证已通过：
  - `GET /api/admin/reports/{id}` 可返回真实媒体字段
  - `http://127.0.0.1:3206/reports` 右侧详情可展示真实视频和真实图片
- 当前状态：`reports` 已从“假摘要”收口到“真实资源预览”状态，下次优先继续细化举报工单文案和状态流转。

### 2026-05-21 reports 点击放大预览

- 本轮继续把 `/reports` 的媒体预览补成可审核形态：右侧详情里的图片和视频现在都支持点击后放大预览。
- 新增 `apps/admin/src/app/(dashboard)/reports/ReportsMediaPreview.tsx`，交互口径对齐 `moderation`：
  - 视频点击后弹出独立弹层并挂载播放器
  - 图片点击后弹出独立弹层并展示大图
  - 支持 `Escape` 关闭和遮罩点击关闭
- `reports/page.tsx` 已改为复用该预览组件，不再在详情卡内直接嵌小尺寸 `<video controls>`。
- 验证已通过：
  - `apps/admin -> npx.cmd tsc --noEmit`
  - 浏览器实测 `/reports?selected=43ceb245-4d34-4bf5-bce7-5df6e24c7c7d` 可弹出视频放大层
  - 浏览器实测 `/reports?selected=175db69e-5f5c-4855-99d4-e8c574d87ebc` 可弹出图片放大层

### 2026-05-21 resources 资源治理页落地

- 本轮把后台资源治理页 `/resources` 补齐成真实管理入口，覆盖前台的真实资源集合：
  - 视频提示词
  - 图片提示词
  - 工作流
  - 帖子
  - 视频作品
- 列表与详情已接真实后端，不再是占位壳：
  - 列表支持 `q / targetType / status / page / pageSize`
  - 详情支持 `/{targetType}/{targetId}` 直查
  - 资源预览复用现有媒体解析，能看到真实封面、预览和源资源
- 资源治理动作已复用既有审核动作口径：
  - `offline / restore`
  - 下线后应立即影响前台公开可见性
  - 恢复后应立即回到可见状态
- 本轮已验证：
  - `apps/server -> AdminResourceApiIntegrationTest`
  - `apps/admin -> npm.cmd run typecheck`
  - `apps/admin -> npm.cmd run build`

### 2026-05-21 resources 提示词正文展示细化

- 本轮继续收口 `/resources` 右侧详情，避免提示词正文再被误看成摘要段：
  - 详情区现在把 `摘要` 和 `提示词正文 / 正文` 拆成两个独立块
  - 提示词正文改为可换行的独立内容块，便于直接核对实际 prompt body
  - 对提示词资源会明确标注 `提示词正文`，不再只显示一个笼统的正文块
- 前端只做了展示层细化，没有改后端契约：
  - `contentText` 仍然来自真实详情接口
  - 只是把资源详情的可读性和可审核性分开了
- 本轮已验证：
  - `apps/admin -> npm.cmd run build`

### 2026-05-21 resources 提示词正文改读 raw 字段

- 本轮继续修正 `/resources` 提示词详情仍只显示摘要的问题，根因不在前端样式，而在后端资源详情查询对 prompt 正文字段取值过浅：
  - 之前优先取的是 `prompt_text`
  - 现在改为优先取 `prompt_text_raw`
  - 再退回 `prompt_text`
  - 最后才退回 `summary`
- 这意味着资源治理页会优先展示真实完整提示词正文，而不是展示给前台卡片或轻详情用的短文本版本。
- 已新增后端回归保护：
  - `AdminResourceApiIntegrationTest.resourceDetailPrefersPromptRawTextOverSummary`
  - 明确锁定 `summaryText` 和 `contentText` 不再被混成同一份文本
- 本轮已验证：
  - `apps/server -> powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminResourceApiIntegrationTest test`
  - `apps/admin -> npm.cmd run build`
  - 本地 `18080` 已按 `scripts/start-server-dev-18080.ps1` 重启到新代码

### 2026-05-21 管理后台测试环境云发布入口补齐

- 本轮把管理后台 `apps/admin` 正式接入测试环境 release 体系，不再只有本地 `3206` 可跑：
  - 新增 `scripts/deploy-test-admin.ps1`
  - 新增 `scripts/rollback-test-admin.ps1`
  - `scripts/list-test-releases.ps1` 已支持 `-Runtime admin`
  - `scripts/stamp-test-stable-baseline.ps1` 已支持在远端存在 admin current 时一并补 `release.json`
- 根命令入口已补齐：
  - `npm run deploy:test:admin`
  - `npm run rollback:test:admin -- -ReleaseName <release> -VerifyAfterRollback`
- 这轮云发布策略先固定为“独立端口、独立 release、共享后端”：
  - 远端 release 根目录：`/opt/dramatv-community-admin`
  - 服务名：`dramatv-community-admin`
  - 服务端请求共享后端继续走 `DRAMATV_ADMIN_API_BASE_URL=http://127.0.0.1:18080`
  - 浏览器侧真实媒体和前台静态资源解析统一走社区公网入口
  - 当前后台公网验收入口先按 `http://8.141.20.130:3206` 管理，不和社区前台 `80 -> apps/web` 的根路由混写
- 后验收口径也已收口：
  - `deploy-test-admin.ps1` / `rollback-test-admin.ps1` 的部署后验证统一复用 `scripts/smoke-admin-routes.mjs`
  - 新增设计补充文档：`docs/04_实施设计/测试环境管理后台云发布补充-2026-05-21.md`
- 本轮已验证：
  - 4 个 PowerShell 发布脚本语法检查通过：
    - `scripts/deploy-test-admin.ps1`
    - `scripts/rollback-test-admin.ps1`
    - `scripts/list-test-releases.ps1`
    - `scripts/stamp-test-stable-baseline.ps1`
  - 根 `package.json` 已能正常解析新增脚本入口

### 2026-05-21 服务器侧 3206 放通

- 已在测试云机上放通 `3206/tcp`：
  - `firewalld` 已启用并设为开机启动
  - `firewall-cmd --permanent --add-port=3206/tcp` 已写入
  - 当前 `firewall-cmd --list-ports` 可见 `3206/tcp`
- 说明：
  - 这是服务器本机防火墙层面的放通，不等于云厂商安全组自动放通
  - 后续如果公网仍访问不到，需要再查云安全组或服务进程是否真正启动到 `0.0.0.0:3206`

### 2026-05-21 admin 云发布 smoke 拆分公网入口与云内登录

- 本轮继续收口管理后台测试环境发布验收，不再把“公网入口可达”和“云内网登录链路可用”混成一条错误检查：
  - `scripts/smoke-admin-routes.mjs` 新增 `--mode public|full`
  - `public` 模式只验 `:3206` 公网登录页和受保护路由重定向
  - `full` 模式继续验真实登录和登录后页面 HTML
- `scripts/deploy-test-admin.ps1` 的部署后验证已改成两段：
  - 本地先跑 `public` smoke，确认 `http://8.141.20.130:3206` 的公网入口可访问
  - 再把 smoke 脚本上传到云机，在云机内用 `127.0.0.1:3206 + 127.0.0.1:18080` 跑 `full` smoke，确认真实登录链路可用
- 这样调整的原因已经明确：
  - 管理后台当前用户入口是公网独立端口 `3206`
  - 但后台服务端真实登录依赖的仍然是云机内网后端 `DRAMATV_ADMIN_API_BASE_URL=http://127.0.0.1:18080`
  - 之前部署脚本把本地 smoke 的登录接口错误打到公网 `http://8.141.20.130/api/admin/auth/login`
  - 结果是服务本身和端口已经正常，也会被误判成部署失败
- 本轮同步更新：
  - `docs/04_实施设计/测试环境管理后台云发布补充-2026-05-21.md`
- 本地脚本级验证已通过：
  - `node --check scripts/smoke-admin-routes.mjs`
  - `PowerShell Parser::ParseFile(scripts/deploy-test-admin.ps1)` 语法检查
- 运行态验证已通过：
  - 公网 `public` smoke：`http://8.141.20.130:3206`，结果 `13 passed / 0 failed`
  - 云机内 `full` smoke：`127.0.0.1:3206 + 127.0.0.1:18080`，结果 `25 passed / 0 failed`
  - 验证产物：
    - `artifacts/runtime-readiness/test/manual-admin-public-smoke-summary.json`
    - `artifacts/runtime-readiness/test/manual-admin-internal-smoke-summary.json`
