---
title: MongoDB 的总结
published: 2026-06-08
description: "从文档模型、CRUD、BSON、索引、WiredTiger、Journal、Checkpoint 到分片，对 MongoDB 做一次系统复盘"
image: ""
tags:
  - MongoDB
  - 数据库
  - 后端
category: 学习
draft: false
lang: ""
---

最近复习 MongoDB，发现它和 MySQL 最大的区别不是“语法不一样”，而是两者的数据组织方式、查询思路和存储模型都有明显差异。MySQL 更强调表结构、行列、关系和事务；MongoDB 更强调文档、集合、灵活结构和面向业务对象的数据组织。

这篇文章按自己的理解做一次总结，重点放在：MongoDB 为什么使用文档模型、常见 CRUD 怎么写、BSON 是什么、索引如何工作，以及 WiredTiger、Journal、Checkpoint、分片这些底层机制大概解决什么问题。

## MongoDB 和 MySQL 的数据模型区别

MySQL 是典型的关系型数据库，数据通常放在一张张表里。表结构由列定义，每一行数据都要遵守相同的字段结构。

比如用户表：

| id | name | age | email |
|---|---|---|---|
| 1 | Tom | 20 | tom@example.com |

这种结构的优点是规范、清晰，适合强关系、强约束、事务要求高的业务。但问题是，当业务字段变化频繁时，表结构调整会比较麻烦。如果某些字段不是每条数据都有，也可能产生很多空字段。

MongoDB 则使用“集合 + 文档”的结构：

- 数据库：database
- 集合：collection，类似 MySQL 的表
- 文档：document，类似 MySQL 的一行数据
- 字段：field，类似 MySQL 的列

MongoDB 的文档结构更灵活，同一个集合里的不同文档不要求字段完全一致。

```js
{
  _id: ObjectId("..."),
  name: "Tom",
  age: 20,
  skills: ["JavaScript", "Vue", "Node.js"],
  profile: {
    city: "Hangzhou",
    school: "ZJNU"
  }
}
```

这也是文档数据库的核心优势：可以把一个业务对象相关的数据放在同一个文档里，减少多表 join，也更贴近后端接口返回的 JSON 结构。

## 为什么 MongoDB 放弃固定列结构

在 MySQL 中，表结构是固定的。如果用户信息里有些字段不是所有用户都有，比如 `github`、`blog`、`company`，仍然需要在表里预留列，或者拆表维护。

MongoDB 不强制每个文档字段完全一致，所以可以这样存：

```js
{
  name: "A",
  role: "student"
}

{
  name: "B",
  role: "developer",
  github: "https://github.com/xxx",
  blog: "https://example.com"
}
```

这种设计适合字段变化快、结构不完全固定的场景，比如内容系统、日志系统、用户画像、配置数据、AI 应用中的对话记录等。

但灵活不代表可以随便设计。MongoDB 只是把 schema 约束从数据库层部分转移到了应用层。如果应用层不做好字段规范，后期同样会出现数据混乱的问题。

## MongoDB 的基本 CRUD

MongoDB 的语法更接近 JavaScript 对象，查询条件通常用 JSON 风格表达。

### 新增

```js
db.users.insertOne({
  name: "Tom",
  age: 20,
  tags: ["frontend", "vue"]
})
```

批量新增：

```js
db.users.insertMany([
  { name: "A", age: 18 },
  { name: "B", age: 22 }
])
```

### 查询

查询所有：

```js
db.users.find()
```

按条件查询：

```js
db.users.find({ age: 20 })
```

使用比较操作符：

```js
db.users.find({
  age: { $gte: 18, $lte: 25 }
})
```

查询数组字段：

```js
db.users.find({
  tags: "vue"
})
```

只返回部分字段：

```js
db.users.find(
  { age: { $gte: 18 } },
  { name: 1, age: 1, _id: 0 }
)
```

### 更新

