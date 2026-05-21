OSS为每个存储空间（Bucket）分配一系列访问域名，支持根据不同业务需求和网络环境灵活访问OSS资源。本文介绍各域名类型的格式、适用场景和配置方式，帮助选择合适的访问方式。

## 核心概念

标准的OSS访问地址由多个层级组合构成。准确理解以下四个核心概念，对于正确访问OSS至关重要：

| **概念**           | **说明**              | **格式**                                     | **用途**                                                     |
| ------------------ | --------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| **Region ID**      | 通用地域标识          | `<region-id>`，如`ap-southeast-1`            | 用于SDK、ossutil进行V4签名等场景                             |
| **专用 Region ID** | OSS 专用地域标识      | `oss-<region-id>`                            | 用于构成 Endpoint、API入参、返回参数等场景                   |
| **Endpoint**       | 服务访问地址          | `oss-<region-id>.aliyuncs.com`               | 在SDK、ossutil中配置，用于建立与OSS服务的网络连接等场景      |
| **Bucket 域名**    | 具体 Bucket的访问地址 | `<bucket-name>.oss-<region-id>.aliyuncs.com` | 用于浏览器直接访问、生成签名URL或托管静态网站、自定义域名 CNAME 解析等场景 |

这四个概念存在层级关系：**Region ID** 表示一个地理位置，OSS为其分配对应的**专用 Region ID**，专用 Region ID与域名后缀组合构成**Endpoint**（服务访问地址）。访问具体Bucket时，使用Bucket名称与Endpoint组合形成的**Bucket 域名**（资源访问地址）。

**说明**

各地域的Region ID请参见[地域和Endpoint](/help/zh/oss/user-guide/regions-and-endpoints)。

## 域名类型

OSS根据网络环境和性能需求提供不同类型的访问域名。

**重要**

