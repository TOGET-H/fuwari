---
title: HTML-CSS八股
published: 2026-06-05
description: ""
image: assest/images/封面/HTML.png
tags:
  - 前端
  - 八股
category: 学习
draft: false
lang: ""
---
# 元素水平垂直居中的方法有哪些

实现元素水平垂直居中的方式：

- 利用定位+margin:auto
- 利用定位+margin:负值
- 利用定位+transform
- table布局
- flex布局
- grid布局

水平居中

- 行内元素可设置：text-align: center
- flex布局设置父元素：display: flex; justify-content: center

垂直居中

- 单行文本父元素确认高度：height === line-height
- 多行文本父元素确认高度：display: table-cell; vertical-align: middle

### [#](https://vue3js.cn/interview/css/center.html#%E5%9D%97%E7%BA%A7%E5%85%83%E7%B4%A0%E5%B1%85%E4%B8%AD%E5%B8%83%E5%B1%80)块级元素居中布局

水平居中

- 定宽: margin: 0 auto
- 绝对定位+left:50%+margin:负自身一半

垂直居中

- position: absolute设置left、top、margin-left、margin-top(定高)
- display: table-cell
- transform: translate(x, y)
- flex(不定高，不定宽)
- grid(不定高，不定宽)，兼容性相对比较差

# 怎么理解回流跟重绘

- 回流：布局引擎会根据各种样式计算每个盒子在页面上的大小与位置
- 重绘：当计算好盒模型的位置、大小及其他属性后，浏览器根据每个盒子特性进行绘制

# 响应式设计

实现响应式布局的方式有如下：

- 媒体查询
- 百分比
- vw/vh
- rem

### 使用`@Media`查询，可以针对不同的媒体类型定义不同的样式，如：

```
@media screen and (max-width: 1920px) { ... }
```

###   
vw/vh

`vw`表示相对于视图窗口的宽度，`vh`表示相对于视图窗口高度。 任意层级元素，在使用`vw`单位的情况下，`1vw`都等于视图宽度的百分之一

# CSS所有选择器及其优先级

通用选择器：*

id选择器：#header{}

class选择器：.header{}

元素选择器：div{}

子选择器：ul > li{}

后代选择器：div p{}

伪类选择器：:hover、::selection、.action、:first-child、:last-child、:first-of-type、:last-of-type、:nth-of-type(n)、:nth-of-last-type(n)等,例如a:hover{}

伪元素选择器: :after、:before等,例如：li:after

属性选择器: input[type="text"]

  
  

!important > 作为style属性写在元素标签上的内联样式 >id选择器>类选择器>伪类选择器>属性选择器>标签选择器> 通配符选择器（* 应少用）>浏览器自定义；

# CSS伪类和伪元素有哪些，它们的区别和实际应用

**伪类的例子有：**

:hover

:active

:first-child

:visited

等。

**伪元素的例子有：**

:first-line

:first-letter

:after

:before

**伪类和伪元素的根本区别在于：**

**它们是否创造了新的元素(抽象)**。从我们模仿其意义的角度来看，如果需要添加新元素加以标识的，就是伪元素，反之，如果只需要在既有元素上添加类别的，就是伪类。

伪元素在一个选择器里只能出现一次，并且只能出现在末尾;

伪类则是像真正的类一样发挥着类的作用，没有数量上的限制，只要不是相互排斥的伪类，也可以同时使用在相同的元素上。

# CSS几种定位的规则、定位参照物、对文档流的影响

static定位

float定位

相对绝对定位

# 写出尽可能多的水平垂直居中的方案并对比它们的优缺点

行内元素水平居中

父元素是块级元素直接设置text-align：center

块级元素水平居中（有宽度）：

谁居中谁设置margin: 0 auto;

首先设置父元素为相对定位，再设置子元素为绝对定位，设置子元素的**left:50%**，即让子元素的左上角水平居中；

块级元素水平居中（无宽度）：

- 默认子元素的宽度和父元素一样，这时需要设置子元素为display: inline-block; 或 display: inline;即将其转换成行内块级/行内元素，给父元素设置 text-align: center;
- 首先设置父元素为相对定位，再设置子元素为绝对定位，设置子元素的**left:50%**，即让子元素的左上角水平居中；

  
**使用flexbox布局实现水平居中（宽度定不定都可以）:**

使用flexbox布局，只需要给待处理的块状元素的父元素添加属性 display: flex; justify-content: center;

  
  

# BFC的布局规则

BFC直译为**块级格式化上下文**，它是一个独立的渲染区域，只有Block-level box参与，它规定了**内部的Block-level Box**如何布局，并且与外部毫不相干

### BFC的作用及原理：

#### 1. 自适应两栏布局

#### 2. 清除内部浮动

#### 3. 防止垂直 margin 重叠

- 内部的盒子会在垂直方向上一个接一个的放置
- 对于同一个BFC的俩个相邻的盒子的margin会发生重叠，与方向无关。
- 每个元素的左外边距与包含块的左边界相接触（从左到右），即使浮动元素也是如此
- BFC的区域不会与float的元素区域重叠
- 计算BFC的高度时，浮动子元素也参与计算
- BFC就是页面上的一个隔离的独立容器，容器里面的子元素不会影响到外面的元素，反之亦然

# CSS如何配置按需加载

使用require.js按需加载CSS

# css中，有哪些方式可以隐藏页面元素？区别?

- display:none
- visibility:hidden
- opacity:0
- 设置height、width模型属性为0
- position:absolute
- clip-path

# 如何实现单行／多行文本溢出的省略样式

- text-overflow：规定当文本溢出时，显示省略符号来代表被修剪的文本
- white-space：设置文字在一行显示，不能换行
- overflow：文字长度超出限定宽度，则隐藏超出的内容