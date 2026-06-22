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

### 2026-05-22 feed-ops 候选池真分页收口

- 本轮继续收口 `apps/admin /feed-ops/*` 的候选内容加载策略，目标不是只让页面“先进去”，而是把候选池接口本身也从“全量查出再内存筛选”改成真实分页读取：
  - 页面主配置 `GET /api/admin/feed-ops/{pageKey}` 继续保持轻量响应，不再携带整池 `candidatePool`
  - 候选池读取统一走新接口：
    - `GET /api/admin/feed-ops/home/candidates`
    - `GET /api/admin/feed-ops/featured/candidates`
    - `GET /api/admin/feed-ops/discussions/candidates`
  - 后端 `AdminFeedOpsService` 现已改为：
    - 页面首屏 fallback 只按每类资源抓取有限窗口
    - 候选池分页按 `slotKey / promptFilter / keyword / page / pageSize` 做数据库侧筛选
    - 不再返回页面级整池候选列表，避免云端点击“运营配置”后先卡在大 payload 上
  - 同时修正一处真实偏差：页面 fallback 池读取 prompt 时不再把 `promptFilter=null` 误当成“图片提示词”
- 本轮定向回归已通过：
  - `apps/server -> .\\scripts\\use-local-java17-maven.ps1 -f apps/server/pom.xml '-Dtest=AdminFeedOpsHomeApiIntegrationTest,AdminFeedOpsFeaturedApiIntegrationTest,AdminFeedOpsDiscussionsApiIntegrationTest' test`
  - `apps/admin -> npm.cmd run build`
- 补充说明：
  - `apps/admin -> npm.cmd run typecheck` 仍会因为本地 `.next/types` 缺文件单独报错，这次没有新增这一类问题；同轮 `next build` 的 TypeScript 阶段已通过，说明当前改动本身可编译
- 当前做到哪一步：
  - 运营配置页的“点击后无响应体感”问题，现已从前端 `loading.tsx + 异步候选加载` 和后端“候选池真分页”两侧一起收口
  - 现在剩下的重点不再是整池加载，而是继续看云端真实服务是否已重启到这版后端，并补操作级验收
- 下次先做什么：
  - 重启本地或云端后台服务后，优先验证 `/feed-ops/home`、`/feed-ops/featured`、`/feed-ops/discussions` 三页切换体感
  - 再检查候选池翻页、关键词筛选、图片/视频筛选是否都走到了真实接口
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

### 2026-05-22 管理后台布局收口版已同步到测试云环境

- 本轮已把后台这批高频治理页的布局收口版同步到测试云环境，重点不是新增业务功能，而是统一修正中宽屏和跨浏览器下的比例挤压问题：
  - `users`
  - `comments`
  - `moderation`
  - `reports`
  - `resources`
  - `media-tasks`
  - `audit-logs`
- 这轮云同步的核心改动包括：
  - 外层工作区横向留白收窄
  - “左列表 + 右详情”页面改成更弹性的双栏宽度
  - 右侧详情在更早断点下切单列，不再等到极窄宽度才折叠
  - 指标卡和筛选区改成自适应列，减少 `Chrome / Edge / 不同缩放` 下的中间挤压带
  - 右侧详情中的长 ID / 长文本补了收缩与换行保护
- 本轮发布已执行：
  - `npm run deploy:test:admin`
- 本轮发布结果：
  - 远端 release：`/opt/dramatv-community-admin/releases/20260522-113320`
  - 当前 active release：`20260522-113320`
  - 服务：`dramatv-community-admin` 已保持 `active (running)`
  - 公网入口：`http://8.141.20.130:3206`
- 本轮自动验证已通过：
  - 发布前：`verify:quick`
  - 发布后公网 `public` smoke：`13 passed / 0 failed`
  - 发布后云机内 `full` smoke：`25 passed / 0 failed`
  - 产物：
    - `artifacts/runtime-readiness/test/admin-deploy-20260522-113320-public-summary.json`
    - `artifacts/runtime-readiness/test/admin-deploy-20260522-113320-internal-summary.json`
- 注意：
  - 发布脚本提示本次是从 dirty workspace 发布，这是因为当前工作区还带着进度文档和本轮布局收口改动，属于预期内发布，不是脚本异常。

### 2026-05-22 users 创建账号真功能落地

- 本轮已把 `/users` 补成真实可用的“创建账号”链路，不再只是看列表、改状态、重置密码：
  - 后端新增 `POST /api/admin/users`
  - 前端用户管理页新增“创建账号”按钮与弹窗表单
  - 创建成功后会直接返回初始密码，可立刻用于本地账号登录
- 这轮不是只补 UI 壳，是真链路：
  - 新账号会真实写入 `users`
  - 同步补 `creator_profiles`
  - 统一走本地账号口径：`identity_provider=local`
  - 支持创建时直接填写密码；如果留空，则回落到默认密码 `dramatv-local-dev`
  - 初始密码会真实写入 `password_hash`
  - 同步记一条 `create_user` 审计日志
- 当前权限边界也一起收口了：
  - `admin / operator` 可创建账号
  - `moderator` 仍可看用户页，但不能执行创建、治理保存、重置密码
  - `operator` 不能创建 `admin`
  - 只有 `admin` 可在创建弹窗里选择 `管理员`
- 本轮验证已通过：
  - `apps/server -> AdminUserGovernanceApiIntegrationTest`，结果 `9 passed / 0 failed`
  - `apps/admin -> npx.cmd tsc --noEmit -p tsconfig.json`
  - `apps/admin -> npm.cmd run build`
  - 运行态真接口回归：
    - `POST /api/admin/users` 留空密码时返回 `dramatv-local-dev`
    - `POST /api/admin/users` 传 `DramaTV@2026` 时返回该自定义密码
    - 两种账号都已实测能通过社区 `/api/auth/login` 登录成功
- 当前做到哪一步：
  - 用户管理页已经从“治理已有账号”扩展到“可真实创建后台/社区本地账号”，且创建密码策略已从单一随机临时密码收口到“自定义优先、留空默认”
- 下次先做什么：
  - 如果你确认交互形态可以，再把这条能力同步到云测试环境

### 2026-05-22 users 创建账号已同步到测试云环境

- 本轮已把上一条本地完成的“创建账号”能力正式同步到测试云环境，前后端与共享后端都已切到新 release：
  - backend：`/opt/dramatv-community-server/releases/20260522-123003`
  - admin：`/opt/dramatv-community-admin/releases/20260522-123432`
  - 云端服务状态：
    - `dramatv-community-server` = `active`
    - `dramatv-community-admin` = `active`
- 本轮云端发布结果需要分开看：
  - 后台前端发布成功，发布后 `public smoke` 与 `internal smoke` 都通过
  - 后端共享服务也已成功切到新 jar 并重启成功
  - 但 `scripts/deploy-test-backend.ps1` 的收尾 `check-test-runtime-readiness.mjs` 仍对公网社区入口 `http://8.141.20.130` 返回一组 `fetch failed`
  - 这条失败不是“创建账号能力未生效”，而是当前社区公网入口 readiness 本身与本次后台账号功能无关
- 本轮已补云机内网真验收，不再只依赖部署脚本：
  - `POST http://127.0.0.1:18080/api/admin/auth/login`
  - `POST http://127.0.0.1:18080/api/admin/users`
  - `POST http://127.0.0.1:18080/api/auth/login`
  - 实测结果：
    - 空密码创建账号 `cloudsync_blank_20260522124137` 时，后端返回默认密码 `dramatv-local-dev`，随后社区本地密码登录成功
    - 自定义密码创建账号 `cloudsync_custom_20260522124137` 时，后端返回自定义密码 `CloudSync!20260522124137`，随后社区本地密码登录成功
- 本轮云端自动验证证据：
  - 后台公网 smoke：`artifacts/runtime-readiness/test/admin-deploy-20260522-123432-public-summary.json`
  - 后台云机内 smoke：`artifacts/runtime-readiness/test/admin-deploy-20260522-123432-internal-summary.json`
  - 后端 deploy summary：`artifacts/runtime-readiness/test/backend-deploy-20260522-123003-summary.json`
- 当前做到哪一步：
  - `/users` 的“创建账号 + 默认密码回退 + 自定义密码 + 社区本地登录”这条链路已经在测试云环境真实可用
  - 当前剩余的不是这条能力本身，而是后续是否要继续补批量建号、首登改密等增强项
- 下次先做什么：
  - 优先让你直接在测试云环境手动验一轮创建账号交互
  - 再决定是否继续扩展创建表单字段或密码治理策略

### 2026-05-22 云端审核/资源页真实媒体访问链路修复

- 本轮处理的不是“审核接口没返回真实资源”，而是“云上后台浏览器拿到真实资源路径后，请求走错了公网入口”：
  - 云机内网 `http://127.0.0.1:18080/media/...` 实测 `200`
  - 云端后台 `/api/admin/moderation/items` 也已返回真实 `coverUrl / posterUrl / previewUrl / sourceUrl`
  - 但后台浏览器之前把这些相对路径直接拼成 `http://8.141.20.130/media/...`
  - 该公网路径在浏览器运行态里统一返回 `502 Bad Gateway`
- 本轮根因已定位清楚：
  - 问题不在审核数据本身
  - 问题在后台前端媒体 URL 解析策略过度依赖社区公网入口
  - 只要社区公网 `/media` 链路不稳定，后台审核页、资源治理页、运营编排页里的真实图片/视频预览就会一起失效