根据[策略调整](https://www.alibabacloud.com/zh/notice/oss_update_notice_policy_change_in_calling_data_api_operations_via_the_default_public_domain_name_45a)，为提升OSS服务的合规性和安全性，自**2025年3月20日起，新开通OSS服务的用户**在中国内地地域的Bucket将无法通过默认外网域名调用数据操作类API（如上传、下载文件），需[通过自定义域名](/help/zh/oss/user-guide/access-buckets-via-custom-domain-names)（CNAME）方式访问OSS服务。使用HTTPS协议访问（如控制台）时，还需为自定义域名[配置SSL证书](/help/zh/oss/user-guide/access-oss-by-https-protocol)。

| **域名类型** | **适用场景** | **域名格式** | **费用特点** | **是否需要开通** |
| [外网访问域名](#9e77fc2dd3mb5) | Web应用、移动客户端等公网访问 | - Endpoint：`oss-<region-id>.aliyuncs.com` - Bucket域名：`<bucket-name>.oss-<region-id>.aliyuncs.com` | 按外网流量计费 | 默认可用 |
| [内网访问域名](#e858489d678h8) | 同地域阿里云内网访问（如ECS） | - Endpoint：`oss-<region-id>-internal.aliyuncs.com` - Bucket域名：`<bucket-name>.oss-<region-id>-internal.aliyuncs.com` | 免流量费 | 默认可用 |
| [传输加速域名](#be65c7e9a2ssc) | 跨地域、跨国际高速上传/下载 | - Endpoint：`oss-accelerate.aliyuncs.com` - Bucket域名：`<bucket-name>.oss-accelerate.aliyuncs.com` | 按传输加速计费 | 需开启[传输加速](/help/zh/oss/user-guide/transfer-acceleration)功能 |
| [CNAME 域名](#fa86ea4367tlf) | 自定义域名绑定（静态资源托管等） | - Bucket域名：`<bucket-name>.<region-id>.<cname-domain>` | 按外网流量计费 | 需[通过自定义域名访问](/help/zh/oss/user-guide/access-buckets-via-custom-domain-names) |
| [双栈域名](#f553a6edad2sw) | IPv6网络环境访问OSS | - Endpoint：`<region-id>.oss.aliyuncs.com` - Bucket域名：`<bucket-name>.<region-id>.oss.aliyuncs.com` | 同外网流量计费 | 部分地域支持 |

### 外网访问域名

专为互联网访问设计，适用于Web应用、移动客户端、跨地域访问等场景。SDK默认使用外网访问域名，只需填写Region ID即可完成配置，无需额外指定Endpoint。

### 内网访问域名

专为阿里云内网环境设计，适用于同地域的ECS实例访问OSS等场景。通过内网访问可避免产生外网流量费用，同时获得更稳定的网络连接和更低的访问延迟。使用时建议：

-   **DNS 配置优化**
    
    使用内网Endpoint时，强烈建议配置阿里云的云上私网DNS地址（`100.100.2.136`和`100.100.2.138`），确保获取正确的VIP地址，避免因DNS解析问题导致OSS访问异常。
    
-   **VIP 网段路由配置完整性**
    
    OSS为每个Region内网VIP网段划分了固定地址段，系统会在指定VIP网段内动态切换IP地址。本地设备和数据中心通过内网访问OSS时，路由配置必须涵盖完整的VIP网段，否则可能因网络路由不完整导致连接中断。各地域的内网VIP网段信息请参见[地域和Endpoint](/help/zh/oss/user-guide/regions-and-endpoints)。
    
    **重要**
    
    请确保路由配置涵盖完整的VIP网段，避免因配置不完整导致网络连通性问题。若因VIP网段配置缺失影响OSS服务可用性，相关损失需由配置方承担。
    
-   **安全组规则配置**
    
    使用ECS实例通过内网访问OSS时，安全组规则不能禁止访问任何一个VIP网段，确保网络连通性。
    

### 传输加速域名

启用[传输加速](/help/zh/oss/user-guide/transfer-acceleration)功能后可使用的专用域名，通过全球加速节点优化数据传输路径，适用于跨地域、跨国际的高速上传/下载场景，显著改善远距离访问的网络质量。

### CNAME 域名

OSS 为 Bucket 生成的专用解析域名，用于自定义域名绑定场景。当需要[通过自定义域名访问OSS](/help/zh/oss/user-guide/access-buckets-via-custom-domain-names)时，应将自定义域名CNAME解析到该域名，而非外网访问 Endpoint。

OSS 会为 Bucket 分配地域内的 CNAME 域名，不同 Bucket 可能分配到不同的域名。相比所有 Bucket 共用同一个外网Endpoint，CNAME 域名分散了访问链路，具有更高的可用性。使用时注意：

-   **仅用于 DNS 解析**：CNAME 域名仅用于自定义域名的 DNS 解析配置，不支持直接访问。
    
-   **通过自定义域名访问**：完成自定义域名绑定和CNAME解析配置后，通过自定义域名访问 OSS 资源。
    

### 双栈域名

支持IPv4和IPv6双栈访问的Endpoint，允许IPv6网络环境下的客户端直连OSS资源。使用双栈域名时，客户端无需特殊配置，在纯IPv6或双栈网络环境中，DNS会自动解析并优先使用IPv6地址建立连接。各地域的双栈域名信息请参见[地域和Endpoint](/help/zh/oss/user-guide/regions-and-endpoints)。

如何验证双栈域名的IPv6支持？

通过`dig AAAA`命令验证双栈Endpoint是否支持IPv6访问。以新加坡地域为例：

```
dig AAAA ap-southeast-1.oss.aliyuncs.com
```

如果支持IPv6，命令返回结果的`ANSWER SECTION`部分会显示AAAA记录：

```
ap-southeast-1.oss.aliyuncs.com. 60 IN  AAAA    240b:4000:f10::2c5
```

## 使用示例

## 浏览器

**重要**

通过OSS提供的访问域名访问HTML、图片等文件时，**浏览器会强制下载而非在线预览**。如需实现文件预览功能，请[通过自定义域名访问OSS](/help/zh/oss/user-guide/access-buckets-via-custom-domain-names)。

以下示例演示通过控制台获取私有Bucket的文件签名URL，更多获取签名URL的方式请参见[使用预签名URL下载或预览文件](/help/zh/oss/user-guide/how-to-obtain-the-url-of-a-single-object-or-the-urls-of-multiple-objects)。

1.  前往[Bucket列表](https://oss.console.alibabacloud.com/bucket)，单击目标Bucket。
    
2.  单击目标文件的文件名或操作列的**详情**，**域名**选择**外网域名**，然后单击**复制文件 URL**。
    
3.  在浏览器中访问URL。
    

## ossutil

以下示例演示使用[命令行工具ossutil](/help/zh/oss/developer-reference/ossutil-overview/)下载文件。ossutil默认使用外网访问Endpoint，可通过`-e`参数指定其他类型的Endpoint：

```
ossutil cp oss://<bucket-name>/<object-name> <local-path> -e <endpoint>
```

不同域名类型对应的参数配置：

| **域名类型**             | **参数配置**                                            |
| ------------------------ | ------------------------------------------------------- |
| 外网访问域名（**默认**） | 可省略`-e`参数，或指定`-e oss-<region-id>.aliyuncs.com` |
| 内网访问域名             | `-e oss-<region-id>-internal.aliyuncs.com`              |
| 传输加速域名             | `-e oss-accelerate.aliyuncs.com`                        |
| 自定义域名               | `-e <custom-domain> --addressing-style cname`           |

## SDK

以下展示主流语言V2版本SDK的初始化示例。SDK默认使用外网访问域名，只需填写Region即可完成配置。

## Java

```
OSSClient client = OSSClient.newBuilder()
        .credentialsProvider(provider)
        .region("<region-id>")
        .build();
```

完整的初始化代码请参见[OSS Java SDK V2（预览版）](/help/zh/oss/developer-reference/oss-sdk-for-java-2-0/)。

## Python

```
cfg = oss.config.load_default()
cfg.credentials_provider = credentials_provider
cfg.region = '<region-id>'

client = oss.Client(cfg)
```

完整的初始化代码请参见[OSS Python SDK V2](/help/zh/oss/developer-reference/2-0-manual-preview-version/)。

## Go

```
cfg := oss.LoadDefaultConfig().
        WithCredentialsProvider(credentials.NewEnvironmentVariableCredentialsProvider()).
        WithRegion("<region-id>")

client := oss.NewClient(cfg)
```

完整的初始化代码请参见[OSS Go SDK V2](/help/zh/oss/developer-reference/manual-for-go-sdk-v2/)。

## PHP

```
$cfg = Configuration::loadDefault();
$cfg->setCredentialsProvider($provider);
$cfg->setRegion('<region-id>');

$client = new Oss\Client($cfg);
```

完整的初始化代码请参见[OSS PHP SDK V2](/help/zh/oss/developer-reference/manual-for-php-v2/)。

## C#

```
var cfg = OSS.Configuration.LoadDefault();
cfg.CredentialsProvider = new OSS.Credentials.EnvironmentVariableCredentialsProvider();
cfg.Region = "<region-id>";

using var client = new OSS.Client(cfg);
```

完整的初始化代码请参见[OSS C# SDK V2（预览版）](/help/zh/oss/developer-reference/oss-sdk-for-c-2-0/)。

## Node.js

```
const client = new OSS({
    region: 'oss-<region-id>',
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    authorizationV4: true,
});
```

完整的初始化代码请参见[OSS Node.js SDK](/help/zh/oss/developer-reference/nodejs-sdk/)。

#### 切换域名类型

V2版本SDK支持通过配置项快速切换域名类型，无需手动拼接Endpoint字符串：

| **语言** | **外网访问域名**  | **内网访问域名**                | **传输加速域名**                  | **双栈域名**                     |
| -------- | ----------------- | ------------------------------- | --------------------------------- | -------------------------------- |
| Java     | 仅设置`region`    | `.useInternalEndpoint(true)`    | `.useAccelerateEndpoint(true)`    | `.useDualStackEndpoint(true)`    |
| Python   | 仅设置`region`    | `use_internal_endpoint = True`  | `use_accelerate_endpoint = True`  | `use_dualstack_endpoint = True`  |
| Go       | 仅设置`Region`    | `WithUseInternalEndpoint(true)` | `WithUseAccelerateEndpoint(true)` | `WithUseDualStackEndpoint(true)` |
| PHP      | 仅设置`setRegion` | `setUseInternalEndpoint(true)`  | `setUseAccelerateEndpoint(true)`  | `setUseDualStackEndpoint(true)`  |
| C#       | 仅设置`Region`    | `UseInternalEndpoint = true`    | `UseAccelerateEndpoint = true`    | `UseDualStackEndpoint = true`    |

**说明**

-   Node.js SDK 不支持上述配置项，需通过`endpoint`参数直接指定目标Endpoint字符串。
    
-   可以在所有SDK中通过`endpoint`参数直接指定任意Endpoint字符串，效果相同。
    
-   如需使用V1版本SDK，请参见对应语言的V1文档：[OSS Java SDK V1](/help/zh/oss/developer-reference/oss-java-sdk/) | [OSS Python SDK V1](/help/zh/oss/developer-reference/python-sdk-v1/) | [OSS Go SDK V1](/help/zh/oss/developer-reference/go-sdk-v1/) | [OSS PHP SDK V1](/help/zh/oss/developer-reference/preface-3/) | [OSS C# SDK V1](/help/zh/oss/developer-reference/preface-4/)。
    
-   更多语言的SDK集成示例请参见[SDK参考](/help/zh/oss/developer-reference/sdk-code-samples/)。
    

## 协议与端口

所有地域的Endpoint和Bucket域名均支持HTTP和HTTPS两种协议访问。为确保数据传输安全性，强烈建议在生产环境中使用HTTPS协议。

OSS支持以下端口：

| **端口** | **协议** | **说明**           |
| -------- | -------- | ------------------ |
| 80       | HTTP     | HTTP协议默认端口   |
| 443      | HTTPS    | HTTPS协议默认端口  |
| 1935     | RTMP     | 仅用于RTMP推流场景 |

## 相关文档

-   [地域和Endpoint](/help/zh/oss/user-guide/regions-and-endpoints)
    
-   [通过自定义域名访问OSS](/help/zh/oss/user-guide/access-buckets-via-custom-domain-names)
    
-   [通过传输加速访问OSS](/help/zh/oss/user-guide/transfer-acceleration)
    
-   [SDK参考](/help/zh/oss/developer-reference/sdk-code-samples/)