MongoDB 更新时一般使用更新操作符，而不是直接覆盖整个文档。

```js
db.users.updateOne(
  { name: "Tom" },
  { $set: { age: 21 } }
)
```

数组追加：

```js
db.users.updateOne(
  { name: "Tom" },
  { $push: { tags: "node" } }
)
```

字段自增：

```js
db.users.updateOne(
  { name: "Tom" },
  { $inc: { age: 1 } }
)
```

如果不用 `$set`，而是直接传新对象，可能会覆盖整个文档，这是初学时很容易踩的坑。

### 删除

```js
db.users.deleteOne({ name: "Tom" })
```

批量删除：

```js
db.users.deleteMany({ age: { $lt: 18 } })
```

## 查询语句和更新语句的区别

MongoDB 的查询语句主要描述“找哪些文档”，更新语句则分为两部分：

```js
db.collection.updateOne(查询条件, 更新操作)
```

比如：

```js
db.users.updateOne(
  { name: "Tom" },
  { $set: { age: 21 } }
)
```

第一部分 `{ name: "Tom" }` 是查询条件，用来定位文档；第二部分 `{ $set: { age: 21 } }` 是更新操作，用来描述怎么改。

常见更新操作符：

| 操作符 | 作用 |
|---|---|
| `$set` | 设置字段 |
| `$unset` | 删除字段 |
| `$inc` | 数值自增或自减 |
| `$push` | 向数组追加元素 |
| `$pull` | 从数组移除元素 |
| `$addToSet` | 向数组添加元素，但避免重复 |

这个设计和 SQL 的 `UPDATE table SET ... WHERE ...` 思路类似，只是表达方式更接近对象结构。

## BSON 是什么

MongoDB 存储的不是普通 JSON，而是 BSON。

BSON 可以理解为 Binary JSON，也就是二进制形式的 JSON-like 数据。它保留了 JSON 的文档结构，但扩展了更多数据类型，并且更适合数据库存储和网络传输。

JSON 常见类型比较少，比如 string、number、boolean、array、object、null。BSON 支持更多类型，例如：

- ObjectId
- Date
- Binary
- Decimal128
- Int32 / Int64

MongoDB 默认的 `_id` 通常就是 `ObjectId` 类型。

```js
{
  _id: ObjectId("665f..."),
  createdAt: ISODate("2026-06-08T00:00:00Z")
}
```

## BSON 的持久化

MongoDB 在内存中处理文档，最终会把数据以 BSON 的形式写入磁盘。BSON 的持久化可以理解为：把文档对象序列化成二进制格式，再交给存储引擎管理。

这个过程背后涉及几个关键点：

1. 文档需要被编码成 BSON
2. 存储引擎决定数据如何落盘
3. 写入前通常会先进入内存结构
4. 为了保证崩溃恢复，还需要 Journal
5. 最终通过 Checkpoint 等机制把数据稳定写入数据文件

所以 MongoDB 的写入不是简单地“直接把 JSON 写进文件”，而是经过 BSON 编码、内存缓冲、日志和存储引擎管理。

## MongoDB 的索引

没有索引时，MongoDB 查询需要扫描集合中的大量文档，这叫 collection scan。数据量小的时候感觉不明显，数据量大后性能会明显下降。

创建索引：

```js
db.users.createIndex({ name: 1 })
```

其中 `1` 表示升序索引，`-1` 表示降序索引。

使用索引后，MongoDB 可以先在索引结构中定位，再找到对应文档，减少扫描范围。

常见索引类型：

- 单字段索引
- 复合索引
- 唯一索引
- 文本索引
- TTL 索引

复合索引示例：

```js
db.users.createIndex({ age: 1, name: 1 })
```

复合索引需要注意最左前缀原则。比如 `{ age: 1, name: 1 }` 更适合按 `age` 或 `age + name` 查询，如果只按 `name` 查询，索引利用效果可能不好。

