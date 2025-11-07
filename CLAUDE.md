# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Vercel + Supabase 的优惠券兑换系统，采用无服务器架构和前后端分离设计。系统采用两步验证流程：首先验证兑换券有效性，然后收集用户收货信息并完成兑换。

## 技术栈

**前端：**
- 原生 HTML/CSS/JavaScript
- Tailwind CSS (CDN)
- 响应式设计

**后端：**
- Vercel Serverless Functions
- Supabase (PostgreSQL + BaaS)
- @supabase/supabase-js 客户端库

## 核心架构

```
前端 (index.html) → Vercel API Functions → Supabase Database
```

**关键文件：**
- `index.html` - 前端用户界面和交互逻辑
- `api/check_coupon.js` - 兑换券验证API
- `api/redeem.js` - 兑换执行API
- `package.json` - 项目依赖配置

## 系统流程

1. **验证阶段：** 用户输入兑换券码 → 调用 `/api/check_coupon` → 查询数据库验证 → 返回产品信息
2. **兑换阶段：** 填写收货信息 → 调用 `/api/redeem` → 执行存储过程 `redeem_coupon` → 完成兑换

## 数据库集成

**必需的环境变量：**
- `SUPABASE_URL` - Supabase项目URL
- `SUPABASE_SERVICE_KEY` - Supabase服务角色密钥

**数据库表结构：**
- `coupons` 表包含：`code`、`is_redeemed`、`product_name` 字段
- 存储过程：`redeem_coupon` 处理核心兑换逻辑

## 开发和部署

**本地开发：**
```bash
# 安装依赖
npm install

# 使用 Vercel CLI 本地开发
vercel dev
```

**部署到 Vercel：**
```bash
# 部署到 Vercel
vercel --prod

# 设置环境变量
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
```

## API 端点

**POST /api/check_coupon**
```json
请求: { "code": "COUPON_CODE" }
响应: { "success": true, "code": "VALID_CODE", "productName": "产品名称" }
```

**POST /api/redeem**
```json
请求: { "code": "COUPON_CODE", "name": "姓名", "phone": "电话", "address": "地址" }
响应: { "success": true, "message": "兑换成功" }
```

## 关键实现细节

**安全特性：**
- 使用 Supabase service_role 密钥进行管理员操作
- 前端状态管理防止重复验证
- 输入验证和错误处理

**前端状态管理：**
- `verifiedCouponCode` - 存储已验证的兑换券码
- `verifiedProductName` - 存储产品名称
- 渐进式表单显示逻辑

**错误处理：**
- 兑换券不存在或已使用的处理
- 网络请求失败的友好提示
- 数据库操作异常的捕获和处理