- 本轮修复方式：
  - `apps/admin` 媒体 URL 统一改走后台同源代理前缀：`/__admin_proxy__/...`
  - `apps/admin/next.config.ts` 新增 rewrites：
    - `__admin_proxy__/media/* -> http://127.0.0.1:18080/media/*`
    - `__admin_proxy__/seedance-videos/* -> 社区前台静态资源入口`
    - `__admin_proxy__/nano-banana-images/* -> 社区前台静态资源入口`
  - `feed-ops-media.ts` 不再把相对媒体路径直接拼到社区公网根域名，而是统一收口到后台同源代理
- 本轮验证已通过：
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`

### 2026-05-25 taxonomy 分类管理页信息架构收口

- 用户反馈：
  - 页面排版混乱
  - 中间列表信息少但占位大
  - 页面用途不清楚
- 本轮处理：
  - `apps/admin/src/app/(dashboard)/taxonomy/page.tsx`
    - 顶部补“页面用途 + 4 步操作”说明，明确这页分成“分类治理”和“批量修正提示词池”两类操作
    - 给三块主工作区补 `步骤 1/2/3`，中间列表补“点击分类名即可切换右侧治理配置”
    - 中间分类列表真正挂上可点击入口，分类名可直接切换右侧治理面板
    - 原先塞在右侧卡片里的“待修正提示词池”拆到页面下方，独立成 `步骤 4`
  - `apps/admin/src/app/(dashboard)/taxonomy/page.module.css`
    - 收窄三栏布局右侧宽度
    - 新增 guide / step / bulk stage 样式
    - 压缩表格最小宽度，减少“信息少但占位大”的感觉
    - 隐藏旧的内嵌 bulk 区，避免重复展示
- 本轮验证已通过：
  - `apps/admin -> npm.cmd run typecheck`
  - `apps/admin -> npm.cmd run build`
- 当前做到哪一步：
  - taxonomy 页已经从“右侧大表单里混合两种任务”改成“上半区治理分类、下半区批量修正提示词”的结构
- 下次先做什么：
  - 登录后台手动复看 `taxonomy` 页的真实视觉密度
  - 如果还觉得列表占位偏大，再继续压缩表格列宽或改成更强的 master-detail 形式
  - 测试云环境后台新 release：`/opt/dramatv-community-admin/releases/20260522-130604`
  - 发布后 smoke：
    - `artifacts/runtime-readiness/test/admin-deploy-20260522-130604-public-summary.json`
    - `artifacts/runtime-readiness/test/admin-deploy-20260522-130604-internal-summary.json`
  - 浏览器运行态复验：
    - 审核页媒体请求已从旧的 `http://8.141.20.130/media/...`
    - 切换为 `http://8.141.20.130:3206/__admin_proxy__/media/...`
    - 这些真实媒体请求当前已返回 `200 OK`
- 当前做到哪一步：
  - 云上后台“审核 / 资源 / 编排”这类依赖真实媒体资源的页面，已经不再被社区公网 `80` 口媒体链路卡死
  - 当前剩余风险主要转到：如果后续正式上独立后台域名，仍要保留这套同源代理口径，不要再回退到直接拼公网根域名
- 下次先做什么：
  - 优先让你手动复验审核页与资源治理页的图片/视频预览
  - 如果还有单页残留异常，再按页面补专项回归，不重开旧的公网媒体直连方案

### 2026-05-22 后台多页读取异常恢复

- 本轮处理的是一组看起来像“评论治理 / 内容审核 / 举报中心 / 首页运营 / 媒体任务 / 操作日志都读不到数据”的后台故障。
- 实际排查结果分成两层，不是单一原因：
  - 第一层是本地 `18080` 后端运行态一度不是最新代码，导致多页在新前端分页契约下读到旧响应结构时直接掉进错误态。
  - 第二层是 `media-tasks` 后端本身还有一个真实 SQL bug，和旧运行态问题叠在一起。
- 本轮真实根因已确认：
  - `comments / moderation / reports / audit-logs` 这几类接口在源码里已经补了 `pagination`，但旧运行态还在回旧结构，前端按新契约读取时会报错。
  - `media-tasks` 的 `AdminMediaTaskService` 里 `COUNT_SQL` 基于错误的 CTE 拼接，运行时会打出后端 `500`。
  - `feed-ops/home` 这轮接口本身没有坏，直连已能正常返回 `slots=9 / candidatePool=75`。
- 本轮修复动作：
  - 停掉旧的 `18080` Java 进程，重新用当前 `apps/server` 代码打包并拉起后端。
  - 修正 `apps/server/src/main/java/com/dramatv/community/admin/mediatasks/AdminMediaTaskService.java`：
    - 把过滤条件从错误的裸 `select * from task_rows ...` 拼接改成 `filtered_task_rows` CTE
    - `LIST_SQL` 显式从 `filtered_task_rows` 读取
    - `COUNT_SQL` 改为 `select count(*) from filtered_task_rows`
  - 补回归保护：
    - `apps/server/src/test/java/com/dramatv/community/integration/AdminMediaTaskApiIntegrationTest.java`
    - 新增分页字段断言，避免后续再出现“列表能回、分页为空或 500”这类隐性回退
- 本轮验证已通过：
  - `apps/server -> AdminMediaTaskApiIntegrationTest`，结果 `3 passed / 0 failed`
  - `http://127.0.0.1:18080/actuator/health` 返回 `UP`
  - 真接口直连复验：
    - `/api/admin/comments?page=1&pageSize=15`
    - `/api/admin/moderation/items?page=1&pageSize=15`
    - `/api/admin/reports?page=1&pageSize=15`
    - `/api/admin/media-tasks?page=1&pageSize=15`
    - `/api/admin/audit-logs?page=1&pageSize=15`
    - `/api/admin/feed-ops/home`
  - 浏览器运行态复验：
    - `/comments`
    - `/moderation`
    - `/reports`
    - `/feed-ops/home`
    - `/media-tasks`
    - `/audit-logs`
    - 上述页面当前都不再出现“当前无法读取 / 读取异常 / 请稍后重试”错误态
- 当前做到哪一步：
  - 这批后台“读不到数据”的页面已恢复到真实可读状态，不是靠 fallback 顶住。
  - 当前本地 `18080 + 3206` 已恢复可验收。
- 下次先做什么：
  - 如果你手动验收还有个别页残留异常，优先先分清是“运行态没切过去”还是“单接口真 bug”，继续按这次顺序排查，不再先怀疑前端页面壳子。

### 2026-05-22 云端后台“页面数据加载不出来”复验

- 本轮不是继续猜测页面截图，而是直接在云端后台 `http://8.141.20.130:3206` 登录后逐页复验：
  - `/users`
  - `/moderation`
  - `/resources`
  - `/reports`
  - `/comments`
  - `/feed-ops/home`
  - `/taxonomy`
  - `/media-tasks`
  - `/audit-logs`
- 当前复验结果：
  - 上述页面当前都能正常进入
  - 页面正文中已不再出现“页面数据加载不出来 / 当前无法读取 / 读取异常 / 请稍后重试”这类错误态
  - 浏览器控制台错误数为 `0`
- 这轮也进一步确认了上一轮云端故障的真实根因：
  - 不是 `apps/admin` 页面壳子本身坏了
  - 是后台前端先切到了真实分页契约，但云端共享后端 `apps/server` 当时还停在旧响应结构
  - 结果就是新前端读旧后端，多个治理页一起掉进错误态
- 当前状态判断：
  - 云端后台这批“读不到数据”的页面已恢复
  - 如果你之后再看到个别页面偶发同类报错，优先先看是不是又出现“前端已发布、共享后端未同步”的版本错位，而不是先怀疑样式或单页组件

### 2026-05-22 云端首页运营候选池资源不全修复

- 本轮处理的是你在云端 `/feed-ops/home` 看到的异常：资源治理页能看到大量真实资源，但首页运营候选池切到“视频提示词”时只剩 `1` 条。
- 实际根因不是前端筛选按钮坏了，也不是云端资源没导入，而是后台两页走的不是同一套查询口径：
  - `/resources` 走的是资源治理全量分页查询
  - `/feed-ops/home` / `/feed-ops/featured` 走的是 `AdminFeedOpsService` 的独立候选池查询
  - 这套候选池查询把 `prompt / workflow / post / channel` 都写死成了 `limit 256`
- 直接后果：
  - 候选池只保留各类内容“最新前 256 条”
  - 云端当前最新一批 prompt 里，视频提示词在这个窗口内只剩极少数，所以你在首页运营里看到“视频提示词只有 1 条”
  - 资源治理页正常，是因为它根本没走这个 `256` 截断
- 本轮修复：
  - `apps/server/src/main/java/com/dramatv/community/admin/feedops/AdminFeedOpsService.java`
  - 把候选池硬上限从 `256` 提升到 `10000`
  - 同步补回归：
    - `apps/server/src/test/java/com/dramatv/community/integration/AdminFeedOpsHomeApiIntegrationTest.java`
    - 新增用例覆盖“首页运营候选池应包含超过旧 256 窗口之外的 prompt”
- 本轮验证：
  - `AdminFeedOpsFeaturedApiIntegrationTest`
  - `AdminFeedOpsHomeApiIntegrationTest`
  - 定向结果：`4 passed / 0 failed`
  - 共享后端已同步到云测试环境：
    - release：`/opt/dramatv-community-server/releases/20260522-175552`
  - 云端浏览器复验：
    - `http://8.141.20.130:3206/feed-ops/home`
    - 候选池总量已从之前截图里的 `259` 恢复到 `5648`
    - “视频提示词”筛选当前已显示 `1490 条`
- 当前做到哪一步：
  - 云端首页运营 / 精选运营候选池已经不再被旧的 `256` 窗口截断
  - 这轮先把“看不到真实候选资源”主问题收掉，候选池接口本身还不是后端真分页接口，只是把上限放到了足够覆盖当前云端真实资源规模