## B+ 树索引

MongoDB 的 WiredTiger 存储引擎中，索引通常使用 B+ 树这一类适合磁盘存储的数据结构。

B+ 树的特点是：

- 数据有序
- 树高度较低
- 每个节点可以存多个 key
- 适合范围查询
- 磁盘 IO 次数相对可控

比如查询：

```js
db.users.find({ age: { $gte: 18, $lte: 25 } })
```

如果 `age` 上有索引，B+ 树可以先定位到 `18` 附近，再顺序扫描到 `25`，比全表扫描高效很多。

但索引不是越多越好。索引会提升查询性能，也会增加写入成本。因为插入、更新、删除文档时，相关索引也要同步维护。

## 并发写冲突

MongoDB 支持并发读写，但并发写同一份数据时仍然可能产生冲突。

例如两个请求同时更新同一个用户余额：

```js
// 请求 A
db.accounts.updateOne({ name: "Tom" }, { $inc: { balance: -100 } })

// 请求 B
db.accounts.updateOne({ name: "Tom" }, { $inc: { balance: -200 } })
```

如果使用 `$inc` 这种原子操作，MongoDB 可以在单文档层面保证更新的原子性。但如果应用层先查出来再计算，最后 `$set` 回去，就可能出现覆盖问题。

不推荐：

```js
const user = db.accounts.findOne({ name: "Tom" })
const newBalance = user.balance - 100
db.accounts.updateOne({ name: "Tom" }, { $set: { balance: newBalance } })
```

更推荐：

```js
db.accounts.updateOne(
  { name: "Tom", balance: { $gte: 100 } },
  { $inc: { balance: -100 } }
)
```

这样可以把条件判断和更新放在一次原子操作里，减少并发问题。

## MVCC：写时复制的理解

你大纲里提到“写时复制”，可以放到 MVCC 的角度理解。WiredTiger 使用多版本并发控制，让读写尽量不要互相阻塞。

简单理解：

- 读操作可以看到某个时间点上的稳定版本
- 写操作生成新的数据版本
- 旧版本不会立刻消失，因为可能还有读操作需要它
- 当旧版本不再需要时，再由后台机制清理

这和“写时复制”的思想有相似之处：更新不是简单粗暴地覆盖读者正在看的内容，而是通过版本机制让读写并发更平滑。

好处是读写并发能力更强；代价是需要管理多个版本，也会带来额外存储和清理成本。

## Journal Buffer

Journal 是 MongoDB 用来保证崩溃恢复能力的重要机制。

写入数据时，如果只改内存，还没来得及落盘，服务器突然宕机，就可能丢数据。Journal 的作用就是先记录“我要做什么修改”，这样即使崩溃，也可以通过日志恢复。

大致流程：

1. 客户端发起写请求
2. MongoDB 修改内存中的数据结构
3. 写入 Journal Buffer
4. Journal 按一定策略刷到磁盘
5. 数据文件后续再通过 Checkpoint 落盘

Journal Buffer 可以理解为 Journal 写入磁盘前的内存缓冲区。它的存在是为了减少频繁磁盘 IO，提高写入性能。

## Checkpoint 机制

Checkpoint 可以理解为“把内存中的脏数据定期同步到磁盘数据文件”的机制。

Journal 解决的是崩溃恢复问题，但真正的数据文件也需要不断更新。Checkpoint 的作用是把某一时刻的内存数据状态稳定写入磁盘，形成一个一致性检查点。

简化理解：

- Journal：记录最近做过哪些修改，方便崩溃后重放
- Checkpoint：把当前稳定状态写入数据文件，减少恢复时需要重放的日志量

如果没有 Checkpoint，系统崩溃后可能要从很早的日志开始恢复，恢复成本会越来越高。

## WiredTiger 存储引擎

WiredTiger 是 MongoDB 默认使用的存储引擎。它负责数据在内存和磁盘之间如何组织、读取、写入和压缩。

