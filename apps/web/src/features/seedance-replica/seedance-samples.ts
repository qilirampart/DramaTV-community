export type SeedanceReplicaItem = {
  id: string;
  title: string;
  summary: string;
  promptText: string;
  promptLanguage: "en" | "zh";
  authorName: string;
  publishedAt: string;
  featured: boolean;
  streamId: string;
  sourceLink: string;
  authorLink?: string;
  videoSrc: string;
  importedVideoUrl: string;
  thumbnailSrc: string;
};

export const seedanceReplicaItems: SeedanceReplicaItem[] = [
  {
    id: "seedance-1402",
    title: "Seedance 2.0：15 秒电影感日式浪漫短片",
    summary: "一个高度详细的 15 秒多场景提示，专为 Seedance 2.0 设计，旨在生成一部电影级的、超现实的日本高中纯爱短片。该提示详细说明了场景设置（空教室、温暖的金色阳光、浮动的尘埃）、摄像机运动、角色一致性（无变形/漂移）、微妙的微表情、同步的呼吸/嘴唇动作、对话以及音效（蝉鸣、笔尖划过纸张的声音、低频心跳声、轻柔的钢琴声）。故事情节聚焦于一个正在书写的女孩和一个偷偷观察她的男孩之间强烈、笨拙而又亲密的紧张情感，最终以一次害羞的对峙收尾。",
    promptText: `15秒电影级日剧纯爱暧昧短片，超写实画质，午后空教室暖金色阳光透过百叶窗洒在并排课桌上，细微尘埃在光束中缓缓飘浮，老旧木桌，极致自然微小动作呼吸眼神拉扯，人物全程脸部服装发型一致无变形无漂移无伪影，真实胸口轻微起伏呼吸同步，浅景深奶油虚化背景，温暖胶片颗粒8K锐利，日式青春克制心动窒息氛围。\\\\n0-4秒：极慢推进镜头从桌面中景到两人并肩侧脸特写，清纯少女穿夏季校服低头认真写笔记，长黑发耳畔碎发被微风轻轻撩起，长睫毛投下细影，皮肤自然粉嫩，嘴角无意微微上翘专注模样，轻浅均匀呼吸。\\\\n4-9秒：切换到少年近景，校服领口微松，手肘撑桌偷偷侧头凝视她，眼底满是温柔克制喜欢与心疼，瞳孔微微放大，喉结轻轻滚动，突然察觉她笔尖停顿慌乱迅速转头假装看自己笔记，耳廓迅速泛起薄红，指尖轻微颤抖捏紧笔杆，偶尔从刘海下偷瞄她一眼，呼吸稍显紊乱嘴角抿紧努力保持平静。\\\\n9-15秒：极致双人脸部同框大特写，慢镜头目光骤然对上：少女缓缓转头先是迷蒙惊讶，迅速羞涩低头0.3秒轻轻咬住下唇，脸颊耳根瞬间绽开樱花粉红，湿润睫毛怯怯抬眼再对视，同时轻声害羞低语“……你在看什么？”；少年整个人僵住瞳孔放大后愣0.4秒，慌乱小声结巴回应“没……没什么。”，少女更小声咬唇偷瞄他一眼继续低语“……骗人。”，少年顿住后温柔叹息低语“……就看你啊。”，嘴角慢慢上扬露出腼腆温柔歪嘴笑，眼角弯起细纹，呼吸明显加重。两人脸之间仿佛有无形电流拉扯暧昧张力，共享彼此呼吸温度，背景完全融化成层层奶油梦幻光斑温暖光晕空气细碎粒子。\\\\n唇部同步自然精确，情感轻颤微表情呼吸同步，对话低能量耳语害羞语气，自然短暂停顿200-400毫秒之间，嘴巴只在说话时微动无夸张无机器人感，完美自然唇口同步情感真实。\\\\n整体音效：远处夏日蝉鸣若隐若现，笔尖轻触纸面沙沙声，两人几不可闻心跳低频脉动，最后淡入极轻空气感钢琴。对白完全自然融入画面低语发生，少女声音软糯害羞，少年从慌乱结巴转为温柔。\\\\n全程维持人物身份无变化，真实微妙头部轻倾眼动呼吸同步，无任何文字水印字幕，纯净日式少年少女暗恋心动悬念。`,
    authorName: "AIGC｜阳家豪",
    publishedAt: "Mar 15, 2026",
    featured: true,
    streamId: "7f63ad253175a9ad1dac53de490efac8",
    sourceLink: "https://x.com/JiahaoYang_art/status/2033119940216344616",
    authorLink: "https://x.com/JiahaoYang_art",
    videoSrc: "https://video.twimg.com/amplify_video/2033119827175579648/vid/avc1/1280x720/d8Yxs9zzNWTtzeH7.mp4?tag=21",
    importedVideoUrl: "https://video.twimg.com/amplify_video/2033119827175579648/vid/avc1/1280x720/d8Yxs9zzNWTtzeH7.mp4?tag=21",
    thumbnailSrc: "https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/7f63ad253175a9ad1dac53de490efac8/thumbnails/thumbnail.jpg",
    promptLanguage: "zh"
  },
  {
    id: "seedance-594",
    title: "好莱坞高级定制奇幻视频提示",
    summary: "一个为 Seedance 2.0 设计的详细多场景视频生成提示，旨在创作一部好莱坞高级定制奇幻电影。该提示指定了风格、分辨率（8K）、渲染引擎（Unreal Engine 5）、时长（15 秒），以及三个独特的摄像机/动作序列，其中涉及一个身着液态青花瓷的模特，青花瓷碎裂成水墨燕子，最终形成一个 3D 流体水墨漩涡。",
    promptText: `【风格】好莱坞奇幻高定大片(Hollywood Haute Couture Fantasy)，8K超清，真实摄影(Photorealistic)，顶级时尚杂志摄影感(High-fashion Editorial Style)，虚幻引擎5流体渲染，视觉错觉。 【时长】15秒 【场景】一面一望无际的真实天空之镜盐湖。天空是极具压迫感的乌云，地面像镜子一样完美倒映着一切，画面呈现极简的冷色调。 [00:00-00:05] 镜头1：高定登场与瓷器皮肤 机位：极低角度仰拍，超长焦镜头拉近。 动作：一名拥有极具辨识度的高级脸亚洲女模，迈着清冷的台步走在水面上。 特效：她身上穿的不是布料，而是一件由流动的真实青花瓷(Liquid Blue-and-White Porcelain)构成的长裙。随着她的步伐，裙摆像真实的陶瓷一样发出清脆的碰撞声，表面流光溢彩，青蓝色的传统花纹在白瓷质感的裙身上如同活物般游走。 [00:05-00:10] 镜头2：物理碎裂与水墨降临 机位：面部微距特写，跟焦极速拉远。 动作：女模突然停下脚步，冷冷地注视着镜头，打了一个清脆的响指。 特效：响指打响的瞬间，她身上的青花瓷长裙并没有掉落，而是瞬间炸裂成成千上万只极其逼真的水墨燕子(Photorealistic Ink-wash Swallows)。这些燕子带着真实的水滴和墨迹，在空气中拖拽出黑色的流体残影，疯狂地围绕着她旋转。 [00:10-00:15] 镜头3：维度溶解与深渊倒影 机位：高空俯拍，镜头极速旋转下降。 动作：水墨燕子群猛地扎入女模脚下的镜面湖水中。 特效：原本坚硬的盐湖水面瞬间失去了表面张力，整个极其写实的真实世界开始像滴入清水中的浓墨一样剧烈晕染、溶解。真实的乌云和女模的身影全部化作极其宏大的3D流体水墨漩涡(3D Fluid Ink Vortex)，将镜头彻底吞噬进一个黑白交织的深渊。`,
    authorName: "John",
    publishedAt: "Feb 23, 2026",
    featured: true,
    streamId: "e066fab457509bc6809ea212ae5d6a51",
    sourceLink: "https://x.com/johnAGI168/status/2025849650654122348",
    authorLink: "https://x.com/johnAGI168",
    videoSrc: "https://video.twimg.com/amplify_video/2025849361498771456/vid/avc1/1280x720/cZGO7MST_Sr4m02C.mp4?tag=21",
    importedVideoUrl: "https://video.twimg.com/amplify_video/2025849361498771456/vid/avc1/1280x720/cZGO7MST_Sr4m02C.mp4?tag=21",
    thumbnailSrc: "https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/e066fab457509bc6809ea212ae5d6a51/thumbnails/thumbnail.jpg",
    promptLanguage: "zh"
  },
  {
    id: "seedance-288",
    title: "现代乡村美学治愈系短片视频提示词",
    summary: "一个详细的三镜头提示，用于 Seedance 2.0 生成一部现代乡村美学风格的治愈系电影短片。它指定了风格（电影商业广告、4K/8K、超微距、自然光、ASMR），场景（一个享有花园景色的现代开放式厨房），人物（一位穿着亚麻服装的专注创作者），以及三个场景的具体动作：采摘番茄、精准切割和安静地享用。",
    promptText: `【风格】\\\\n现代田园美学(Modern Rural Aesthetics)，电影级广告大片质感(Cinematic Commercial)，索尼A7S3/电影机拍摄，4K/8K超清，极致微距(Extreme Macro)，自然通透光感，治愈系ASMR，无古装剧感。\\\\n\\\\n【场景】\\\\n一个打理得井井有条的现代农家开放式厨房，背景是郁郁葱葱的菜园，阳光明媚。\\\\n\\\\n【角色】\\\\n现代田园博主(Modern Creator)，黑色长发随意用一根木簪挽起，身穿深蓝色的舒适棉麻套装(Modern Linen Outfit)，妆容清透，眼神专注宁静。\\\\n\\\\n【分镜详解】\\\\n[00:00-00:05] 镜头1：清晨采摘(The Freshness)\\\\n画面：高清特写。清晨的阳光侧逆光打在植物上。\\\\n动作：博主的一双素手（手指修长干净）从藤蔓上摘下一个带着晶莹露水的鲜红番茄。\\\\n细节：焦点极锐，能看清番茄表面的绒毛和水珠滑落的轨迹。背景是虚化的高级绿。\\\\n\\\\n[00:05-00:10] 镜头2：极致手作(The Craft)\\\\n画面：室内灶台，充满生活气息但一尘不染。\\\\n动作：博主正在切菜，动作熟练利落（非表演性质）。\\\\n细节：微距镜头捕捉刀刃切开食材的瞬间，汁水飞溅。接着切换到土灶膛里跳动的橙色火焰，光影温暖而真实。\\\\n\\\\n[00:10-00:15] 镜头3：静谧时光(The Moment)\\\\n画面：全景/中景。\\\\n动作：一道精致的家常菜被端上院子里的原木长桌。博主安静地坐下，轻轻整理了一下耳边的碎发，夹起一口菜。\\\\n氛围：蒸汽在逆光中缓缓升腾，画面安静得仿佛能听到风声，展现出一种现代人向往的极致松弛感。`,
    authorName: "John",
    publishedAt: "Feb 12, 2026",
    featured: true,
    streamId: "ce508b28e505ffce07247e2ab036d6f1",
    sourceLink: "https://x.com/johnAGI168/status/2021818021354848258",
    authorLink: "https://x.com/johnAGI168",
    videoSrc: "https://video.twimg.com/amplify_video/2021817887371976704/vid/avc1/1280x720/v0x8cjAfDfQ8wRtx.mp4?tag=21",
    importedVideoUrl: "https://video.twimg.com/amplify_video/2021817887371976704/vid/avc1/1280x720/v0x8cjAfDfQ8wRtx.mp4?tag=21",
    thumbnailSrc: "https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/ce508b28e505ffce07247e2ab036d6f1/thumbnails/thumbnail.jpg",
    promptLanguage: "zh"
  },
  {
    id: "seedance-189",
    title: "《鬼灭之刃》真人战斗提示词，适用于 Seedance 2.0",
    summary: "一个为 Seedance 2.0 设计的详细、高能量视频提示，用于生成一个 15 秒的《鬼灭之刃》风格战斗（水之呼吸 vs. 雷之呼吸）的真人改编片段。该提示详细说明了风格（好莱坞真人漫画改编、黑暗武士、4K、极致快速剪辑、粒子光效）、场景（夜晚迷雾森林），以及三个不同镜头，详细描绘了角色的动作、能力提升序列和最终的冲突。",
    promptText: `真人漫改·呼吸法决战（15秒·超燃特效版）\\\\n【核心看点】：水之呼吸（蓝色水龙） VS 雷之呼吸（金色闪电），真人极速对决。\\\\n\\\\n【风格】：好莱坞真人漫改电影质感，暗黑武士风，4K超清，极速快剪，粒子光效炸裂，无血腥。\\\\n【时长】：15秒\\\\n【场景】：月光下的迷雾森林，地面泥泞，落叶纷飞。\\\\n\\\\n[00:00-00:05] 镜头1：水调歌头·起式（蓄力感）\\\\n画面：一名身穿绿黑格子羽织（外套）的少年武士，在月光下压低重心，双手握刀。\\\\n动作：他深吸一口气，周围的空气瞬间凝固。随着他拔刀出鞘，一条巨大的、由高压水流凝聚而成的蓝色水龙凭空出现，环绕着他的身体和刀刃高速旋转，发出流水的轰鸣声。\\\\n特效细节：水流具有真实的水花飞溅感，照亮了黑暗的森林。\\\\n\\\\n[00:05-00:10] 镜头2：雷霆一闪·突进（极速感）\\\\n画面：对面的对手，一名披着黄色三角纹羽织的金发剑客，身体压得极低，做出了居合斩（拔刀术）的姿势。\\\\n动作：地面突然炸裂，他整个人瞬间化作一道刺眼的金色雷电残影，以肉眼无法捕捉的速度在树林间呈“之”字形极速折射突进。\\\\n特效细节：经过的地方，空气中残留着金色的电弧和被烧焦的落叶。\\\\n\\\\n[00:10-00:15] 镜头3：水雷交轰·绝响（大招对撞）\\\\n画面：极速对冲。少年武士挥舞着巨大的蓝色水龙迎面斩下，金发剑客化身雷电迎面撞上。\\\\n动作：两把刀在画面中心猛烈碰撞。\\\\n特效奇观：蓝色的水龙与金色的雷电瞬间炸开，形成一个巨大的水雷能量风暴向四周扩散。周围的大树被能量波拦腰震断，泥水和光芒遮蔽了镜头。画面在极致炫目的蓝黄白光中结束。`,
    authorName: "John",
    publishedAt: "Feb 11, 2026",
    featured: true,
    streamId: "870c9907c5740c3d98ed2d62328ca83b",
    sourceLink: "https://x.com/johnAGI168/status/2021610292979876208",
    authorLink: "https://x.com/johnAGI168",
    videoSrc: "https://video.twimg.com/amplify_video/2021609784789880832/vid/avc1/1280x720/qpPUPa0rWbOOQqSU.mp4?tag=21",
    importedVideoUrl: "https://video.twimg.com/amplify_video/2021609784789880832/vid/avc1/1280x720/qpPUPa0rWbOOQqSU.mp4?tag=21",
    thumbnailSrc: "https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/870c9907c5740c3d98ed2d62328ca83b/thumbnails/thumbnail.jpg",
    promptLanguage: "zh"
  },
  {
    id: "seedance-1403",
    title: "Seedance 2.0：80 岁说唱歌手 MV",
    summary: "一个详细的 15 秒提示，用于 Seedance 2.0 生成一个 16:9 横屏街头说唱音乐视频（MV），主角是一位 80 岁的老奶奶。该提示指定了风格（霓虹紫/蓝冷色调，爆炸性氛围）、人物形象（银发，皮夹克，嘻哈配饰）、场景分解（0-3 秒开场，3-7 秒说唱，7-11 秒舞蹈，11-15 秒高潮/结尾）、具体的说唱歌词、拍摄技巧（低角度，360 度旋转，快速剪辑）以及声音设计（Trap 电子音乐，重型 808 鼓）。",
    promptText: `16:9横屏，街头说唱MV风格，霓虹紫蓝冷色调，燃炸酷飒氛围。 0-3秒：中景推进，城市街头夜景霓虹闪烁，一位80岁银发老太太站在涂鸦墙前，满头银白短发利落背头型，方脸轮廓分明，剑眉斜飞入鬓，眼神凌厉如电，眼角皱纹如岁月勋章，嘴角上扬露出自信笑容，身穿黑色皮衣外套内搭白色印花T恤（胸前\\\\\\"YOLO\\\\\\"黑色大字）+黑色工装裤+白色高帮球鞋，脖子上挂着金色粗条项链，手腕戴银色手镯，双手举起麦克风，BGM强劲鼓点响起，老太太眼神一凛，嘴唇张开开始Rap。 3-7秒：中景+特写切换，老太太开始说唱，节奏感极强，银发随着点头动作飞扬，她一只手握麦克风，另一只手配合节奏做出手势——食指指向镜头、手掌上下切分节奏、比出嘻哈手势，动作行云流水，眼神犀利直视镜头，皱纹在表情中生动跳跃，嘴唇快速开合吐出歌词： 【Rap歌词】\\\\\\"八十岁的腿，比你们还能跳！银发飘飘，这是我的骄傲！别说我老，我的Flow比你还妙，你们玩说唱的时候，我还在听disco！\\\\\\"（语速快、节奏强、态度狠） 镜头快速剪辑：面部特写、手部动作、全身摇摆、侧面剪影，配合BGM卡点。 7-11秒：舞蹈段落，镜头拉远展示全身，老太太开始跳舞——先是经典的嘻哈bounce弹跳，然后是一个利落的街舞freeze定格，接着身体波浪从肩膀传导到脚尖，再接一个快速脚步workout，动作干净利落，银发在霓虹灯下飞舞，皮衣外套随风飘动，她一边跳一边继续Rap： 【Rap歌词】\\\\\\"腿脚利索，速度不慢，我的歌词，刻在时间！你们玩手机，我玩节拍，八十年人生，写进这verse！\\\\\\"（节奏加快、语气更强） 镜头低角度仰拍+360度环绕拍摄，捕捉老太太酷飒的舞姿。 11-15秒：高潮收尾，老太太一个帅气的转身，银发在空中甩出弧线，面对镜头用手指比出\\\\\\"嘘\\\\\\"的手势， 后嘴唇靠近麦克风，用低沉磁性的声音唱出最后一句： 【现实歌词】\\\\\\"岁月从不败美人，我只是换了一种青春...\\\\\\"（慢节奏、深情、收尾余韵） 镜头缓缓推进特写老太太的眼睛，眼角的皱纹都是故事，眼神依然犀利又带着一丝慈祥，BGM在最高潮处戛然而止，画面定格于老太太酷飒又带点温柔的微笑，暗角+霓虹紫光晕染。 音效：BGM强劲鼓点、Rap节奏、衣服摩擦声、脚步声、麦克风回响。 BGM：Trap电子乐+808重型鼓点，节奏从强劲到舒缓收尾。 禁止：任何文字、字幕、LOGO或水印。`,
    authorName: "松果先森",
    publishedAt: "Mar 15, 2026",
    featured: true,
    streamId: "e011d2666b5ee19d5b9f8b9837b974c2",
    sourceLink: "https://x.com/songguoxiansen/status/2033175478765289598",
    authorLink: "https://x.com/songguoxiansen",
    videoSrc: "https://video.twimg.com/amplify_video/2033175239644131328/vid/avc1/1280x720/Yy_62MJH7gWr7VVI.mp4?tag=21",
    importedVideoUrl: "https://video.twimg.com/amplify_video/2033175239644131328/vid/avc1/1280x720/Yy_62MJH7gWr7VVI.mp4?tag=21",
    thumbnailSrc: "https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/e011d2666b5ee19d5b9f8b9837b974c2/thumbnails/thumbnail.jpg",
    promptLanguage: "zh"
  },
  {
    id: "seedance-2530",
    title: "电影级街头赛车场景提示词",
    summary: "一份使用 Seedance 2.0 生成电影级夜间街头赛车场景的详细提示词，涵盖了运镜方式、镜头时序（0-12 秒）、环境细节以及所需的视觉风格（灵感源自《速度与激情》）。",
    promptText: `cinematic street racing sequence at night, a focused driver inside a high-performance car grips the steering wheel, intense eye focus, city lights reflecting on windshield, tension building before sudden acceleration

camera: rapid multi-angle system with seamless transitions, interior close-up -> over-the-shoulder -> exterior tracking -> low ground shots, ultra dynamic camera movement, whip pans + speed ramp transitions + motion blur masking cuts, continuous flow illusion

(0-2s) interior close-up on driver, hand tightens on gear shift, subtle breathing, dashboard lights glowing
(2-4s) over-the-shoulder shot, road ahead stretching into neon-lit city, engine vibration building
(4-6s) extreme close-up on finger pressing NOS button, instant ignition reaction
(6-8s) explosive acceleration, camera snaps to exterior side tracking shot, car launches forward with violent speed surge
(8-10s) ultra low ground shot near asphalt, wheels spinning at extreme velocity, environment streaking past
(10-12s) high-speed chase through tight streets, sharp turns, camera whip pans between angles, reflections and light trails enhancing speed

Dense urban night environment, wet asphalt reflecting neon lights, tunnel passages, street lights streaking, high-speed city atmosphere
Ultra realistic, fast and furious inspired energy, photorealistic lighting, intense motion blur, high contrast neon reflections, cinematic depth of field, extreme sense of speed, fluid transitions, no distortion, no stretching`,
    authorName: "Pierrick Chevallier | IA",
    publishedAt: "Apr 02, 2026",
    featured: true,
    streamId: "18e0c087ff65e7a375b46c7717f36923",
    sourceLink: "https://x.com/CharaspowerAI/status/2039651574297792688",
    authorLink: "https://x.com/CharaspowerAI",
    videoSrc: "/seedance-videos/06-18e0c087ff65e7a375b46c7717f36923.mp4",
    importedVideoUrl: "https://video.twimg.com/ext_tw_video/2039651554924355584/pu/vid/avc1/1280x720/kN5UG75QKxqi-UO4.mp4?tag=12",
    thumbnailSrc: "https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/18e0c087ff65e7a375b46c7717f36923/thumbnails/thumbnail.jpg",
    promptLanguage: "en"
  },
  {
    id: "seedance-2845",
    title: "Seedance 2.0 提示词：巨狼对决小公鸡",
    summary: "这是一份为 Seedance 2.0 准备的详细多序列提示词，描述了一个皮克斯风格的 3D 动画场景：一只愤怒且全副武装的巨狼不断攻击一只无聊的小公鸡，而小公鸡随意地用翅膀和尾羽化解了所有攻击，直到巨狼精疲力竭地倒下。提示词详细说明了角色、环境、15 秒序列拆解、摄像机角度以及音效。",
    promptText: `Pixar 3D animated forest clearing. Sunny day, god rays through trees, green grass, flowers.

CHARACTERS:
- Giant armored wolf: black fur, gold sword, yellow eyes, furious and humiliated, attacks with full rage
- Tiny rooster: red comb, completely unbothered, bored expression, deflects everything with casual wing flaps

SEQUENCE:
0-3s - Wolf roars, raises sword overhead, brings it down with full force. Rooster glances up, sighs, flicks one wing - sword deflects sideways. Sparks fly. Wolf stumbles forward from own momentum. Rooster examines wing casually, unbothered.
3-6s - Wolf swings horizontal slash. Rooster ducks under it yawning, taps sword away with wingtip. Wolf spins, overhead strike - rooster sidesteps one inch, sword hits ground, shockwave crater. Rooster hasn't changed expression once.
6-9s - Wolf goes berserk - rapid five-hit combo, sword blur. Rooster deflects each strike with alternating wings - tap, tap, tap, tap, tap. Casual rhythm like swatting flies. Last strike - rooster catches blade between two feathers. Stops it cold. Wolf strains, shaking. Can't move it.
9-12s - Rooster releases blade, wolf stumbles backward. Wolf charges with shoulder slam - rooster steps aside, wolf face plants into grass. Wolf up instantly, wild overhead - rooster flicks it away with tail feather. Sword spins out of wolf's grip, lands in tree trunk.
12-15s - Wolf stares at empty hands. Rooster turns, walks away slowly, doesn't look back. Scratches ground with one claw. Pecks at something in the grass. Wolf collapses face down defeated. Rooster glances back once. Looks away. Unbothered.

CAMERA:
Low angle on wolf attacks, extreme slow-mo on every deflection, close-up on rooster's bored face, wide on sword crater impacts, whip pan on rapid combo, wide defeat shot.

SOUND:
Massive sword whoosh, wing deflect light tap, sparks crackle, ground shatter, wolf frustrated growl escalating, rooster quiet cluck, sword clang on deflect, final thud of wolf collapse, peaceful bird ambience resumes.`,
    authorName: "SPEEDYAI",
    publishedAt: "Apr 07, 2026",
    featured: false,
    streamId: "a1e990e9b1b306390d3e13a0ba051441",
    sourceLink: "https://x.com/SPEEDAI07/status/2041393724622795014",
    authorLink: "https://x.com/SPEEDAI07",
    videoSrc: "/seedance-videos/07-a1e990e9b1b306390d3e13a0ba051441.mp4",
    importedVideoUrl: "https://video.twimg.com/ext_tw_video/2041393696634236929/pu/vid/avc1/848x464/CYS98L5wVUfs0W_Q.mp4?tag=19",
    thumbnailSrc: "https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/a1e990e9b1b306390d3e13a0ba051441/thumbnails/thumbnail.jpg",
    promptLanguage: "en"
  },
  {
    id: "seedance-2840",
    title: "Seedance 2.0 高端生活方式商业视频提示词",
    summary: "一份为 Seedance 2.0 设计的详细多段式提示词，旨在生成一段 15 秒的高端生活方式商业视频。视频展示了一位角色调制鸡尾酒的过程，强调高质量手机摄像头质感、电影级写实效果、特定光影以及精准的镜头构图与口型同步。",
    promptText: `【风格】高级商业氛围短片（Premium Lifestyle Commercial），高清手机前置镜头质感（Vlog互动视角），电影写实色彩，面部柔光打光，注意分镜编排和对口型，单人出镜\\\\n\\\\n【时长】15秒\\\\n\\\\n【场景】卧室+调酒区一体空间，温馨台灯与紫黄霓虹氛围光交织，微醺暖调\\\\n\\\\n【角色】完全参考@ 的人物外貌特征（顶级亚洲明艳神颜），穿深蓝蕾丝吊带裙、长卷发，全程形象高度一致\\\\n\\\\n[00:00-00:03] 镜头1：POV慵懒起床（POV → Medium Shot 丝滑转场）\\\\n\\\\n主观视角（POV），镜头从第一人称俯视角度对准床上盖着毯子的双腿，手伸入画面掀开被子，双腿落地起身。镜头随起身动作自然抬起并快速切至中景——女主已站在床边面对镜头，慵懒又带一丝霸道地说：\\\\\\"睡什么睡，起来喝酒。\\\\\\"（中文口型精准同步）\\\\n\\\\n[00:03-00:06] 镜头2：优雅倒酒（Medium Shot）\\\\n\\\\n中景，机位切至卧室调酒区，背景台灯暖光与紫黄霓虹光映在墙面。女主拿起白酒瓶，手腕微倾，透明酒液沿瓶口流入银色量酒器，随后将量酒器中的酒液倒入杯中并加入橙汁，液体混合的色彩层次清晰可见。\\\\n\\\\n[00:06-00:09] 镜头3：挤柠檬特写（Close-up）\\\\n\\\\n近景动作特写。女主双手各持半个切开的青柠，用力对挤，柠檬汁水真实地滴落进调酒壶，汁液飞溅的细节清晰，随后抓起一把冰块丢入壶中，冰块碰撞发出清脆声响。\\\\n\\\\n[00:09-00:12] 镜头4：摇酒（Close-up / Shake）\\\\n\\\\n近景。女主双手持调酒壶举至脸侧，有节奏地快速摇晃，长卷发随动作轻微摆动，壶内冰块撞击声清脆卡点。她保持迷人微笑注视镜头，眼神明亮带笑。\\\\n\\\\n[00:12-00:15] 镜头5：品尝与收尾（Medium Shot）\\\\n\\\\n中景。女主手持一杯蓝黄渐变的精致鸡尾酒，杯中气泡缓缓上升。她轻抿一口，眉眼舒展露出满意的微醺神情，随后对镜头开心挥手，定格。`,
    authorName: "John",
    publishedAt: "Apr 07, 2026",
    featured: false,
    streamId: "c007545cd29d97289934e0a92459e57a",
    sourceLink: "https://x.com/johnAGI168/status/2041374063243800793",
    authorLink: "https://x.com/johnAGI168",
    videoSrc: "/seedance-videos/01-c007545cd29d97289934e0a92459e57a.mp4",
    importedVideoUrl: "https://video.twimg.com/amplify_video/2041373843684503552/vid/avc1/720x1280/tVACt-Q-lWO5obWo.mp4?tag=21",
    thumbnailSrc: "https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/c007545cd29d97289934e0a92459e57a/thumbnails/thumbnail.jpg",
    promptLanguage: "zh"
  },
  {
    id: "seedance-2825",
    title: "间谍惊悚片打斗场景提示词（含图像参考）",
    summary: "这是一个极其详尽的多镜头提示词，旨在通过 Seedance 2.0 生成一段由 Mei 和 Dex Rei 两位角色参与的高强度间谍惊悚片打斗序列。该提示词包含了用于角色和环境设计的特定图像文件参考，以及复杂的运镜和动作描述。",
    promptText: `Mei Tactical suit.png = Mei: East Asian woman, long straight black hair, black leather tactical suit with gold accent piping along collar, shoulders, and wrist cuffs, gold buckle utility belt, dual thigh holsters, black flat-heeled boots with gold chevron trim.

Dex Rei Tactical suit.png = Dex Rei: East Asian woman, dark green twin ponytails with blunt-cut bangs, dark green leather tactical suit with black reinforced shoulder pads and knee panels, black utility belt with hip pouch, single thigh holster, black lace-up heeled combat boots, black tactical gloves.

Hallway 2.PNG = Hallway environment reference.

Style & Mood: Aggressive espionage-thriller intensity dialed higher. Fluorescent tubes flicker under impact vibrations, casting staccato light across polished epoxy floors. Desaturated teal-gray palette, motion blur on extremities during fast rotation, sharp focus snapping to point of contact on every strike. Sweat droplets flung from hair on spinning moves catch the overhead light.

Dynamic Description: Handheld medium shot already in motion - Mei drives forward with a rapid three-punch combination, fists cutting the air. Dex Rei weaves back, parries the third strike wide, and fires a roundhouse kick that whips her green ponytails in a wide arc, boot connecting flush with Mei's raised guard. Smash cut to low-angle wide, static - Mei absorbs the impact, slides back half a step on the slick floor, then explodes forward with a spinning back kick, her black hair fanning outward as her heel drives toward Dex Rei's sternum. Cut to high-angle crane shot descending - Dex Rei catches the kick against crossed forearms, the force pushing her boots backward on polished floor, fluorescent reflections streaking beneath her. She redirects Mei's momentum, pivots, and launches a spinning jump kick - her entire body rotating airborne, green suit blurring, boot arcing toward Mei's head. Cut to ECU, static - Mei's hand snaps up, palm catching the incoming boot inches from her temple, fingers gripping leather. Whip-pan to medium handheld tracking - Mei shoves the caught leg away, immediately chains into a leaping roundhouse, her body torquing horizontal mid-air, gold wrist cuffs flashing under fluorescent light. The kick grazes Dex Rei's shoulder as she ducks. Cut to wide stabilized tracking from floor level - Dex Rei drops into a spinning leg sweep across the polished surface, one palm planted. Mei vaults over it, lands, and Dex Rei is already rising with a vertical spinning crescent kick that forces Mei to arch backward, the boot passing centimeters from her chin. Hard cut to medium close-up, handheld - both women snap back to fighting stance simultaneously, chests heaving, green ponytails and black hair still settling from the rotational force. A flicker of mutual acknowledgment passes between them - Dex Rei's smirk, Mei's narrowed eyes - before they surge forward again.

Static Description: Long institutional corridor, white composite wall panels framed in dark steel mullions, exposed conduit and fluorescent fixtures along ceiling - one tube now flickering from vibration. Polished pale epoxy floor scuffed with fresh boot marks. Heavy steel doors with lever handles on both sides. Sterile symmetry disrupted by scattered sweat droplets on the floor's reflective surface.`,
    authorName: "Super Edge",
    publishedAt: "Apr 07, 2026",
    featured: false,
    streamId: "9531a3d9333024ce82546e78caef48b4",
    sourceLink: "https://x.com/KimAkiyama81/status/2041275069834445282",
    authorLink: "https://x.com/KimAkiyama81",
    videoSrc: "/seedance-videos/09-9531a3d9333024ce82546e78caef48b4.mp4",
    importedVideoUrl: "https://video.twimg.com/amplify_video/2041274526651068416/vid/avc1/1524x2046/WnrR0mzEb5JmrMfw.mp4?tag=21",
    thumbnailSrc: "https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/9531a3d9333024ce82546e78caef48b4/thumbnails/thumbnail.jpg",
    promptLanguage: "en"
  },
  {
    id: "seedance-2809",
    title: "从真实电影质感到动漫动作风格的转场提示词",
    summary: "专为 Seedance 2.0 和 Topview Agent 设计的提示词，旨在创作一部动作短片，实现从具有真实电影质感的未来城市到高能二维动漫动作风格的转场，重点在于精准的剪辑能力。",
    promptText: `Original Action Short Film: It opens with a futuristic city with almost real movie texture, gradually transitioning to a high-energy two-dimensional action style. Characters chase, leap and confront at high speed between neon viaducts and high-rise buildings. The lens language is stable at first and then explosive; the materials transition from real metal and wetland reflections to exaggerated energy lines and dynamic painting sense, forming a visual effect of \\\\\\"integration of real movie sense and anime explosive sense\\\\\\".    A strong hook in the first 2 seconds, with a stable main body, coherent actions, movie-level composition and light and shadow, real texture, epic sense, strong emotion, high-definition details, suitable for social media communication.`,
    authorName: "TopviewAI",
    publishedAt: "Apr 07, 2026",
    featured: false,
    streamId: "a369712bc4a2ae44035e09341da4eeed",
    sourceLink: "https://x.com/TopviewAIhq/status/2041268710913011737",
    authorLink: "https://x.com/TopviewAIhq",
    videoSrc: "/seedance-videos/02-a369712bc4a2ae44035e09341da4eeed.mp4",
    importedVideoUrl: "https://video.twimg.com/amplify_video/2041205892029595648/vid/avc1/1882x1080/jENCEt9Cj5OcIlXU.mp4?tag=21",
    thumbnailSrc: "https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/a369712bc4a2ae44035e09341da4eeed/thumbnails/thumbnail.jpg",
    promptLanguage: "en"
  }
];

export const seedanceFaqItems = [
  {
    question: "为什么现在有些卡片可以直接播放？",
    answer:
      "这批资源已经改成优先使用提取到的原始 MP4。已下载的样本走本地静态资源，未下载的样本走 extracted importedVideoUrl。"
  },
  {
    question: "提示词为什么比之前完整？",
    answer:
      "当前数据源不再依赖手写摘要，而是优先读取保存页面里的完整字段，并对少数引用型条目用 sourceLink 回源补齐。"
  },
  {
    question: "还可以继续补全到更多条吗？",
    answer:
      "可以。现在的流程已经支持批量解析、回源补全和视频下载，后续可以继续扩到 30 条。"
  }
] as const;