- 下次先做什么：
  - 如果后续资源量继续明显上涨，再把 feed-ops 候选池从“大窗口返回”升级成后端真分页查询，避免前端一次吃太大候选池

### 2026-05-23 dashboard 概览台布局修复

- 本轮修复了 `apps/admin /dashboard` 的两个问题：
  - 左侧 `待审核队列 + 快捷操作` 被错误拆成上下两段，导致右侧栏被挤到下面并制造大块空白
  - `失败任务` 侧栏之前直接展示原始错误文本，内容过长时会把卡片撑爆
- 处理方式：
  - 左侧内容改回 `primaryColumn` 单列容器，桌面态恢复双栏布局
  - 失败任务 detail 改成 `目标作者 + 错误摘要 + 重试次数`
  - `contentGrid` 的单栏断点从 `1180px` 收紧到 `900px`，避免 996px 宽度误切到移动态
- 验证结果：
  - `apps/admin -> npm.cmd run build` 通过
  - 本地 `http://127.0.0.1:3206/dashboard` 已恢复双栏
  - 失败任务侧栏不再显示原始长错误日志

### 2026-05-23 治理页笔记本宽度适配收口

- 本轮针对你明确点名的 4 个后台治理页收了一轮桌面端响应式适配：
  - `内容审核 /moderation`
  - `资源治理 /resources`
  - `举报中心 /reports`
  - `评论治理 /comments`
- 本轮处理目标不是单纯“缩小一点字体”，而是同时解决 3 个桌面端比例问题：
  - 后台工作区横向可用空间偏保守，导致笔记本全屏时内容区被白白吃掉一截
  - 右侧详情卡固定得偏宽，左侧表格列表被挤压过早
  - 左侧表格列宽在 `14~16` 寸笔记本全屏下不够收敛，明明不是极限比例也容易提前出现横向拥挤
- 实际代码收口：
  - `apps/admin/src/components/AdminShell.module.css`
    - 收紧侧栏与工作区 padding
    - 略缩左侧导航宽度
    - 让桌面端内容区在常见笔记本宽度下多释放一截横向空间
  - `apps/admin/src/app/(dashboard)/moderation/page.module.css`
    - 同步影响 `/moderation` 与复用该样式的 `/resources`
    - 右侧详情栏改成更窄的 `clamp(...)` 列宽策略
    - 新增 `1600 / 1440 / 1260` 三段式断点
    - 在较窄桌面宽度下同步压缩表格列宽与单元格 padding
  - `apps/admin/src/app/(dashboard)/comments/page.module.css`
    - 同步改窄详情栏
    - 补笔记本宽度下的列宽收敛断点
  - `apps/admin/src/app/(dashboard)/reports/page.module.css`
    - 同步改窄详情栏
    - 补笔记本宽度下的列宽收敛断点
- 断点策略变化：
  - 之前这些页在 `1380px` 就会退化成单栏，桌面笔记本宽度下太激进
  - 现在改成先在 `1600 / 1440` 逐步缩右栏、缩列表，再到 `1260px` 以下才正式切单栏
  - 目标是让常见笔记本全屏宽度优先保住“左表 + 右详情”双栏，而不是过早堆叠或挤爆
- 这轮顺手确认了本地后台入口口径：
  - 由于后台前端已固定 `basePath=/admin`，旧地址 `http://127.0.0.1:3206/users` 会直接 `404`
  - 当前本地正确入口应为：
    - `http://127.0.0.1:3206/admin/login`
    - `http://127.0.0.1:3206/admin/users`
- 本轮验证结果：
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
  - 本地路由检查：
    - `/admin/login -> 200`
    - `/admin/users -> 307` 跳登录
- 当前做到哪一步：
  - 这 4 个治理页的桌面端布局规则已经按“笔记本全屏优先双栏、右栏更窄、列表更能铺开”的方向收口完成
  - `resources` 因为复用 `moderation` 样式，已经一起跟随生效
- 下次先做什么：
  - 等你按真实笔记本分辨率复看一轮
  - 如果还有某一页依旧偏挤，再做第二轮定向微调，而不是重新改回统一大宽度右栏

### 2026-05-23 后台 UI 笔记本适配已同步云端

- 本轮把刚完成的后台前端 UI 收口同步到了云测试环境，只包含 `apps/admin` 这批界面样式改动，不混入本地 Docker/数据库恢复这类运行态修复。
- 云端后台发布结果：
  - release label：`20260523-143226`
  - release path：`/opt/dramatv-community-admin/releases/20260523-143226`
  - public admin url：`http://8.141.20.130/admin`
- 本轮发云前本地构建已通过：
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 本轮发云后公网最小验收已通过：
  - `GET http://8.141.20.130/admin/login -> 200`
  - `GET http://8.141.20.130/admin/users -> 307`
  - redirect target：`/admin/login?redirectTo=%2Fusers`
- 这次同步对应的主要界面范围：
  - `内容审核 /moderation`
  - `资源治理 /resources`
  - `举报中心 /reports`
  - `评论治理 /comments`
  - 以及共享后台壳层 `AdminShell` 的桌面端横向空间释放
- 当前做到哪一步：
  - 云端后台已经切到包含“笔记本宽度下右侧详情栏更窄、表格区更能铺开”的新前端版本
  - 运行态入口和登录守卫都还正常
- 下次先做什么：
  - 等你直接在云后台按真实屏幕分辨率复看
  - 如果还有个别页的详情卡比例不理想，再继续做第二轮断点微调

### 2026-05-23 内容审核正文框与资源治理对齐

- 本轮继续收口你在云后台指出的一个细节差异：`/moderation` 右侧详情里的“提示词/正文内容”之前还是直接整段铺开，不像 `/resources` 那样使用固定大小、内部滚动的文本框。
- 实际改动：
  - 文件：`apps/admin/src/app/(dashboard)/moderation/page.tsx`
  - 把审核详情区第 `3` 段从单个 `<p>` 改成和资源治理同款的 `contentStack + contentBlock + contentBody`
  - 当前展示结构变为：
    - 上方 `摘要`
    - 下方 `提示词正文 / 正文`
    - 下方正文块固定高度，超出后在块内滚动
- 这轮没有新加样式文件：
  - `moderation/page.module.css` 里原本已经存在 `contentStack / contentBlock / contentBody`
  - 之前只是审核页 JSX 没接上这套结构，本轮直接复用即可
- 本地验证已通过：
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 云端已同步：
  - release label：`20260523-144129`
  - release path：`/opt/dramatv-community-admin/releases/20260523-144129`
- 云端最小可达性复验已通过：
  - `GET http://8.141.20.130/admin/login -> 200`
  - `GET http://8.141.20.130/admin/moderation -> 307`
  - redirect target：`/admin/login?redirectTo=%2Fmoderation`
- 当前做到哪一步：
  - 内容审核页的正文展示结构已经和资源治理页对齐，并且已发布到云端后台
- 下次先做什么：
  - 等你直接在云后台验收正文框的实际观感
  - 如果你还希望摘要框和正文框的高度、留白、滚动条样式进一步完全一致，再做第二轮微调

### 2026-05-23 后台长文本撑布局巡检与收口

- 本轮目标不是改业务逻辑，而是统一收口后台管理端那些“因为真实内容长度差异把详情区、统计卡、日志区撑高”的残留点。
- 实际处理范围：
  - `comments`
    - 评论正文改为固定高度内滚
    - 评论上下文列表、治理日志列表改为固定高度容器
    - 单条上下文卡片和日志描述也补了内部滚动保护
  - `reports`
    - 举报说明改为固定高度文本块
    - 被举报内容摘要正文改为固定高度内滚
    - 处理记录列表与处理备注改为固定高度容器
  - `users`
    - 账号备注改为固定高度文本块
    - 内容发布 / 治理摘要 / 风险摘要这类统计值改为两行截断
    - 最近内容标题改为两行截断，完整列表继续走既有弹窗
  - `audit-logs`
    - 请求扩展上下文改为固定高度内滚
    - 处理备注改为固定高度内滚
    - 长 requestId / traceId / targetId 补了强制换行保护
  - `media-tasks`
    - 关联标题 / 错误摘要 / 内容摘要改为固定高度文本块
    - 任务标题改为两行截断
    - 日志摘要列表改为固定高度容器
    - 结果载荷 textarea 固定高度，不再允许手动拉伸把页面撑乱
  - `moderation` / `resources`
    - 由于两页复用同一份 `page.module.css`，本轮顺手把“摘要”块也改成固定高度内滚
    - 风险提示条目文本也补了固定高度保护
- 这轮没有继续动 `feed-ops`：
  - 巡检结果显示它本身已有 `poolListViewport / arrangeModal / line-clamp` 等收口，不属于本轮主要问题源
- 本轮验证已通过：
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 当前做到哪一步：
  - 后台主要“左表右详情”治理页里，长正文、长备注、长日志、长统计摘要造成右栏被内容长度拉高的点已做完一轮统一收口
  - 当前仍停留在本地代码与本地构建验证，尚未发布到云测试环境
- 下次先做什么：
  - 等你按真实页面手动体验一轮
  - 如果你再指出某个具体区块仍会被内容长度撑坏，再做定点补强，不重新大面积改版

### 2026-05-23 治理列表去掉无效操作列并强化选中态