WiredTiger 的几个关键词：

- 文档级并发控制
- MVCC
- B+ 树索引
- 数据压缩
- Journal
- Checkpoint

早期数据库如果锁粒度太大，并发写入容易互相阻塞。WiredTiger 支持更细粒度的并发控制，能够提升多请求同时访问时的性能。

从整体上看，MongoDB 上层负责查询语义和文档模型，WiredTiger 负责底层存储、缓存、索引、日志和落盘。

## Server 层和存储引擎层

MongoDB 可以粗略分为两层：

1. Server 层
2. Storage Engine 层

Server 层负责：

- 接收客户端请求
- 解析查询语句
- 权限校验
- 查询优化
- 执行计划生成
- 聚合管道处理
- 分片路由等

Storage Engine 层负责：

- 数据读写
- 索引维护
- 缓存管理
- Journal
- Checkpoint
- 数据压缩

这样分层的好处是职责更清晰。我们平时写的 `find`、`updateOne`、`aggregate` 属于上层语义，真正怎么从磁盘读数据、怎么维护索引，是存储引擎负责的。

## 分片

当单机存储或写入能力不够时，MongoDB 可以通过分片进行水平扩展。

分片的核心思想是：把一个大集合的数据按某个规则拆到多台机器上。

MongoDB 分片集群里常见角色：

- shard：真正存储数据的分片节点
- mongos：查询路由，客户端通常连接它
- config server：保存分片元数据

比如按用户 ID 做分片：

```js
sh.shardCollection("app.users", { userId: 1 })
```

选择分片键很重要。如果分片键设计不好，可能导致数据倾斜，比如大部分请求都打到同一个 shard，扩展效果就会很差。

好的分片键通常需要：

- 基数高
- 分布均匀
- 查询中经常出现
- 不容易造成热点写入

## MongoDB 适合什么场景

MongoDB 比较适合：

- 字段结构变化快的业务
- JSON 数据天然较多的系统
- 内容管理系统
- 日志和埋点数据
- 用户画像
- AI 对话记录
- 配置中心
- 对象结构复杂但关系不强的数据

不太适合：

- 强事务要求特别高的核心金融场景
- 复杂 join 很多的强关系模型
- schema 极其稳定且强约束很多的业务

当然，MongoDB 也支持事务，但如果业务天然是强关系型，用关系型数据库通常更直接。

## 面试时可以这样总结

如果面试被问到 MongoDB 和 MySQL 的区别，可以这样回答：

> MySQL 是关系型数据库，核心是表、行、列和关系约束，适合结构稳定、关系复杂、事务要求高的业务。MongoDB 是文档型数据库，核心是集合和 BSON 文档，字段结构更灵活，适合 JSON 数据多、字段变化快、对象结构复杂但关系不强的场景。MongoDB 通过索引提升查询性能，底层默认使用 WiredTiger 存储引擎，支持 MVCC、Journal、Checkpoint 和文档级并发控制。

如果被问到 MongoDB 写入可靠性，可以这样回答：

> MongoDB 写入时不会只是简单改内存。数据会经过存储引擎管理，先写入内存结构，同时通过 Journal 记录修改以支持崩溃恢复，再由 Checkpoint 周期性把稳定状态刷入数据文件。Journal 更偏恢复日志，Checkpoint 更偏稳定落盘点。

## 总结

MongoDB 的核心不是“没有表”，而是用文档模型组织数据。它牺牲了一部分固定 schema 带来的强约束，换来了更灵活的数据表达方式。

学习 MongoDB 时，不能只记 CRUD 语法，还要理解它背后的几个关键词：

- 文档模型
- BSON
- 索引
- 原子更新
- MVCC
- WiredTiger
- Journal
- Checkpoint
- 分片

这些机制串起来之后，才能真正理解 MongoDB 为什么适合一些现代 Web 应用和 AI 应用场景。
