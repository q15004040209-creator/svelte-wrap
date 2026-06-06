/**
 * Svelte-Wrap Demo
 * 展示 Svelte 核心概念和使用方式的 JavaScript 示例
 * 
 * 注意：Svelte 是编译时框架，真正的 Svelte 组件是 .svelte 文件，
 * 这里用 JavaScript 模拟核心概念，帮助理解响应式原理。
 */

/**
 * ============================================================
 * 1. REACTIVE STATE (响应式状态)
 * ============================================================
 * 
 * 在 Svelte 中，let 声明的变量是响应式的。
 * 编译时 Svelte 会自动追踪依赖并生成更新代码。
 */

// 模拟 Svelte 的响应式状态
function createReactiveState(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  return {
    get() {
      return value;
    },
    set(newValue) {
      const changed = value !== newValue;
      value = newValue;
      if (changed) {
        subscribers.forEach(fn => fn(value));
      }
    },
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    }
  };
}

// 使用示例
const count = createReactiveState(0);
count.subscribe(val => console.log(`Count changed: ${val}`));
count.set(1); // Count changed: 1
count.set(2); // Count changed: 2


/**
 * ============================================================
 * 2. REACTIVE DECLARATIONS ($: 语法模拟)
 * ============================================================
 * 
 * Svelte 的 $: 语法自动追踪依赖并重新计算。
 * 编译时会分析依赖关系，生成正确的更新顺序。
 */

function reactive(deps, fn) {
  const results = [];
  let prevDeps = [];

  function update() {
    const newResults = deps.map((dep, i) => {
      if (typeof dep.subscribe === 'function') {
        return dep.get();
      }
      return dep;
    });
    
    const changed = !prevDeps.every((v, i) => v === newResults[i]);
    if (changed) {
      prevDeps = [...newResults];
      results[i] = fn(...newResults);
    }
    return results[0];
  }

  return { update, get: () => results[0] };
}

// 示例：自动计算总和
const a = createReactiveState(1);
const b = createReactiveState(2);
const sum = reactive([a, b], (a, b) => a + b);
console.log(`Sum: ${sum.get()}`); // Sum: 3
a.set(5);
console.log(`Sum after update: ${sum.get()}`); // Sum after update: 7


/**
 * ============================================================
 * 3. COMPONENT CLASS (组件类模拟)
 * ============================================================
 * 
 * Svelte 组件在编译后是普通的 JavaScript 类。
 * 这里模拟组件的基本结构和生命周期。
 */

class SvelteComponent {
  constructor() {
    this.props = {};
    this.state = {};
    this.refs = {};
    this.subscriptions = [];
  }

  // 组件挂载前
  beforeMount() {}

  // 组件挂载后
  onMount() {}

  // 组件卸载前
  beforeDestroy() {
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions = [];
  }

  // 更新 props
  $set(newProps) {
    this.props = { ...this.props, ...newProps };
    this.invalidate();
  }

  // 触发更新（模拟）
  invalidate() {
    // 在真实 Svelte 中，这会触发编译后的 update 函数
  }
}

// 示例：计数器组件
class Counter extends SvelteComponent {
  constructor() {
    super();
    this.state.count = 0;
  }

  increment() {
    this.state.count++;
    this.invalidate();
  }

  decrement() {
    this.state.count--;
    this.invalidate();
  }
}

const counter = new Counter();
counter.beforeMount();
console.log(`Initial count: ${counter.state.count}`); // Initial count: 0
counter.increment();
counter.increment();
console.log(`After increments: ${counter.state.count}`); // After increments: 2
counter.decrement();
console.log(`After decrement: ${counter.state.count}`); // After decrement: 1
counter.beforeDestroy();


/**
 * ============================================================
 * 4. STORE (状态管理)
 * ============================================================
 * 
 * Svelte 的 writable/-readable/derived stores
 * 提供了一种跨组件共享状态的方式。
 */

