# DramaTV 项目工程理解 - 第 3 课：后端运行基础：微服务、JVM、线程池与连接池

## 学习目标

本节记录这轮问答里的关键提升点。学完后，你应该能做到：

- 区分“微服务”和“Service 层”。
- 理解 JVM 在 Java / Spring Boot 后端运行链路中的位置。
- 理解线程、线程池、Tomcat 请求线程池、数据库连接池的区别。
- 遇到接口变慢时，不再只想到“加线程”，而是能按瓶颈位置分析。

## 1. 微服务不是 Service 层

容易混淆的点：

```text
Service 层
微服务 Microservice
```

它们不是一回事。

### Service 层

Service 层是一个后端项目内部的代码分层。

传统 Java 后端常见结构：

```text
Controller
-> Service
-> DAO / Repository
-> Database
```

在 DramaTV 当前项目里，类似的结构是：

```text
Controller
-> application / QueryService
-> JdbcTemplate / Repository
-> PostgreSQL
```

例如：

```text
HomeFeedQueryService
FeaturedInventoryQueryService
```

这些是代码层级，不是独立微服务。

### 微服务

微服务是系统架构和部署方式。

一个大系统可以拆成多个独立后端应用：

```text
identity-service
content-service
feed-service
interaction-service
media-service
search-service
admin-service
```

每个服务都可以是独立的一套 Spring Boot：

```text
独立代码
独立启动
独立端口
独立部署
独立日志
可独立扩容
服务之间通过 HTTP / RPC / MQ 调用
```

每个微服务内部仍然可以有自己的：

```text
Controller -> Service -> DAO
```

所以最准确的关系是：

```text
Service 层 = 一个服务内部的业务代码层
微服务 = 多个独立后端应用组成的系统架构
```

## 2. 知名微服务案例

比较典型的大型互联网系统都会使用微服务或类似微服务的分布式架构，例如：

- 淘宝 / 天猫 / 阿里系电商
- Amazon
- Netflix
- Uber
- 美团
- 京东
- 抖音 / TikTok 这类大型内容平台

注意：这些公司的完整架构细节不会全部公开。我们说它们是微服务，主要来自公开技术分享、工程实践和行业共识。

### 为什么大系统会拆微服务

适合微服务的原因通常不是“代码变多了”这么简单，而是：

- 业务边界清楚，例如用户、订单、支付、内容、搜索可以分开。
- 不同模块流量差异大，需要单独扩容。
- 团队很多，需要不同团队独立开发、独立发布。
- 某个模块故障时，不希望拖垮整个系统。
- 不同模块发布频率不同，不想每次改一个小功能都重发整个后端。

但微服务也会增加复杂度：

- 服务注册发现
- 网关路由
- 服务间鉴权
- 分布式事务
- 链路追踪
- 日志聚合
- 接口版本管理
- 服务降级和熔断
- 多服务部署和回滚

所以 DramaTV 当前阶段更适合保持“模块化单体”。

## 3. DramaTV 当前不是微服务集群

当前项目更像：

```text
apps/web        前台 Next.js
apps/admin      后台 Next.js
apps/server     一个 Spring Boot 主后端
PostgreSQL      统一数据库
Redis           缓存
OSS             媒体存储
```

`apps/server` 内部按业务域拆包：

```text
identity
feed
prompt
profile
discussion
interaction
media
admin
```

这些是模块，不是独立微服务。

如果未来拆成微服务，可能是：

```text
identity-service      登录、用户、权限
content-service       提示词、工作流、帖子
feed-service          首页、精选页、推荐流
interaction-service   点赞、收藏、关注、评论
media-service         上传、OSS、预览、封面
admin-service         后台配置、审核
search-service        搜索
```

但现在贸然拆，会让部署、调试、数据一致性、链路追踪都变复杂，不适合作为第一版优化方向。

## 4. JVM 是什么

JVM 是 `Java Virtual Machine`，中文叫 Java 虚拟机。

一句话：

```text
JVM 是运行 Java 程序的运行环境。
```

Java 代码的运行链路：

```text
.java 源代码
-> javac 编译
-> .class 字节码
-> JVM 运行字节码
-> 操作系统执行
```

Java 的跨平台能力来自这里：

```text
Java 代码面向 JVM
不同系统安装不同 JVM
JVM 再适配 Windows / Linux / macOS
```

所以同一份 Spring Boot 后端代码，在 Windows 本地和 Linux 云端都能跑，本质上是因为不同平台有对应 JVM。

## 5. JVM 和驱动的类比

你的类比是：

```text
JVM 有点像操作系统里的驱动，方便一个产品适配多个设备。
```

这个类比有一部分是对的。

相似点：

```text
驱动：让操作系统能控制不同硬件
JVM：让 Java 字节码能运行在不同操作系统上
```

不同点：

```text
驱动更偏操作系统和硬件之间的桥
JVM 更像 Java 程序和操作系统之间的运行时环境
```

更准确的理解：

```text
Java 代码不直接适配 Windows / Linux
Java 代码适配 JVM
JVM 再适配操作系统
```

## 6. 线程是什么

线程可以理解为程序里正在执行的一条工作线。

一个 Spring Boot 后端启动后，是一个 Java 进程：

```text
apps/server = 一个 Java 进程
```

这个进程里面可以有很多线程：

```text
接收请求的线程
处理业务的线程
查数据库的线程
定时任务线程
日志线程
垃圾回收线程
```

类比：

```text
进程 = 一家公司
线程 = 公司里的员工
任务 = 员工手上的活
```

精选页请求大概会这样走：