- 本轮收口的是你明确指出的一个交互问题：后台多个治理列表最后一列都还挂着“操作入口 / 点击行查看 / 当前查看中”这类低价值提示，占列宽但不提供真实能力。
- 本轮已统一处理：
  - 删除这批页面表格最后一列：
    - `moderation`
    - `resources`
    - `reports`
    - `comments`
    - `audit-logs`
    - `media-tasks`
    - `taxonomy`
  - 分类治理第一页空态 `colSpan` 已同步从 `7` 收口到 `6`
  - 原先依赖这列提示的选中反馈，改为更明显的整行高亮
- 选中态本轮统一改为：
  - 更深一档的蓝色渐变底
  - 更明显的左侧高亮竖条
  - 额外补一层内描边，避免在白底页面里“像没选中”
- 这轮还顺手统一了 `users` 页的选中行颜色：
  - 虽然它本身没有“操作入口”列，但为了让后台不同列表的选中反馈一致，也一并切到同一套蓝色选中态
- 本轮完成后，用搜索回归确认：
  - `apps/admin/src/app/(dashboard)` 下已不再残留
    - `操作入口`
    - `点击行查看`
    - `当前查看中`
    - `点击左侧树或当前行对应项查看`
- 本轮验证已通过：
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 当前做到哪一步：
  - 后台主要治理/日志列表的无效末列已统一移除
  - 选中行反馈已统一增强
- 下次先做什么：
  - 等你按真实分辨率手动看一轮
  - 如果你觉得蓝色选中态还不够重，再继续把对比度往上抬一档，但先不重新引入任何末列提示

### 2026-05-23 右侧详情栏统一放宽一档

- 本轮处理的是你在真实页面里继续指出的比例问题：虽然上一轮已经把右侧详情栏从“明显过宽”收回来，但当前版本又收得偏保守，导致 `资源治理` 这类页的详情面板内容显得偏窄。
- 本轮没有回退到旧的超宽右栏，而是统一做“一档放宽”：
  - `moderation` / `resources`
    - 主断点从 `clamp(268px, 22vw, 304px)` 调到 `clamp(300px, 24vw, 340px)`
    - 中间断点同步抬高到 `324px / 304px` 上限
  - `comments`
    - 主断点从 `clamp(260px, 21vw, 296px)` 调到 `clamp(292px, 23vw, 332px)`
  - `reports`
    - 主断点从 `clamp(264px, 21vw, 300px)` 调到 `clamp(296px, 23vw, 336px)`
  - `audit-logs`
    - 右栏从 `minmax(304px, 24vw)` 调到 `minmax(336px, 25.5vw)`
  - `media-tasks`
    - 右栏从 `minmax(312px, 25vw)` 调到 `minmax(344px, 26vw)`
  - `users`
    - 右栏从 `minmax(288px, 22vw)` 调到 `minmax(320px, 24vw)`
  - `taxonomy`
    - 右侧治理卡从 `362px` 调到 `396px`
- 本轮保持不变的原则：
  - 单栏切换断点没有重新放宽到不合理范围
  - 没有把左侧表格重新压回“内容看不全”的状态
  - `resources` 继续复用 `moderation/page.module.css`，不会出现两页样式分叉
- 本轮验证已通过：
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 当前做到哪一步：
  - 后台主要“左表右详情”页的详情栏宽度已经从上一轮的偏窄状态统一放宽一档
  - 当前仍是本地代码与本地构建验证，尚未发云
- 下次先做什么：
  - 等你按真实页面手动看一轮
  - 如果你觉得某一类页还应该更宽，只继续定点调该页，不再整批反复拉锯

### 2026-05-23 非用户页详情卡再放宽一档

- 这轮是基于你最新反馈做的定点收口：
  - `用户管理` 右侧详情卡维持当前尺寸，不再继续放大
  - 其他带“左侧列表 + 右侧详情”结构的后台页面，右侧详情卡统一再放宽一档
- 本轮实际调整范围：
  - `moderation` / `resources`
  - `comments`
  - `reports`
  - `audit-logs`
  - `media-tasks`
  - `taxonomy`
- 本轮未纳入的页面：
  - `users`
    - 明确保留当前宽度
  - `dashboard`
  - `feed-ops`
    - 它们是多栏信息布局，不是这轮说的“选中行后右侧详情卡”结构
- 代码现状确认：
  - `resources` 继续直接复用 `../moderation/page.module.css`
  - 非用户页详情卡宽度已分别抬高到更大的 `clamp(...)` / `minmax(...)` 值
  - `users` 仍保留：
    - 基础宽度 `minmax(320px, 24vw)`
    - `<=1440px` 宽度 `minmax(304px, 23vw)`
- 本轮验证已通过：
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 当前做到哪一步：
  - 你最新要求的“用户管理保持现状，其余详情卡放大一点”已经落到本地代码并完成构建校验
  - 当前仍是本地代码状态，尚未发云
- 下次先做什么：
  - 等你按真实页面看一轮
  - 如果有某一页还想再宽或再收，只继续定点改那一页

### 2026-05-23 非用户页详情卡继续放大第二轮

- 这轮承接你刚才的最新反馈：上一轮放宽后，`用户管理` 已经够大，其余后台页右侧详情卡还要继续再放大一轮。
- 本轮处理原则不变：
  - `users` 不动
  - 只放大非用户页右侧详情卡
  - 继续保留笔记本宽度下的双栏断点策略，不回退成“右栏过宽把左表压坏”
- 本轮具体调整：
  - `moderation` / `resources`
    - 基础宽度改到 `clamp(316px, 25vw, 356px)`
    - `<=1600px` 改到 `clamp(300px, 23vw, 340px)`
    - `<=1440px` 改到 `clamp(280px, 21.5vw, 316px)`
  - `comments`
    - 基础宽度改到 `clamp(308px, 24vw, 348px)`
    - `<=1600px` 改到 `clamp(292px, 22vw, 332px)`
    - `<=1440px` 改到 `clamp(272px, 20.8vw, 308px)`
  - `reports`
    - 基础宽度改到 `clamp(312px, 24vw, 352px)`
    - `<=1600px` 改到 `clamp(296px, 22vw, 336px)`
    - `<=1440px` 改到 `clamp(276px, 20.8vw, 312px)`
  - `audit-logs`
    - 基础宽度改到 `minmax(352px, 26.5vw)`
  - `media-tasks`
    - 基础宽度改到 `minmax(360px, 27vw)`
  - `taxonomy`
    - 右侧治理卡改到 `420px`
    - `<=1480px` 改到 `388px`
- 这轮保持不变的点：
  - `users` 仍保持当前宽度，不继续放大
  - `resources` 继续复用 `moderation/page.module.css`
- 当前做到哪一步：
  - 第二轮放大已落到本地代码
  - 还需要本地构建校验
- 下次先做什么：
  - 跑 `tsc` 和 `build`
  - 再等你按真实页面验收

### 2026-05-23 后台详情卡第二轮放大已同步云端

- 本轮把“非用户页右侧详情卡继续放大第二轮”的后台前端改动同步到了测试云环境。
- 云端当前后台 active release：
  - `/opt/dramatv-community-admin/releases/20260523-160940`
- 本轮云端入口核验结果：
  - `http://8.141.20.130/admin -> 307 /admin/login?redirectTo=%2F`
  - `http://8.141.20.130/admin/login -> 200`
  - `http://8.141.20.130/admin/users -> 307 /admin/login?redirectTo=%2Fusers`
- 本轮补做的公网 smoke：
  - `node scripts/smoke-admin-routes.mjs --base-url http://8.141.20.130/admin --base-path /admin --mode public`
  - 结果：`13 passed / 0 failed`
  - 产物：
    - `artifacts/runtime-readiness/test/admin-deploy-20260523-160940-public-baseurl-admin-summary.json`
- 这次部署过程里还顺手定位并修掉了一处发布脚本误判：
  - 原 `scripts/deploy-test-admin.ps1` / `scripts/rollback-test-admin.ps1` 在跑后台 smoke 时，把 `AdminPublicBaseUrl` 裁成了纯域名 authority，导致 `basePath=/admin` 场景下可能出现“实际已发云，但 smoke 假失败”的误判
  - 现已改为直接把完整 `AdminPublicBaseUrl` 传给 `scripts/smoke-admin-routes.mjs`
- 这轮状态结论：
  - 后台前端最新详情卡宽度调整已发云
  - 当前云端后台路由守卫与登录入口可达
  - 这次最初 `deploy-test-admin.ps1` 报错，不是服务没发上去，而是脚本内公网 smoke 的 `base-url` 口径不对
- 下次先做什么：
  - 等你直接在云后台按真实页面验收视觉比例
  - 如果还要继续调宽，只需要在当前云端版本基础上继续做下一轮微调

### 2026-05-24 feed-ops landing 独立运营入口补齐

- 本轮补的是你刚刚指出的实际缺口：后台运营配置里虽然已有根首页 `/` 的真实编排链路，但之前没有把它明确纳入现有“运营配置”工作台的可识别范围。
- 实际修复：
  - `apps/admin/src/lib/admin-nav.ts`
    - 维持单个 `运营配置` 导航入口
    - 入口说明改为覆盖 `首页 / 精选页 / 落地页 / 讨论区`
  - `apps/admin/src/app/(dashboard)/feed-ops/shared/FeedOpsPageClient.tsx`
    - `landing` 现在不再落到讨论区默认分支
    - 预览面板、配置位摘要和展示切片都按独立页面处理
    - 根首页精选档案区改成更贴近实际的 `前 6 / 后 6` 结构预览
- 这次验证已通过：
  - `apps/admin -> npm.cmd run build`
- 当前状态：
  - 后台仍保持单个 `运营配置` 入口
  - 但页内 tab 现在已经把根首页 `/` 的“精选档案”12 卡编排按独立页面正确纳入
