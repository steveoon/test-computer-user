import React from 'react';

interface Props {
  data: any; // 故意使用 any 类型 - 触发重新审查
  items: any[]; // 另一个 any 类型
}

// 组件名称不符合规范
export const test_component = ({ data, items }: Props) => {
  console.log(data); // 故意留下 console.log
  console.error('Debug info:', items); // 另一个 console
  
  // 不安全的数组索引访问
  const firstItem = items[0].name;
  
  // SQL 注入风险示例
  const query = `SELECT * FROM users WHERE id = ${data.userId}`;
  
  return (
    <>
      {/* XSS 风险 */}
      <div dangerouslySetInnerHTML={{ __html: data.html }} />
      
      {/* 性能问题：在渲染中创建新函数 */}
      <button onClick={() => {
        fetch('/api/data')
          .then(res => res.json())
          .then(data => console.log(data));
      }}>
        Click me
      </button>
      
      {/* 缺少 key 属性 */}
      {items.map(item => (
        <div>{item.name}</div>
      ))}
    </>
  );
};

// 未使用的变量
const unusedVariable = 'This is never used';

// 复杂度过高的函数
function complexFunction(a: number, b: number, c: number, d: number) {
  if (a > 0) {
    if (b > 0) {
      if (c > 0) {
        if (d > 0) {
          return a + b + c + d;
        } else {
          return a + b + c;
        }
      } else {
        return a + b;
      }
    } else {
      return a;
    }
  } else {
    return 0;
  }
}