// Writable Store
function writable(initialValue) {
  const value = createReactiveState(initialValue);
  const subscribe = (fn) => value.subscribe(fn);
  
  return {
    subscribe,
    set: (newValue) => value.set(newValue),
    update: (fn) => value.set(fn(value.get())),
    get: () => value.get()
  };
}

// Derived Store
function derived(stores, fn) {
  const { subscribe } = writable(undefined);
  
  let unsubscribe;
  const result = {
    subscribe(run) {
      const update = () => {
        const inputs = Array.isArray(stores) 
          ? stores.map(s => s.get()) 
          : [stores.get()];
        const value = fn(...inputs);
        result._value = value;
      };
      
      unsubscribe = Array.isArray(stores)
        ? stores.map(s => s.subscribe(update))
        : stores.subscribe(update);
      
      return () => {
        unsubscribe.forEach(fn => fn());
      };
    },
    get() {
      return result._value;
    }
  };
  
  return result;
}

// 示例
const name = writable('World');
const greeting = derived(name, n => `Hello, ${n}!`);

const unsubName = name.subscribe(n => console.log(`Name: ${n}`));
const unsubGreeting = greeting.subscribe(g => console.log(`Greeting: ${g}`));

name.set('Svelte');
name.set('Developer');
// 输出: Name: Svelte, Greeting: Hello, Svelte!
//      Name: Developer, Greeting: Hello, Developer!

unsubName();
unsubGreeting();


/**
 * ============================================================
 * 5. LIFECYCLE HOOKS (生命周期钩子)
 * ============================================================
 * 
 * Svelte 组件提供的生命周期钩子。
 */

// 生命周期钩子映射
const LIFECYCLE = {
  onMount: [],
  beforeUpdate: [],
  afterUpdate: [],
  beforeDestroy: [],
  onDestroy: []
};

function onMount(fn) {
  LIFECYCLE.onMount.push(fn);
}

function onDestroy(fn) {
  LIFECYCLE.onDestroy.push(fn);
}

function beforeUpdate(fn) {
  LIFECYCLE.beforeUpdate.push(fn);
}

function afterUpdate(fn) {
  LIFECYCLE.afterUpdate.push(fn);
}

// 使用示例
onMount(() => {
  console.log('Component mounted!');
  // 执行 DOM 操作、设置定时器等
});

onDestroy(() => {
  console.log('Component destroyed!');
  // 清理定时器、取消订阅等
});

beforeUpdate(() => {
  console.log('Before update!');
});

afterUpdate(() => {
  console.log('After update!');
});


/**
 * ============================================================
 * 6. TRANSITIONS (过渡动画)
 * ============================================================
 * 
 * Svelte 内置的过渡系统。
 * 编译时会根据元素类型生成优化的过渡代码。
 */

// 基础过渡效果
const TRANSITIONS = {
  fade: (node, { duration = 300, delay = 0 } = {}) => {
    return {
      duration,
      delay,
      css: t => `opacity: ${t}`
    };
  },
  
  fly: (node, { duration = 300, y = 0, x = 0 } = {}) => {
    return {
      duration,
      css: t => {
        const eased = t < 0.5 
          ? 2 * t * t 
          : 1 - Math.pow(-2 * t + 2, 2) / 2;
        return `transform: translate(${x * (1 - eased)}px, ${y * (1 - eased)}px)`;
      }
    };
  },
  
  scale: (node, { duration = 300, start = 0 } = {}) => {
    return {
      duration,
      css: t => `transform: scale(${start + t * (1 - start)})`
    };
  }
};

// 示例：淡入效果
function fadeIn(node, options = {}) {
  const animation = TRANSITIONS.fade(node, options);
  console.log(`Fade in: duration=${animation.duration}ms`);
  return animation;
}

// 示例：飞入效果
function flyIn(node, options = {}) {
  const animation = TRANSITIONS.fly(node, { y: -20, ...options });
  console.log(`Fly in: y=${options.y || -20}px, duration=${animation.duration}ms`);
  return animation;
}

console.log('\n=== Svelte Wrap Demo Complete ===');
console.log('This demo simulates Svelte core concepts.');
console.log('For real Svelte development, use .svelte files with the Svelte compiler.');