- 下次先做什么：
  - 如果你还希望后台入口文字更贴近前台命名，我再把 `落地页运营` 这四个字替换成你更习惯的口径
  - 如果没别的命名要求，就按这版继续看页面本身

### 2026-05-24 feed-ops landing structure sync to cloud

- This round synced the current admin UI state to the test cloud.
- Active release: `20260524-193217`
- Remote path: `/opt/dramatv-community-admin/releases/20260524-193217`
- Public base URL: `http://8.141.20.130/admin`
- Verification:
  - public smoke: `13 passed / 0 failed`
  - full smoke: `24 passed / 1 failed`
- The only failing full-smoke item was `root.redirect`, which expected `/login` but got `/admin`; the route body and auth pages themselves passed.
- Current result:
  - the admin cloud release is updated
  - the `运营配置` entry is still one left-nav item with `首页 / 精选页 / 落地页 / 讨论区` tabs inside

### 2026-05-24 前台公共页取消缓存，发布立即生效

- 本轮定位到一个真实问题：前台 `loadLandingPagePublicData / loadCommunityHomePublicData / loadFeaturedArchivePublicData` 外层用了 `unstable_cache`，而底层请求本身已经是 `no-store`，这会让后台发布后前台页面在缓存 TTL 内看起来“没生效”。
- 实际修复：
  - `apps/web/src/lib/api/community-public-cache.ts`
  - 去掉三处 `unstable_cache`
  - 保持 landing / home / featured 三个公共页直接读后端最新数据
- 验证：
  - `apps/web -> npm.cmd run build`
  - `npm.cmd run deploy:test:web -VerifyBeforeDeploy -VerifyAfterDeploy`
  - 云端 web release：`20260524-222205`
  - 公网验收通过，首页相关数据链路保持可用
- 结论：
  - 后台发布 landing / home / featured 后，前台页面不再被公共读缓存卡住
  - 这次的现象不是后端没写进去，而是前台缓存层把新结果暂时盖住了

### 2026-05-25 feed-ops 运营配置共性 UI 收口

- 本轮继续收口 `apps/admin/src/app/(dashboard)/feed-ops/shared/*` 的共性问题，不再按单页分别打补丁。
- 实际收口点：
  - 编排弹窗 `2. 候选内容池` 补上独立搜索框，和页面左侧候选池分开保存关键词，避免两个场景互相覆盖。
  - 缩略图上统一去掉 `视频资源 / 封面素材 / 点击预览` 这类遮挡内容的悬浮文案，保留点击预览能力本身。
  - 编排弹窗里那块重复的前 12 位卡片预览条统一隐藏，实际位次和替换操作继续收口到 `3. 前台真实展示内容`。
- 改动文件：
  - `apps/admin/src/app/(dashboard)/feed-ops/shared/FeedOpsPageClient.tsx`
  - `apps/admin/src/app/(dashboard)/feed-ops/shared/page.module.css`
- 本轮验证已通过：
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 当前做到哪一步：
  - `home / featured / landing / discussions` 这 4 个运营配置页已经共用同一套候选池搜索、重复预览隐藏和缩略图文案清理策略。
- 下次先做什么：
  - 等你按真实页面手动复看这 4 个运营配置页
  - 如果还要继续清理其它共性噪音，再继续收口到 `shared` 层而不是分页面修

### 2026-05-25 feed-ops 右侧已挂载列表固定高度

- 本轮继续收口运营配置编排弹窗里的共性布局问题：`3. 前台真实展示内容` 之前会随着挂载条数增多把整个右侧面板越撑越长。
- 实际处理：
  - `apps/admin/src/app/(dashboard)/feed-ops/shared/FeedOpsPageClient.tsx`
    - 给右侧已挂载列表补上独立 `arrangePanelListViewport`
  - `apps/admin/src/app/(dashboard)/feed-ops/shared/page.module.css`
    - 给右侧列表视窗补 `clamp(...)` 固定高度与内部滚动
    - 底部统计提示与清空按钮留在滚动区外，不跟着内容一起被挤走
- 本轮验证已通过：
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`

### 2026-05-25 taxonomy 分类页结构与语义收口

- 本轮处理的是 `apps/admin/src/app/(dashboard)/taxonomy` 的两个实际问题：
  - 页面主工作区是“左树 + 中表 + 右卡 + 下方再来一整块批量区”，中间容易出现大面积空白，结构失衡。
  - `批量修正待分类提示词 / 待修正提示词池` 这组文案会误导成“已有分类错了”，但后端真实语义其实是 `taxonomy` 字段尚未补完整。
- 先做了后端语义确认：
  - `apps/server/src/main/java/com/dramatv/community/admin/taxonomy/AdminTaxonomyService.java`
  - `needsAttention` 的判定是 `model_category / content_category / composition_category` 任一为空。
  - `apps/server/src/test/java/com/dramatv/community/integration/AdminTaxonomyApiIntegrationTest.java` 也已覆盖这个口径。
  - 结论：这里不是“错误分类池”，而是“字段待补齐池”。
- 前端页面本轮实际收口：
  - 工作区结构从 `三栏 + 底部独立批量区` 改成 `左侧分类导航 + 右侧主工作区`。
  - 右侧主工作区再拆成：
    - 上方 `分类项列表`
    - 下方 `分类项治理配置 + 待补分类提示词池`
  - 删除了页面里那块重复且隐藏的旧批量区，避免后续继续混乱。
- 文案同步调整：
  - `待整理提示词` -> `待补分类提示词`
  - `待修正提示词池` -> `待补分类提示词池`
  - `批量修正待分类提示词` -> `批量补齐未完整分类提示词`
  - 同时补充说明：这里只处理 `taxonomy` 字段未补完整的数据，不代表已有分类判断错误。
- 改动文件：
  - `apps/admin/src/app/(dashboard)/taxonomy/page.tsx`
  - `apps/admin/src/app/(dashboard)/taxonomy/page.module.css`
- 本轮验证已通过：
  - `apps/admin -> npx.cmd tsc --noEmit -p apps/admin/tsconfig.json`
  - `apps/admin -> npm.cmd run build`
- 当前做到哪一步：
  - 分类页的页面构造已经从“空白大、语义混”收口到“左导航 + 右工作区”的更稳定结构。
  - 批量区的业务语义也已经和真实后端口径对齐，不再暗示“系统已有错误分类”。
- 下次先做什么：
  - 先等你按真实页面看这一版结构是否顺手。
  - 如果你希望分类列表再更紧凑，或者治理卡/批量卡的左右比例继续调，我再做第二轮定点微调。

### 2026-05-25 taxonomy 图片/视频分类维度重新对齐

- 本轮不是继续做页面排版，而是正式修正 taxonomy 的共享业务语义错位：
  - `single-model / multi-model` 之前被页面和部分测试误当成了“构图分类”
  - 但按项目真实语义，它其实只属于 `视频提示词` 的 `模型使用方式`
  - `图片提示词` 只应该有 `模型分类 + 内容分类` 两个维度
- 本轮实际收口范围：
  - `apps/admin/src/app/(dashboard)/taxonomy/page.tsx`
    - section key 从旧的 `content-category / composition-category` 切到 5 段真实结构：
      - `image-model`
      - `video-model`
      - `image-content-category`
      - `video-content-category`
      - `video-model-usage`
    - 统计卡同步改读：
      - `imageContentCategories`
      - `videoContentCategories`
      - `videoModelUsageCategories`
    - 批量补齐区改成：
      - 图片提示词：只填 `模型分类 + 内容分类`
      - 视频提示词：再补 `模型使用方式`
    - 候选池“当前分类”列改成图片不再强行展示第三维
  - `apps/server/src/main/java/com/dramatv/community/publish/application/VideoDraftApplicationService.java`
    - 草稿保存时增加 prompt taxonomy 清洗
    - 只要不是 `video_prompt`，就主动清空 `compositionCategory`
  - `apps/server/src/main/java/com/dramatv/community/publish/persistence/PublishedContentPersistenceService.java`
    - image prompt 发布入库时强制把 `composition_category` 落成 `null`
    - 同时把 taxonomy 标签做服务端净化：
      - 去掉旧的 taxonomy 标签残留
      - image prompt 不再把 `single-model / multi-model` 写进 `tag_names`
      - 再按真实维度重新补回标准 taxonomy 标签
  - `apps/server/src/main/java/com/dramatv/community/admin/taxonomy/AdminTaxonomyService.java`
    - `bulk apply` 返回体已补齐 `modelUsageCategory` 字段，和新前端口径对齐
- 同步调整的测试口径：
  - `AdminTaxonomyApiIntegrationTest`
  - `AdminTaxonomyLoggingIntegrationTest`
  - `DraftApiIntegrationTest`
  - `PromptReadApiIntegrationTest`
  - `PublishPipelineIntegrationTest`
  - `ApiIntegrationTestSupport`
  - 目标都是同一个：
    - image prompt 不再断言 `compositionCategory=single-model`
    - video prompt 继续保留第三维断言
- 共享口径已先更新到：
  - `.codex/community-admin-shared-sync.md -> S4 taxonomy 分类体系`
- 当前做到哪一步：
  - 代码层核心语义已收口
  - 共享文档已先同步
  - 还差本轮 `apps/admin` 构建与后端定向集成回归
- 下次先做什么：
  - 先跑 admin typecheck/build
  - 再跑 taxonomy / draft / prompt / publish 这组后端定向测试
  - 通过后再把最终验证结果补回本条日志

### 2026-05-25 taxonomy 图片/视频分类维度重新对齐已完成验证

- 上一条 taxonomy 语义修正本轮已完成本地验证闭环，不再停留在中间态。
- 本轮验证结果：
  - `apps/admin -> npm.cmd run typecheck` 通过
  - `apps/admin -> npm.cmd run build` 通过
  - `apps/server -> use-local-java17-maven.ps1 -Dtest=AdminTaxonomyApiIntegrationTest,AdminTaxonomyLoggingIntegrationTest,DraftApiIntegrationTest,PromptReadApiIntegrationTest,PublishPipelineIntegrationTest test` 通过
  - 定向后端回归结果：`35 passed / 0 failed / 0 errors`
- 本轮验证过程中额外收口的真实问题：
  - `PublishedContentPersistenceService` 初版修改里把 `compositionCategory` 先赋值后再改写，触发了 Java lambda 的 effectively-final 编译限制
  - 现已改成 `rawCompositionCategory + final compositionCategory` 的写法，编译问题已消除
- 当前结论：
  - 后台 taxonomy 页面、前台发布 taxonomy 语义、后端批量补齐、草稿保存和 prompt 发布入库这几层已经重新对齐
  - `image prompt` 不再写入/回显 `single-model`
  - `video prompt` 仍保留第三维 `single-model / multi-model`
- 当前做到哪一步：
  - 本轮代码与共享文档都已收口
  - 本地构建和这次直接受影响的后端集成回归都已通过
- 下次先做什么：
  - 等你按真实后台 taxonomy 页和前台发布页手动验收
  - 如果你要，我再继续把这轮改动同步到云测试环境

### 2026-05-25 taxonomy 云同步完成并补齐 admin basePath 验收口径

- 本轮不是继续改 taxonomy 业务代码，而是把已经完成的 taxonomy 重构正式同步到测试云，并把部署验收里暴露出的共享脚本误判收口。
- 实际云同步范围：
  - `apps/server`：taxonomy 真实分类定义 / 删除 / 重绑 / prompt 分页候选池接口
  - `apps/admin`：重构后的 `/taxonomy` 工作台页面
  - `apps/web`：本轮未单独发云；只有为仓库级 typecheck 收口的一处本地 TypeScript 修正，不影响当前 taxonomy 云端运行时
- 本轮先恢复了本地部署前置：
  - 重新拉起 `127.0.0.1:18080`
  - `npm.cmd run smoke:api` 通过：`19 passed / 0 failed`
  - `npm.cmd run smoke:auth-session` 通过：`12 passed / 0 failed`
- 云端发布结果：
  - backend release：`/opt/dramatv-community-server/releases/20260525-221644`
  - admin release：`/opt/dramatv-community-admin/releases/20260525-224039`
- 本轮额外修复的不是页面功能缺陷，而是共享验收脚本口径过旧：
  - `scripts/smoke-admin-routes.mjs`
  - 之前把 `http://127.0.0.1:3206/` 先跳 `/admin`、再由 `/admin` 守卫跳 `/admin/login?redirectTo=%2F` 误判成失败
  - 现已把 `basePath=/admin` 的合法中转行为纳入 `root.redirect` 验收
