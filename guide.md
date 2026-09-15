# Network Connectivity Doctor (网络连通性诊断工具) - 部署与维护指南

本指南详细介绍如何使用 **Docker** 和 **Docker Compose** 快速安装部署本项目，以及日常维护、配置和后续更新的操作步骤。

---

## 目录
- [1. 环境准备](#1-环境准备)
- [2. 目录结构说明](#2-目录结构说明)
- [3. 初次安装与部署](#3-初次安装与部署)
  - [方式一：使用 Docker Compose（推荐）](#方式一使用-docker-compose推荐)
  - [方式二：纯 Docker 命令部署](#方式二纯-docker-命令部署)
- [4. 数据持久化与目录映射机制](#4-数据持久化与目录映射机制)
- [5. 反向代理配置（Nginx 示例）](#5-反向代理配置nginx-示例)
- [6. 后续更新与升级指南](#6-后续更新与升级指南)
- [7. 运维常用命令与排错](#7-运维常用命令与排错)

---

## 1. 环境准备

部署服务器需满足以下基本条件：
- **操作系统**：Linux (Ubuntu 20.04+, Debian 11+, CentOS 7+, Rocky Linux 等) 或 macOS / Windows
- **Docker 引擎**：Docker 20.10+
- **Docker Compose**：Docker Compose v2+ (即 `docker compose` 命令)
- **开放端口**：默认需要开放宿主机 `3000` 端口（可自由在配置文件中修改）

如未安装 Docker，可在 Linux 环境下通过官方快速脚本安装：
```bash
curl -fsSL https://get.docker.com | bash
systemctl enable --now docker
```

---

## 2. 目录结构说明

部署所需的关键文件结构如下：

```text
├── docker-compose.yml     # 容器编排定义文件（端口映射、持久化挂载卷配置）
├── Dockerfile             # 多阶段构建镜像配置（Node 20 Alpine）
├── .dockerignore          # 构建镜像时的排除规则
├── data/
│   └── reports/           # 宿主机报告数据目录（映射容器内的 /app/data/reports）
│       └── rep_xxx.json   # 用户端上报的诊断报告持久化文件（含客户端IP与国家）
├── package.json
├── server.ts              # 后端 Express 探针与 API 接口服务
├── src/                   # 前端 React + Tailwind 源码
└── guide.md               # 本部署运维指南
```

---

## 3. 初次安装与部署

### 方式一：使用 Docker Compose（推荐）

1. **进入项目根目录**：
   ```bash
   cd network-checker
   ```

2. **确保本地报告目录存在并具有读写权限**：
   ```bash
   mkdir -p ./data/reports
   chmod -R 777 ./data/reports
   ```

3. **（可选）自定义端口**：
   如果希望更改宿主机的访问端口（例如改为 `8080`），可以临时指定环境变量或创建 `.env` 文件：
   ```bash
   echo "HOST_PORT=8080" > .env
   ```

4. **一键构建并后台启动容器**：
   ```bash
   docker compose up -d --build
   ```

5. **验证运行状态**：
   ```bash
   docker compose ps
   ```
   状态显示为 `Up` 且健康检查为 `(healthy)` 即表示启动成功。

6. **访问系统**：
   在浏览器打开：`http://<服务器公网IP或域名>:3000` 即可开始使用。

---

### 方式二：纯 Docker 命令部署

如果不使用 Docker Compose，也可以直接使用原生 Docker 命令：

```bash
# 1. 构建镜像
docker build -t network-checker:latest .

# 2. 运行容器并挂载数据目录
docker run -d \
  --name network-checker \
  --restart unless-stopped \
  -p 3000:3000 \
  -v $(pwd)/data/reports:/app/data/reports \
  network-checker:latest
```

---

## 4. 数据持久化与目录映射机制

- **核心挂载点**：
  ```yaml
  volumes:
    - ./data/reports:/app/data/reports
  ```
- **上报数据内容**：
  用户在网页端点击「上报保存结果」后，服务端会自动检测其 **真实客户端 IP、IP 所属国家/地区/城市**，并与全量探测结果打包生成一个全局唯一的 JSON 报告文件（格式如 `rep_mu1zq0t0_3551aaa0.json`）。
- **宿主机即时可见**：
  文件会实时写入宿主机本地的 `./data/reports/` 目录下。即使容器重启、销毁或升级镜像，所有历史测试数据均完整保留。
- **历史回溯还原**：
  在浏览器访问 `http://<域名>:3000/?reportId=rep_xxxx`，即可随时无损还原并查看当时的历史探测快照与上报者的 IP 归属地。

---

## 5. 反向代理配置（Nginx 示例）

如果需要在前面使用 Nginx 反代并配置 HTTPS，请确保正确传递真实 IP 头，以便系统准确识别上报用户的国家与 IP：

```nginx
server {
    listen 80;
    server_name netdoctor.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name netdoctor.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/netdoctor.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/netdoctor.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # 核心头信息：确保后端能获取到用户的真实公网 IP 与地理位置
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 支持 WebSocket（如需）
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 调高接口超时，避免长时间网络并发探测被 Nginx 提前切断
        proxy_connect_timeout 60s;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```

---

## 6. 后续更新与升级指南

当代码仓库有新版本发布时，更新步骤非常简单，不会影响已挂载的报告数据：

### 极速无损升级（推荐流程）

```bash
# 1. 进入项目根目录
cd network-checker

# 2. 拉取最新代码
git pull origin main

# 3. 重新构建并平滑重启服务
docker compose up -d --build

# 4. 清理旧的无用镜像悬空卷（释放磁盘空间）
docker image prune -f
```

> **注意**：由于 `./data/reports` 目录独立持久化在宿主机，重新构建升级过程中 **历史测试报告数据 100% 安全，不会丢失**。

---

## 7. 运维常用命令与排错

### 1. 查看容器实时日志
```bash
# 实时跟踪日志
docker compose logs -f

# 查看最近 100 条日志
docker compose logs --tail=100
```

### 2. 停止与重启容器
```bash
# 重启服务
docker compose restart

# 停止服务
docker compose stop

# 停止并移除容器（不会删除 ./data/reports 数据）
docker compose down
```

### 3. 查看已上报保存在宿主机上的报告
```bash
# 列出宿主机所有报告文件
ls -lh ./data/reports/

# 快速查看最新一份报告中的客户端 IP 与国家信息
cat $(ls -t ./data/reports/*.json | head -1) | grep -A 8 "clientInfo"
```

### 4. 常见排错

- **Q: 浏览器上报后，显示上报 IP 是 `127.0.0.1`？**
  - **A**: 若使用了 Nginx 或 Cloudflare，请检查 Nginx 反代配置是否包含 `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`。系统内部已默认开启 `trust proxy`。
- **Q: 容器启动报错权限不足（EACCES: permission denied, open /app/data/reports/xxx.json）？**
  - **A**: 容器内默认以 `node` 用户运行（UID: 1000）。在宿主机执行 `chmod -R 777 ./data/reports` 赋予写入权限即可解决。
- **Q: 如何备份历史数据？**
  - **A**: 直接打包宿主机目录即可：`tar -czvf reports_backup_$(date +%F).tar.gz ./data/reports/`。
