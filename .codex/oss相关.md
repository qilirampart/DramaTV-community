OSS在全球多个地域部署服务，每个地域提供外网、内网和双栈等不同类型的Endpoint。以下表格列出各地域对应的Endpoint和内网VIP网段，供快速查阅。如需了解各Endpoint类型的适用场景和使用方式，请参见[通过Endpoint和Bucket域名访问OSS](/help/zh/oss/user-guide/access-oss-via-bucket-domain-name)。

**重要**

通过OSS提供的访问域名访问HTML、图片等文件时，浏览器会强制下载而非在线预览。如需实现文件预览功能，请[通过自定义域名访问OSS](/help/zh/oss/user-guide/access-buckets-via-custom-domain-names)。

## **公共云**

适用于大多数业务场景，覆盖全球多个地域。

**重要**

根据[策略调整](https://www.alibabacloud.com/zh/notice/oss_update_notice_policy_change_in_calling_data_api_operations_via_the_default_public_domain_name_45a)，为提升OSS服务的合规性和安全性，自**2025年3月20日起，新开通OSS服务的用户**在中国内地地域的Bucket将无法通过默认外网域名调用数据操作类API（如上传、下载文件），需[通过自定义域名](/help/zh/oss/user-guide/access-buckets-via-custom-domain-names)（CNAME）方式访问OSS服务。使用HTTPS协议访问（如控制台）时，还需为自定义域名[配置SSL证书](/help/zh/oss/user-guide/access-oss-by-https-protocol)。

### **亚太-中国**

| **地域**                       | **地域ID**     | **外网Endpoint**                | **内网Endpoint**                         | **双栈Endpoint**                | **内网VIP网段**                                              |
| ------------------------------ | -------------- | ------------------------------- | ---------------------------------------- | ------------------------------- | ------------------------------------------------------------ |
| 华东1（杭州）                  | cn-hangzhou    | oss-cn-hangzhou.aliyuncs.com    | oss-cn-hangzhou-internal.aliyuncs.com    | cn-hangzhou.oss.aliyuncs.com    | 100.118.28.0/24 100.114.102.0/24 100.98.170.0/24 100.118.31.0/24 |
| 华东2（上海）                  | cn-shanghai    | oss-cn-shanghai.aliyuncs.com    | oss-cn-shanghai-internal.aliyuncs.com    | cn-shanghai.oss.aliyuncs.com    | 100.98.35.0/24 100.98.110.0/24 100.98.169.0/24 100.118.102.0/24 |
| 华东5 （南京-本地地域-关停中） | cn-nanjing     | oss-cn-nanjing.aliyuncs.com     | oss-cn-nanjing-internal.aliyuncs.com     | 不支持                          | 100.114.142.0/24                                             |
| 华北1（青岛）                  | cn-qingdao     | oss-cn-qingdao.aliyuncs.com     | oss-cn-qingdao-internal.aliyuncs.com     | cn-qingdao.oss.aliyuncs.com     | 100.115.173.0/24 100.99.113.0/24 100.99.114.0/24 100.99.115.0/24 |
| 华北2（北京）                  | cn-beijing     | oss-cn-beijing.aliyuncs.com     | oss-cn-beijing-internal.aliyuncs.com     | cn-beijing.oss.aliyuncs.com     | 100.118.58.0/24 100.118.167.0/24 100.118.170.0/24 100.118.171.0/24 100.118.172.0/24 100.118.173.0/24 |
| 华北3（张家口）                | cn-zhangjiakou | oss-cn-zhangjiakou.aliyuncs.com | oss-cn-zhangjiakou-internal.aliyuncs.com | cn-zhangjiakou.oss.aliyuncs.com | 100.118.90.0/24 100.98.159.0/24 100.114.0.0/24 100.114.1.0/24 |
| 华北5（呼和浩特）              | cn-huhehaote   | oss-cn-huhehaote.aliyuncs.com   | oss-cn-huhehaote-internal.aliyuncs.com   | cn-huhehaote.oss.aliyuncs.com   | 100.118.195.0/24 100.99.110.0/24 100.99.111.0/24 100.99.112.0/24 |
| 华北6（乌兰察布）              | cn-wulanchabu  | oss-cn-wulanchabu.aliyuncs.com  | oss-cn-wulanchabu-internal.aliyuncs.com  | cn-wulanchabu.oss.aliyuncs.com  | 100.114.11.0/24 100.114.12.0/24 100.114.100.0/24 100.118.214.0/24 |
| 华南1（深圳）                  | cn-shenzhen    | oss-cn-shenzhen.aliyuncs.com    | oss-cn-shenzhen-internal.aliyuncs.com    | cn-shenzhen.oss.aliyuncs.com    | 100.118.78.0/24 100.118.203.0/24 100.118.204.0/24 100.118.217.0/24 |
| 华南2（河源）                  | cn-heyuan      | oss-cn-heyuan.aliyuncs.com      | oss-cn-heyuan-internal.aliyuncs.com      | cn-heyuan.oss.aliyuncs.com      | 100.98.83.0/24 100.118.174.0/24                              |
| 华南3（广州）                  | cn-guangzhou   | oss-cn-guangzhou.aliyuncs.com   | oss-cn-guangzhou-internal.aliyuncs.com   | cn-guangzhou.oss.aliyuncs.com   | 100.115.33.0/24 100.114.101.0/24                             |
| 西南1（成都）                  | cn-chengdu     | oss-cn-chengdu.aliyuncs.com     | oss-cn-chengdu-internal.aliyuncs.com     | cn-chengdu.oss.aliyuncs.com     | 100.115.155.0/24 100.99.107.0/24 100.99.108.0/24 100.99.109.0/24 |
| 西北2（中卫）                  | cn-zhongwei    | oss-cn-zhongwei.aliyuncs.com    | oss-cn-zhongwei-internal.aliyuncs.com    | 不支持                          | 100.115.157.0/27                                             |
| 中国香港                       | cn-hongkong    | oss-cn-hongkong.aliyuncs.com    | oss-cn-hongkong-internal.aliyuncs.com    | cn-hongkong.oss.aliyuncs.com    | 100.115.61.0/24 100.99.103.0/24 100.99.104.0/24 100.99.106.0/24 |

### **亚太-其他**

| **地域**             | **地域ID**     | **外网Endpoint**                | **内网Endpoint**                         | **双栈Endpoint** | **内网VIP网段**                                              |
| -------------------- | -------------- | ------------------------------- | ---------------------------------------- | ---------------- | ------------------------------------------------------------ |
| 日本（东京）         | ap-northeast-1 | oss-ap-northeast-1.aliyuncs.com | oss-ap-northeast-1-internal.aliyuncs.com | 不支持           | 100.114.211.0/24 100.114.114.0/25                            |
| 韩国（首尔）         | ap-northeast-2 | oss-ap-northeast-2.aliyuncs.com | oss-ap-northeast-2-internal.aliyuncs.com | 不支持           | 100.99.119.0/24                                              |
| 新加坡               | ap-southeast-1 | oss-ap-southeast-1.aliyuncs.com | oss-ap-southeast-1-internal.aliyuncs.com | 不支持           | 100.118.219.0/24 100.99.213.0/24 100.99.116.0/24 100.99.117.0/24 |
| 马来西亚（吉隆坡）   | ap-southeast-3 | oss-ap-southeast-3.aliyuncs.com | oss-ap-southeast-3-internal.aliyuncs.com | 不支持           | 100.118.165.0/24 100.99.125.0/24 100.99.130.0/24 100.99.131.0/24 |
| 印度尼西亚（雅加达） | ap-southeast-5 | oss-ap-southeast-5.aliyuncs.com | oss-ap-southeast-5-internal.aliyuncs.com | 不支持           | 100.114.98.0/24                                              |
| 菲律宾（马尼拉）     | ap-southeast-6 | oss-ap-southeast-6.aliyuncs.com | oss-ap-southeast-6-internal.aliyuncs.com | 不支持           | 100.115.16.0/24                                              |
| 泰国（曼谷）         | ap-southeast-7 | oss-ap-southeast-7.aliyuncs.com | oss-ap-southeast-7-internal.aliyuncs.com | 不支持           | 100.98.249.0/24                                              |

### **欧洲与美洲**

| **地域**         | **地域ID**   | **外网Endpoint**              | **内网Endpoint**                       | **双栈Endpoint**              | **内网VIP网段**                                              |
| ---------------- | ------------ | ----------------------------- | -------------------------------------- | ----------------------------- | ------------------------------------------------------------ |
| 德国（法兰克福） | eu-central-1 | oss-eu-central-1.aliyuncs.com | oss-eu-central-1-internal.aliyuncs.com | eu-central-1.oss.aliyuncs.com | 100.115.154.0/24                                             |
| 英国（伦敦）     | eu-west-1    | oss-eu-west-1.aliyuncs.com    | oss-eu-west-1-internal.aliyuncs.com    | 不支持                        | 100.114.114.128/25                                           |
| 美国（硅谷）     | us-west-1    | oss-us-west-1.aliyuncs.com    | oss-us-west-1-internal.aliyuncs.com    | 不支持                        | 100.115.107.0/24                                             |
| 美国（弗吉尼亚） | us-east-1    | oss-us-east-1.aliyuncs.com    | oss-us-east-1-internal.aliyuncs.com    | 不支持                        | 100.115.60.0/24 100.99.100.0/24 100.99.101.0/24 100.99.102.0/24 |
| 墨西哥           | na-south-1   | oss-na-south-1.aliyuncs.com   | oss-na-south-1-internal.aliyuncs.com   | 不支持                        | 100.115.112.0/27                                             |

### **中东**

| **地域**                     | **地域ID**   | **外网Endpoint**              | **内网Endpoint**                       | **双栈Endpoint** | **内网VIP网段** |
| ---------------------------- | ------------ | ----------------------------- | -------------------------------------- | ---------------- | --------------- |
| 阿联酋（迪拜）               | me-east-1    | oss-me-east-1.aliyuncs.com    | oss-me-east-1-internal.aliyuncs.com    | 不支持           | 100.99.235.0/24 |
| 沙特（利雅得）- 合作伙伴运营 | me-central-1 | oss-me-central-1.aliyuncs.com | oss-me-central-1-internal.aliyuncs.com | 不支持           | 100.99.121.0/24 |

## **常见问题**

### **如何选择地域？**

选择地域时建议综合考虑以下因素：

-   **就近原则**：选择与主要用户或应用程序距离最近的地域，可降低网络延迟，提升访问体验。
    
-   **云产品互联**：当其他云产品和OSS位于同一地域时，可通过内网互访，免除外网流量费用。
    
-   **成本考虑**：各地域的产品价格和优惠政策存在差异，详见[OSS产品定价](https://www.alibabacloud.com/product/oss/pricing)。
    
-   **合规要求**：不同地域或行业对数据合规性要求不同，需根据业务规范选择合适地域。
    
-   **产品功能**：新功能在发布初期通常在部分地域进行公测，如需使用最新功能，应在指定地域创建Bucket。详见[新功能发布记录](/help/zh/oss/release-notes#concept-185831)。
    

可通过`curl`命令测试本地网络到不同地域OSS Endpoint的访问延迟，辅助选择决策。较低的 `time_connect` 和 `time_starttransfer` 值通常表示更好的网络质量。

```
curl -o /dev/null -s -w "Connect: %{time_connect}s\nStart Transfer: %{time_starttransfer}s\nTotal: %{time_total}s\n" "https://oss-<region-id>.aliyuncs.com"
```

### **海外地域名称在不同页面中显示不一致？**

部分海外地域名称在OSS产品定价页面和资源包购买页面中可能存在表述差异，但均指向相同的物理地理位置。例如，美国（硅谷）地域在不同页面中可能显示为美西1或美西，更多信息请参见[OSS产品定价](https://www.alibabacloud.com/product/oss/pricing)或者[购买资源包](https://common-buy-intl.alibabacloud.com/?spm=5176.8465980.bucket-list.2.11df6765PslE4M&commodityCode=oss_bag_intl#/buy)。

### **跨境访问 OSS 时出现延迟或连接不稳定怎么办？**

跨境远距离传输（例如从中国内地访问中国香港或者新加坡节点）需经过长距离公共互联网链路及多个运营商互联节点，受物理距离、路由复杂性及公网拥塞等客观因素影响，访问可能出现延迟较高或连接不稳定的情况。

#### **核心建议：遵循“就近部署”原则**

-   同地域部署（首选方案）：请将您的业务应用（如 ECS、容器服务）与对象存储 Bucket 规划在同一地域。在同地域内，流量通过阿里云高速内网交互，不受公网及跨境链路影响。
    
-   避免非必要跨境直连：对于核心生产业务，请尽量避免通过公共互联网进行长距离的跨境直接读写。将业务整体迁移至数据存储所在的区域，是从架构根源上消除网络波动的最有效手段。
    

#### **解决方案：使用传输加速**

若您因全球业务分发、异地容灾备份等场景，确实存在不可避免的少量跨境远距离访问需求，这 部分 访问建议您使用阿里云 OSS 传输加速（Transfer Acceleration）功能。详情请参见[通过传输加速访问OSS](/help/zh/oss/user-guide/transfer-acceleration)。

## 相关文档

-   [访问域名与网络连接概述](/help/zh/oss/user-guide/access-and-network-overview)
    
-   [通过Endpoint和Bucket域名访问OSS](/help/zh/oss/user-guide/access-oss-via-bucket-domain-name)
    
-   [通过传输加速访问OSS](/help/zh/oss/user-guide/transfer-acceleration)
    
-   [使用限制及性能指标](/help/zh/oss/user-guide/limits)
    

 span.aliyun-docs-icon { color: transparent !important; font-size: 0 !important; } span.aliyun-docs-icon:before { color: black; font-size: 16px; } span.aliyun-docs-icon.icon-size-20:before { font-size: 20px; } span.aliyun-docs-icon.icon-size-22:before { font-size: 22px; } span.aliyun-docs-icon.icon-size-24:before { font-size: 24px; } span.aliyun-docs-icon.icon-size-26:before { font-size: 26px; } span.aliyun-docs-icon.icon-size-28:before { font-size: 28px; }