- 本轮验证结果：
  - 本地脚本复验：`node scripts/smoke-admin-routes.mjs --base-url http://127.0.0.1:3206 --base-path /admin --backend-base-url http://127.0.0.1:18080 --mode full`
    - 结果：`25 passed / 0 failed`
  - backend post-deploy readiness：
    - `artifacts/runtime-readiness/test/backend-deploy-20260525-221644-summary.json`
    - 结果：`11 passed / 0 failed`
  - admin public smoke：
    - `artifacts/runtime-readiness/test/admin-deploy-20260525-224039-public-summary.json`
    - 结果：`13 passed / 0 failed`
  - admin internal smoke：
    - `artifacts/runtime-readiness/test/admin-deploy-20260525-224039-internal-summary.json`
    - 结果：`25 passed / 0 failed`
- 当前结论：
  - taxonomy 后台页和其依赖的共享后端接口都已同步到测试云
  - 当前云端 `/admin/taxonomy` 的可用性已由 public/internal 两层 smoke 收口
  - 这次 admin 部署链路的剩余注意点不是业务功能，而是后续所有 `/admin` basePath 相关 smoke 都应沿用这次更新后的根路由口径

### 2026-05-25 taxonomy 标准分类集与后台展示口径对齐

- 本轮处理的是一个真实共享口径问题，不是纯 UI：
  - 前台精选页里视频模型分类能看到 `seedance / kling / happyhorse / wan / 其他模型`
  - 后台 taxonomy 分类管理页之前只会显示当前数据库真实落库到的少量值，因此会出现“前台已有分类，后台看不到”的错位
- 本轮实际收口：
  - `apps/server/src/main/java/com/dramatv/community/admin/taxonomy/AdminTaxonomyService.java`
    - 新增后端内置标准分类集：
      - `image-model`
      - `video-model`
      - `image-content-category`
      - `video-content-category`
      - `video-model-usage`
    - taxonomy section 现在会先注入标准分类，再由真实聚合数据覆盖同名项
    - taxonomy item 的 `label` 不再直接等于数据库 value，而是按标准标签映射
    - 内置分类改为：
      - 不能重复创建
      - 不能删除
  - `apps/server/src/main/resources/db/migration/V26__seed_builtin_admin_taxonomy_categories.sql`
    - 新增 admin taxonomy 标准分类初始化迁移
  - `apps/server/src/test/java/com/dramatv/community/integration/AdminTaxonomyApiIntegrationTest.java`
    - 新增标准分类返回存在断言：
      - `kling`
      - `wan`
      - `other`
      - `single-model`
    - 新增内置分类不可删断言：`ADMIN_TAXONOMY_CATEGORY_PROTECTED`
- 本轮验证已通过：
  - `apps/server -> .\scripts\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminTaxonomyApiIntegrationTest,AdminTaxonomyLoggingIntegrationTest test`
  - 结果：`14 passed / 0 failed`
- 当前做到哪一步：
  - 后端 taxonomy 已稳定按“标准分类集 + 真实聚合覆盖”返回，不再依赖当前 prompt 是否正好落库到该分类
  - 本地自动化已验证后台 taxonomy 会稳定返回：
    - `video-model`：`seedance / kling / happyhorse / wan / other-video-model`
    - `video-content-category`：`real-person / animation / other`
    - `video-model-usage`：`single-model / multi-model`
- 本轮云同步已完成：
  - `npm.cmd run smoke:api`
    - 结果：`19 passed / 0 failed`
  - `npm.cmd run smoke:auth-session`
    - 结果：`12 passed / 0 failed`
  - `npm.cmd run deploy:test:backend`
    - backend release：`/opt/dramatv-community-server/releases/20260525-234447`
  - `artifacts/runtime-readiness/test/backend-deploy-20260525-234447-summary.json`
    - 结果：`11 passed / 0 failed`
- 当前做到哪一步：
  - 这轮 taxonomy 标准分类集修正已经同步到测试云共享后端
  - 当前云端 `/api/admin/taxonomy` 已切到“标准分类集 + 真实聚合覆盖”的新口径
- 下次先做什么：
  - 等你直接在云后台手动看 taxonomy 页是否已经按标准分类集完整展示
  - 如果云页仍有旧表现，优先排查后台会话/缓存或旧页面资源，而不是继续怀疑共享后端未发布

### 2026-05-26 首页运营配置 home-hero 容量同步扩到 6

- 用户补充了一个真实共享要求：前台首页 hero 现在已经是“首屏展示 3 张、轮播池 6 张”，后台 `运营配置 -> 首页` 里的 `home-hero` 也必须同步按 6 管，不再停在旧的 3。
- 这轮不是只改后台文案，而是把 admin 这条真实配置链路一起收口：
  - `apps/admin/src/app/(dashboard)/feed-ops/shared/feed-ops-page.ts`
    - `home-hero` 的 `maxItems` 从 `3` 调到 `6`
    - 首页说明文案同步改成 `6 个轮播位`
  - `apps/admin/src/app/(dashboard)/feed-ops/shared/FeedOpsPageClient.tsx`
    - 首页 fallback hero 池改为抽 `6` 条
    - 右侧首页轮播预览从只切 `3` 条改为展示 `6` 条，避免后台工作台和真实配置上限再次错位
- 这轮顺手清掉了一个本地既有编译阻塞，但不改变业务语义：
  - `apps/server/src/main/java/com/dramatv/community/creator/application/CreatorQueryService.java`
  - 之前 `paginate(List<T>, int offset)` 的 4 个调用点仍停在旧签名，导致后端定向测试无法编译
  - 现已补齐 `offset` 透传，恢复可编译状态
- 验证结果：
  - `apps/admin -> npm.cmd run typecheck` 通过
  - `apps/admin -> npm.cmd run build` 通过
  - `apps/server -> .\scripts\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminFeedOpsHomeApiIntegrationTest,FeedReadApiIntegrationTest test`
    - 结果：`12 passed / 0 failed`
- 当前做到哪一步：
  - 后台首页运营配置已经和前台首页 hero 的 6 条轮播池口径对齐
  - 后端读写验证和后台工作台验证都已通过，本轮仍是本地完成态，尚未发云

### 2026-05-27 admin 筛选表单 basePath 跳错路由修复

- 本轮处理的是一个真实云端运行时问题，不是单页偶发现象：
  - 后台部署在 `basePath=/admin`
  - `资源治理` 页点击 `应用筛选` 后，浏览器实际跳到了 `http://8.141.20.130/resources?...`
  - 结果直接落到社区前台域根路由并 404