```text
浏览器请求 /api/feed/featured-inventory
-> Tomcat 分配一个请求线程
-> 线程进入 HomeFeedController
-> 调用 HomeFeedQueryService
-> 调用 FeaturedInventoryQueryService
-> JdbcTemplate 查 PostgreSQL
-> 组装 DTO
-> 返回响应
```

## 7. 线程池是什么

线程不能无限创建。

原因：

- 创建线程有成本。
- 每个线程都占内存。
- 线程太多会导致 CPU 频繁上下文切换。
- 线程太多还会增加锁竞争、排队和整体调度成本。

所以后端通常会提前准备一批线程反复复用，这批线程就叫线程池。

```text
线程池 = 一组可复用、受数量控制的线程
```

类比：

```text
没有线程池：每来一个订单就临时招一个员工
有线程池：公司固定有一批员工，订单来了就分配给空闲员工
```

线程池常见概念：

- 核心线程数：平时保留多少线程。
- 最大线程数：极限情况下最多允许多少线程。
- 任务队列：线程都忙时，新任务先排队。
- 拒绝策略：队列也满了，任务怎么处理。

## 8. Tomcat 请求线程池

DramaTV 后端是 Spring Boot，默认内嵌 Tomcat。

Tomcat 有请求线程池。

当用户访问接口时：

```text
浏览器
-> Nginx
-> Spring Boot / Tomcat
-> Tomcat 请求线程池取一个线程
-> Controller
-> Service / QueryService
-> Database
```

所以 300 个用户同时访问精选页，不等于一定新建 300 个线程。

更准确是：

```text
300 个请求进来
-> Tomcat 有空闲线程就处理
-> 线程不够时，部分请求排队
-> 队列和超时时间撑不住时，可能超时或拒绝
```

关键理解：

```text
并发用户数 不等于 新建线程数
并发处理中请求数 会受到 Tomcat 线程池上限限制
```

## 9. 数据库连接池

数据库连接池不是 Tomcat 请求线程池。

它们的区别：

```text
Tomcat 请求线程池 = 处理 HTTP 请求的工人
数据库连接池 = 通往 PostgreSQL 的可复用连接通道
```

精选页链路中：

```text
Tomcat 请求线程
-> 进入 Java 业务代码
-> JdbcTemplate 要查 PostgreSQL
-> 从数据库连接池借一个连接
-> SQL 执行完成
-> 连接还回连接池
-> 请求线程返回响应
-> 请求线程回到 Tomcat 线程池
```

所以：

```text
Tomcat 线程池管“多少请求能同时被后端处理”
数据库连接池管“多少数据库查询能同时进行”
```

## 10. 为什么不能只调大 Tomcat 线程池

如果精选页接口变慢，不能只调大 Tomcat 线程池。

因为可能的瓶颈有很多：

- SQL 本身慢。
- 一次返回数据太多。
- 数据库连接池排队。
- Tomcat 请求线程排队。
- PostgreSQL CPU / IO 扛不住。
- JVM 内存或 GC 压力大。
- Nginx 或后端超时配置不合理。

如果数据库连接池只有 20 个连接，即使 Tomcat 有 300 个请求线程，真正能同时查数据库的也可能只有 20 个。

这种情况下，调大 Tomcat 线程池可能变成：

```text
更多请求线程进入系统
-> 更多线程堵在等待数据库连接
-> JVM 线程数和内存压力变大
-> CPU 上下文切换变多
-> 整体更慢
```

## 11. 你的“筷子和饭”类比

你说：

```text
一堆人来吃饭，不能只多加筷子，而不多加饭。
```

这个类比方向对，但可以再工程化一点：

```text
Tomcat 请求线程池 = 服务员 / 接待能力
数据库连接池 = 后厨窗口 / 出餐通道
数据库本身 = 厨房产能
SQL 查询 = 每道菜的制作复杂度
接口返回数据量 = 每桌端出去的菜量
```

因此正确思路不是“线程池和连接池都无脑加大”，而是：

```text
先找瓶颈在哪里，再决定优化哪里。
```

如果是 SQL 慢，应该优化 SQL 或索引。

如果是一次返回太多，应该优化分页、字段裁剪、缓存。

如果是数据库连接池排队，但数据库还有余量，可以考虑调大连接池。

如果是 Tomcat 请求线程排队，但后端和数据库都还有余量，可以考虑调大请求线程池。

如果数据库本身已经满负载，继续加连接只会压垮数据库。

## 12. 当前掌握情况记录

这轮问答中，你已经掌握或接近掌握：

- 微服务不是 Service 层。
- 微服务通常是一套套可独立部署的 Spring Boot 或其他后端应用组合。
- JVM 是 Java 程序的运行环境，类似适配层，但不是驱动。
- 线程池不是越大越好，线程多会带来上下文切换和资源消耗。
- Tomcat 请求线程池和数据库连接池不是一个东西。
- 接口慢时不能只加入口能力，还要看后厨产能、SQL 和数据量。

仍需继续巩固：

- Tomcat 请求线程池和数据库连接池在真实请求链路中的先后关系。
- “连接池要不要调大”取决于数据库是否还有承载余量。
- 微服务适合什么阶段，不适合什么时候过早拆。

---

## 检查站

请以后复习时直接回答：

1. 为什么 `FeaturedInventoryQueryService` 不是微服务？
2. 一个微服务内部还会不会有自己的 Controller / Service / DAO？
3. JVM 在 `.java -> .class -> 运行` 这条链路中处在哪一段？
4. 300 个用户同时访问精选页，为什么不等于一定新建 300 个线程？
5. Tomcat 请求线程池和数据库连接池分别控制什么？
6. 精选页接口慢时，为什么不能只调大 Tomcat 线程池？
