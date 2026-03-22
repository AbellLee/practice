# 移动端适配快速参考

## 断点速查

```css
/* 小屏幕设备（手机） */
@media (max-width: 768px) { }

/* 超小屏幕设备（小手机） */
@media (max-width: 480px) { }

/* 横屏模式 */
@media (max-height: 500px) and (orientation: landscape) { }
```

## 触摸尺寸速查

```css
/* 最小触摸尺寸 */
min-height: 44px;
min-width: 44px;

/* 输入框字体（防止 iOS 缩放） */
font-size: 16px;

/* 按钮内边距 */
padding: 8px 16px;
```

## React 组件模式

```typescript
// 移动端检测
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth < 768);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

// 响应式属性
<Button 
  size={isMobile ? 'large' : 'middle'}
  block={isMobile}
>
  {isMobile ? '移动端文本' : null}
</Button>

<Col xs={24} sm={12} md={8}>
  {/* 响应式栅格 */}
</Col>
```

## Ant Design 组件尺寸

```typescript
// Button
size="small" | "middle" | "large"

// Input
size="small" | "middle" | "large"
style={{ minHeight: 44 }}

// Table
size="small" | "middle"
scroll={{ x: 600 }}

// Card
size="small" | "default"

// Modal
width={isMobile ? '90vw' : 800}
style={{ top: isMobile ? 20 : 100 }}
bodyStyle={{ maxHeight: isMobile ? '70vh' : 'none' }}
```

## 响应式布局

```typescript
// 统计卡片
<Row gutter={[12, 12]}>
  <Col xs={24} sm={12} md={8}>
    <Card><Statistic /></Card>
  </Col>
</Row>

// 筛选器
<Row gutter={[12, 12]}>
  <Col xs={24} sm={12} md={6}>
    <Input />
  </Col>
  <Col xs={24} sm={24} md={4}>
    <Button block={isMobile} />
  </Col>
</Row>
```

## 表格优化

```typescript
<div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
  <Table
    scroll={{ x: isMobile ? 600 : undefined }}
    size={isMobile ? 'small' : 'middle'}
  />
</div>
```

## 分页优化

```typescript
<Pagination
  showSizeChanger={!isMobile}
  showQuickJumper={!isMobile}
  size={isMobile ? 'small' : 'default'}
/>
```

## 常用样式类

```css
/* 触摸优化 */
touch-action: manipulation;
-webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);

/* 防止选中 */
user-select: none;
-webkit-user-select: none;

/* 平滑滚动 */
scroll-behavior: smooth;
-webkit-overflow-scrolling: touch;

/* 防止图片拖动 */
user-drag: none;
-webkit-user-drag: none;
```

## 布局组件

```typescript
// Header
<Header
  style={{
    height: isMobile ? 56 : 64,
    padding: isMobile ? '0 12px' : '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  }}
/>

// Content
<Content
  style={{
    margin: isMobile ? 8 : 24,
    padding: isMobile ? 12 : 24,
    maxHeight: 'calc(100vh - 100px)',
  }}
/>
```

## Drawer 组件

```typescript
<Drawer
  placement="left"
  width={280}
  styles={{ 
    body: { padding: 0 },
    header: { display: 'none' }
  }}
>
  {/* 菜单内容 */}
</Drawer>
```

## 表单优化

```typescript
<Form.Item
  style={{ marginBottom: 16 }}
>
  <Input
    size="large"
    style={{ minHeight: 44 }}
  />
</Form.Item>

<Button
  type="primary"
  size="large"
  block={isMobile}
  style={{ minHeight: 48 }}
/>
```

## 测试命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 调试技巧

1. **Chrome DevTools**: Ctrl+Shift+M 切换设备模式
2. **Safari**: 开发 > 模拟器 > 选择设备
3. **真实设备**: 使用网络地址访问
4. **响应式测试**: https://responsivedesignchecker.com/

## 性能检查

- [ ] Lighthouse 分数 > 90
- [ ] 首次内容绘制 < 1.5s
- [ ] 可交互时间 < 3s
- [ ] 无布局偏移

## 常见问题

### Q: 输入框在 iOS 上自动放大？
A: 设置 `font-size: 16px`

### Q: 按钮点击区域太小？
A: 设置 `min-height: 44px; min-width: 44px`

### Q: 表格在移动端显示不全？
A: 使用 `overflowX: 'auto'` 和 `scroll={{ x: 600 }}`

### Q: 侧边栏在移动端占用空间？
A: 使用 Drawer 代替 Sider

### Q: 分页器在移动端太宽？
A: 隐藏 `showSizeChanger` 和 `showQuickJumper`

## 资源链接

- [Ant Design 响应式](https://ant.design/components/layout-cn)
- [MDN 响应式设计](https://developer.mozilla.org/zh-CN/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Google 移动端最佳实践](https://developers.google.com/web/fundamentals/design-and-ux/responsive)