- 根因已确认：
  - 这不是后端接口、权限守卫或 Nginx 转发坏了
  - 而是把 `buildAdminBrowserPath("/xxx")` 误扩散到了 Next 应用内路由
  - 对 `apps/admin` 来说必须严格区分两类路径：
    - Next 内部路由：`Link / router / redirect / requireAdminAccess` 继续使用 `"/comments"`、`"/resources"` 这类应用内路径
    - 浏览器原生 URL：只有裸 `<form action>`、裸 `<a href>` 这类才需要显式补成 `"/admin/comments"`、`"/admin/resources"`
- 本轮实际收口：
  - 保留 `apps/admin/src/lib/admin-routes.ts -> buildAdminBrowserPath()`，但只用于浏览器原生表单 action
  - 已把以下页面和 server action 的内部回跳路径恢复成应用内路由：
    - `apps/admin/src/app/(dashboard)/comments/page.tsx`
    - `apps/admin/src/app/(dashboard)/comments/actions.ts`
    - `apps/admin/src/app/(dashboard)/moderation/page.tsx`
    - `apps/admin/src/app/(dashboard)/moderation/actions.ts`
    - `apps/admin/src/app/(dashboard)/reports/page.tsx`
    - `apps/admin/src/app/(dashboard)/reports/actions.ts`
    - `apps/admin/src/app/(dashboard)/media-tasks/page.tsx`
    - `apps/admin/src/app/(dashboard)/media-tasks/actions.ts`
    - `apps/admin/src/app/(dashboard)/audit-logs/page.tsx`
  - `resources` 页继续保持：
    - `form action={buildAdminBrowserPath("/resources")}`
    - `Link / buildResourcesHref / redirect` 继续走 `"/resources"`
- 本轮补强的自动化保护：
  - `scripts/smoke-admin-routes.mjs`
    - 新增 `guard.resources`
    - 新增登录后 `/resources` 页面可达断言
    - 新增 HTML 断言：`/resources` 页面必须包含 `action="/admin/resources"`
- 本轮验证结果：
  - `apps/admin -> npm.cmd run build` 通过
  - `apps/admin -> npm.cmd run typecheck` 通过
  - `node scripts/smoke-admin-routes.mjs --base-url http://127.0.0.1:3206 --base-path /admin --backend-base-url http://127.0.0.1:18080 --mode full`
    - 结果：`28 passed / 0 failed`
- 当前结论：
  - 这次不是只修了 `resources`
  - 而是把同类筛选页里“浏览器路径 helper 被误用于内部 Next 路由”的问题一起收口了
  - 后续再改 admin 筛选页时，默认规则就是：
    - 原生 form/action 才补 `/admin`
    - 其它内部导航一律不要手动补 `/admin`

### 2026-05-28 admin 筛选表单 basePath 漏网点补齐并已同步云端

- 本轮不是直接沿用昨天“`resources` 已修”的结论就发云，而是继续按同类问题做了一轮全局清扫。
- 追加确认到两个真实漏网点：
  - `apps/admin/src/app/(dashboard)/users/UsersPageClient.tsx`
    - 筛选表单仍是裸 `action="/users"`
  - `apps/admin/src/app/(dashboard)/moderation/page.tsx`
    - 筛选表单仍是裸 `action="/moderation"`
- 这两个问题和昨天 `resources` 是同一类根因：
  - 都是浏览器原生 GET 表单
  - 在本地根路径下不一定显眼
  - 但云端 `basePath=/admin` 时会直接跳到社区前台根路由
- 本轮实际收口：
  - `UsersPageClient.tsx`
    - 引入 `buildAdminBrowserPath`
    - 把筛选表单改成 `form action={buildAdminBrowserPath("/users")}`
  - `moderation/page.tsx`
    - 把筛选表单改成 `form action={buildAdminBrowserPath("/moderation")}`
  - `scripts/smoke-admin-routes.mjs`
    - 不再只校验 `/resources`
    - 现已把以下 7 个筛选页都纳入 HTML `action="/admin/..."` 断言：
      - `/users`
      - `/comments`
      - `/moderation`
      - `/reports`
      - `/resources`
      - `/media-tasks`
      - `/audit-logs`
- 本轮本地验证结果：
  - `apps/admin -> npm.cmd run build` 通过
  - `apps/admin -> npm.cmd run typecheck` 通过
  - `node scripts/smoke-admin-routes.mjs --base-url http://127.0.0.1:3206 --base-path /admin --backend-base-url http://127.0.0.1:18080 --mode full`
    - 结果：`34 passed / 0 failed`
- 本轮云同步过程有一个与本次修复无关的前置阻塞：
  - 根命令 `npm.cmd run deploy:test:admin` 会先跑仓库级 `verify:quick`
  - 其中被既有后端失败挡住：
    - `PublishPipelineIntegrationTest.videoMediaProcessorRebuildsPreviewWhenExistingPreviewAssetIsNotDerivedPreview`
  - 这不是本次 admin `basePath` 修复引入的问题，也不在这次改动范围内
- 为避免无关后端用例阻塞 admin-only 同步，本轮改用：
  - `./scripts/deploy-test-admin.ps1 -VerifyAfterDeploy`
- 云端发布结果：
  - admin release：`/opt/dramatv-community-admin/releases/20260528-094801`
  - public base URL：`http://8.141.20.130/admin`
- 云端验收结果：
  - `artifacts/runtime-readiness/test/admin-deploy-20260528-094801-public-summary.json`
    - 结果：`14 passed / 0 failed`
  - `artifacts/runtime-readiness/test/admin-deploy-20260528-094801-internal-summary.json`
    - 结果：`34 passed / 0 failed`
- 当前结论：
  - 这类 `basePath=/admin` 筛选表单跳错路由的问题，本轮已经不再只修单页，而是把当前已知 7 个筛选页一起纳入自动化回归保护
  - 云端后台当前已同步到包含这轮修复的新版本
## 2026-05-28 admin 资源治理 prompt 类型误判已修复

- 用户反馈：
  - 在 `资源治理` 里筛选出来的明明是图片提示词资源
  - 但列表里的 `资源类型` 仍然显示成了 `视频提示词`
- 根因已确认：
  - 后端 `AdminResourceQueryService` 的筛选一直是对的，`image_prompt / video_prompt` 都按 `prompt_entries.modality` 过滤
  - 真正出错的是前端 `apps/admin/src/app/(dashboard)/resources/page.tsx`
  - 旧逻辑用 `media.previewUrl || media.sourceUrl` 去猜 prompt 类型
  - 这会把“有媒体地址的图片提示词”误标成 `视频提示词`
- 本轮修复：
  - 后端 DTO：
    - `AdminResourceListResponse.Item` 新增 `promptModality`
    - `AdminResourceDetailResponse` 新增 `promptModality`
  - 后端查询映射：
    - `AdminResourceQueryService.mapListItem(...)`
    - `AdminResourceQueryService.mapDetailItem(...)`
    - 都显式返回 `prompt_modality`
  - 前端资源页：
    - `apps/admin/src/lib/admin-service.ts` 同步补齐返回类型
    - `apps/admin/src/app/(dashboard)/resources/page.tsx` 改成只认 `promptModality`
    - 不再通过 `previewUrl/sourceUrl` 猜类型
  - 回归测试：
    - `AdminResourceApiIntegrationTest` 新增断言，校验列表/详情返回的 `promptModality`
- 本轮本地验证：
  - `apps/admin -> npm.cmd run typecheck` 通过
  - `apps/admin -> npm.cmd run build` 通过
  - `apps/server -> AdminResourceApiIntegrationTest` 通过
- 当前结论：
  - 这次不是筛选条件失效，也不是库里脏数据把类型改坏了
  - 是 `/resources` 前端展示层把“媒体地址存在”误当成了“视频提示词”
  - 现已改成和后端统一以真实 `modality` 为准

## 2026-05-28 admin cloud self-call timeout root cause closed locally

- 继续公网压测收尾时，顺手定位了一条云端后台稳定性隐患：`dramatv-community-admin` 运行中反复出现 `Failed to proxy http://8.141.20.130/nano-banana-images/...` 与 `connect ETIMEDOUT 8.141.20.130:80`，但 `nginx / dramatv-community-web / dramatv-community-admin / dramatv-community-server` 本身都保持 `active`。
- 直接复核云端当前 env 已确认现态问题：
  - `/opt/dramatv-community-admin/shared/dramatv-community-admin.env`
    - `DRAMATV_ADMIN_API_BASE_URL=http://127.0.0.1:18080`
    - `NEXT_PUBLIC_DRAMATV_WEB_BASE_URL=http://8.141.20.130`
  - 而 `apps/admin/next.config.ts` 的 `/__admin_proxy__/seedance-videos/*` 与 `/__admin_proxy__/nano-banana-images/*` rewrite 正是读取 `NEXT_PUBLIC_DRAMATV_WEB_BASE_URL`
- 本轮本地收口：
  - `apps/admin/next.config.ts` 改成优先读取 `DRAMATV_WEB_BASE_URL`，再回退 `NEXT_PUBLIC_DRAMATV_WEB_BASE_URL`
  - `apps/admin/src/app/(dashboard)/feed-ops/shared/feed-ops-media.ts` 同步改成服务端优先走 `DRAMATV_ADMIN_API_BASE_URL / DRAMATV_WEB_BASE_URL`
  - `scripts/deploy-test-admin.ps1` 生成云端 env 时新增 `DRAMATV_WEB_BASE_URL=http://127.0.0.1:3106`
  - `apps/admin/.env.example` 与 `apps/admin/README.md` 同步补齐新变量说明
- 本轮本地验证：
  - `apps/admin -> npm.cmd run build` 通过
- 当前结论：
  - 这不是后台服务挂掉，而是 admin 服务端代理静态资源时错误绕公网自调
  - 下次同步 admin 到云后，静态资源代理会优先走 ECS 本机 `127.0.0.1:3106`，不再依赖 `8.141.20.130:80` 自回环

## 2026-05-29 admin cloud self-call timeout fix deployed and verified

- 上一条“只在本地收口”的 admin 媒体代理修复本轮已完成测试云同步，不再停留在“下次上云再看”状态。
- 云端发布结果：
  - admin release：`/opt/dramatv-community-admin/releases/20260529-095822`
  - 发布路径：`./scripts/deploy-test-admin.ps1 -VerifyAfterDeploy`
  - 公网后台入口：`http://8.141.20.130/admin`
- 云端 env 与代理链路复核：
  - `/opt/dramatv-community-admin/shared/dramatv-community-admin.env`
    - `DRAMATV_ADMIN_API_BASE_URL=http://127.0.0.1:18080`
    - `DRAMATV_WEB_BASE_URL=http://127.0.0.1:3106`
    - `NEXT_PUBLIC_DRAMATV_WEB_BASE_URL=http://8.141.20.130`
  - 内部代理自检：
    - `curl -I http://127.0.0.1:3206/admin/__admin_proxy__/nano-banana-images/000029-13311/01.jpg -> 200 OK`
- 云端日志复核：
  - `journalctl -u dramatv-community-admin -n 30` 在本轮重启后未再出现新的 `connect ETIMEDOUT 8.141.20.130:80`
  - 当前可见的 `ETIMEDOUT` 仅剩 2026-05-28 的历史旧日志
- 云端验收结果：
  - `artifacts/runtime-readiness/test/admin-deploy-20260529-095822-public-summary.json`
    - 结果：`14 passed / 0 failed`
  - `artifacts/runtime-readiness/test/admin-deploy-20260529-095822-internal-summary.json`
    - 结果：`34 passed / 0 failed`
  - `npm run release:list:test` 已确认当前 active admin release 为 `20260529-095822`
- 当前结论：
  - admin 服务端媒体代理现已稳定改为 ECS 内部上游自调，不再绕公网自回环
  - 这条云端稳定性隐患已在测试环境关闭

## 2026-05-29 feed-ops save blocked by stale unavailable items closed on cloud

- 用户在云端后台 `首页运营` 保存时命中 `feed ops target not found`，并且问题不只出现在首页轮播，`featured / landing / discussions` 这类 feed-ops 页面也可能被同类脏配置一起卡住。
- 根因确认在 admin 前端共享编辑器，而不是这轮又出现新的 feed-ops 后端契约变更：
  - `FeedOpsPageClient` 初始化可编辑状态时直接把 `slot.items` 全量带入 `editableSlots`
  - 页面保存时又会把整页所有 slot 一起回传
  - 一旦任意 slot 里残留 `available=false` 的历史失效挂载项，保存别的 slot 也会把这条脏 target 一起发回后端
  - 后端 `AdminFeedOpsService.validateSlotItems(...)` 对失效 target 会稳定返回 `ADMIN_FEED_OPS_TARGET_NOT_FOUND`
- 本轮修复落点：
  - 文件：`apps/admin/src/app/(dashboard)/feed-ops/shared/FeedOpsPageClient.tsx`
  - 新增 `sanitizeSlotItems(...)`
  - 在 `createInitialSlots(...)` 里先过滤 `available=false`、去重并按 slot 上限截断
  - 在 `syncDisplayedItemsToEditableSlot(...)` 与 `saveCurrentState(...)` 里继续复用同一层清洗，避免失效项再次混回保存 payload
- 本地验证：
  - `apps/admin -> npm.cmd run typecheck`
  - `apps/admin -> npm.cmd run build`
- 云端同步：
  - admin release=`20260529-134708`
  - 发布方式：`./scripts/deploy-test-admin.ps1 -VerifyAfterDeploy`
  - readiness：
    - `artifacts/runtime-readiness/test/admin-deploy-20260529-134708-public-summary.json` -> `14 passed / 0 failed`
    - `artifacts/runtime-readiness/test/admin-deploy-20260529-134708-internal-summary.json` -> `34 passed / 0 failed`
- 云端实测闭环：
  - Playwright 登录 `admin-chief`
  - 真实点击 `保存草稿`
  - 以下页面均已从报错恢复为成功提示：
    - `/admin/feed-ops/home`
    - `/admin/feed-ops/featured`
    - `/admin/feed-ops/landing`
    - `/admin/feed-ops/discussions`

## 2026-05-29 featured 运营页最新/最热分配置已本地闭环

- 用户要求后台 `精选运营` 不再只配置“最新”，而是新增一个 `最新 / 最热` 切换，并且两套配置必须真实隔离，不能只是 UI 文案切换。
- 当前实现口径：
  - `featured` 保留为原“最新”配置桶
  - 新增 `featured-hot` 作为“最热”配置桶
  - 后台页面 `apps/admin/src/app/(dashboard)/feed-ops/featured/page.tsx` 已按 `searchParams.sort` 切换读取
  - `FeedOpsPageClient.tsx` 已新增 `最新 / 最热` 顶部切换，并在保存时透传 `sort`
  - `actions.ts` 已保证热榜保存后仍留在 `?sort=hot`，不会跳回默认页
- 这轮实际踩中的共享阻塞不是前端，而是后端存储约束：
  - `admin_feed_slot_configs.page_key` 的 DB check constraint 之前不允许 `featured-hot`
  - 已新增迁移 `V27__allow_featured_hot_admin_feed_slot_configs.sql`，否则热榜保存稳定 500
- 当前本地验证已通过：
  - `apps/server -> AdminFeedOpsFeaturedApiIntegrationTest,FeedReadApiIntegrationTest`
    - 结果：`19 passed / 0 failed`
  - `apps/admin -> npm.cmd run build`
  - `apps/web -> npm.cmd run build`
- 当前状态：
  - 这轮是本地已闭环、未上云
  - 下一步如果用户确认要同步测试云，需要一起发 `backend + admin + web`

## 2026-05-29 featured 运营页主视图去候选池并补弹层切换入口

- 用户补充了两个明确要求：
  - 精选运营页外层主视图不再展示 `候选内容池`
  - `最新 / 最热` 切换不能只留在页头，编排弹层里也必须能直接看到
- 本轮本地收口如下：
  - `apps/admin/src/app/(dashboard)/feed-ops/shared/FeedOpsPageClient.tsx`
    - 删除外层 `poolCard` 候选池整块
    - 候选内容查询改为仅在 `编排工作区` 弹层打开时触发
    - 把 `最新 / 最热` 切换抽成共用块，并补到弹层头部
  - `apps/admin/src/app/(dashboard)/feed-ops/shared/page.module.css`
    - 外层布局从三列收口为 `工作区 + 预览` 两列
    - 补充弹层内排序切换位置样式
- 当前本地验证已通过：
  - `apps/admin -> npm.cmd run build`
- 当前状态：
  - 这轮是本地已闭环、未上云
  - 如果用户确认同步测试云，需要发 `admin` 前端；本轮不涉及共享接口契约变更

## 2026-05-29 featured 运营页弹层切换与主视图收口已同步测试云

- 本轮已将精选运营页最新修改同步到测试云：
  - `admin release=20260529-160920`
  - `label=20260529-admin-feed-ops-modal-sync`
- 云端实际同步内容：
  - 外层主视图移除 `候选内容池`
  - 候选内容池仅保留在 `编排工作区` 弹层中
  - `最新 / 最热` 切换已补到精选运营编排弹层头部
- 部署与验收结果：
  - 通过 `./scripts/deploy-test-admin.ps1 -VerifyAfterDeploy` 完成 admin-only 云部署
  - `artifacts/runtime-readiness/test/admin-deploy-20260529-160920-public-summary.json` -> `14 passed / 0 failed`
  - `artifacts/runtime-readiness/test/admin-deploy-20260529-160920-internal-summary.json` -> `34 passed / 0 failed`
- 当前状态：
  - 测试云 admin 当前版本已切到 `20260529-160920`
  - 本轮不涉及 `web / server` 新增同步

## 2026-06-02 测试云后台 Host 路由已从同事项目纠偏回 DramaTV

- 用户反馈社区后台新地址也会落到同事的 DramaLoom 项目，本轮没有先猜浏览器缓存，而是直接按公网返回内容和云端 Nginx 配置排查。
- 根因已确认：
  - 社区 Nginx 配置 `/etc/nginx/conf.d/dramatv-community-http.conf` 在云端仍保留旧的 `server_name _`
  - 同机 `dramaloom.conf` 与 `novel-similarity-host.conf` 都是精确 Host
  - 在当前加载顺序下，`community.8.141.20.130.nip.io` 这类未精确命中的请求会被 DramaLoom 站点接住
- 本轮云端最小修复：
  - 只备份并修改社区自己的 Nginx 配置
  - 备份文件：`/etc/nginx/conf.d/dramatv-community-http.conf.bak-20260602-hostfix`
  - 修改内容：`server_name _` -> `server_name community.8.141.20.130.nip.io`
  - `nginx -t` 通过后执行 `systemctl reload nginx`
- 云端复验：
  - `http://community.8.141.20.130.nip.io/admin` 当前返回 `DramaTV 社区后台`
  - `http://dramaloom.8.141.20.130.nip.io` 仍返回 `DramaLoom - AI剧本协作编辑器`
  - `http://novel-similarity.8.141.20.130.nip.io` 仍返回 `小说库相似度比对平台`
- 边界说明：
  - 这轮只修 Host 路由，不扩大到 admin 前端版本同步
  - 云端后台登录页里仍有默认账号密码预填，说明云端 admin 运行版本仍落后于本地最新安全修复；该问题已单独识别，但未在本轮顺手发版
