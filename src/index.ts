/// EXERCISE 1 - Property Validation Proxy

interface UserSchema {
  name: string;
  age: number;
  isActive: boolean;
}

const createValidatedProxy = <T extends object>(defaultValues: T): T => {
  return new Proxy(defaultValues, {
    get(obj, prop) {
      if (prop in obj) {
        return obj[prop as keyof typeof obj];
      }
      throw new Error(`Property ${String(prop)} does not exist on the object`);
    },

    set(obj, prop, value) {
      if (!(prop in obj)) {
        throw new Error(
          `Property ${String(prop)} does not exist on the schema`
        );
      }

      const currentValue = obj[prop as keyof typeof obj];

      if (typeof value !== typeof currentValue) {
        throw new Error(
          `Property ${String(prop)} must be of type ${typeof currentValue}, got ${typeof value}`
        );
      }

      obj[prop as keyof typeof obj] = value;

      return true;
    },
  });
};

const validatedUser = createValidatedProxy<UserSchema>({
  name: "",
  age: 0,
  isActive: false,
});

console.log("=== Property Validation Test ===");
try {
  validatedUser.name = "Alice"; // ✓ Valid
  validatedUser.age = 25; // ✓ Valid
  console.log("Valid assignments worked!");

  validatedUser.name = 123 as any; // ✗ Wrong type
} catch (error) {
  console.log("Type error caught:", (error as Error).message);
}

try {
  (validatedUser as any).invalidProp = "test"; // ✗ Property doesn't exist
} catch (error) {
  console.log("Schema error caught:", (error as Error).message);
}

//// EXERCISE 2 - Array with negative indexing

const getProxiedArray = <T>(arr: T[]) => {
  return new Proxy(arr, {
    get(array, prop) {
      if (typeof prop !== "string" || isNaN(Number(prop))) {
        return array[prop as keyof typeof array];
      }

      const index = Number(prop);

      return array.at(index);
    },
  });
};

const arr = [1, 2, 3, 4, 5];
const proxiedArray = getProxiedArray(arr);

console.log("\n=== Negative Indexing Test ===");
console.log("proxiedArray[-1]:", proxiedArray[-1]); // 5
console.log("proxiedArray[-2]:", proxiedArray[-2]); // 4
console.log("proxiedArray[0]:", proxiedArray[0]); // 1 (your version would break here)
console.log("proxiedArray.length:", proxiedArray.length); // 5
console.log("proxiedArray.push(6):", proxiedArray.push(6)); // Still works!
console.log("proxiedArray[-1]:", proxiedArray[-1]); // Now 6

//// EXERCISE 3 - fn call interceptor

const createLoggedObj = <TObj extends object>(obj: TObj) => {
  return new Proxy(obj, {
    get(obj, prop) {
      const val = obj[prop as keyof typeof obj];

      if (typeof val === "function") {
        return (...args: unknown[]) => {
          console.log(`Calling ${String(prop)} with args: [${args}]`);
          return val.apply(obj, args); // Don't forget to return!
        };
      }

      return val; // Return non-function properties
    },
  });
};

const calculator = {
  add: (a: number, b: number) => a + b,
  multiply: (a: number, b: number) => a * b,
};

const loggedCalculator = createLoggedObj(calculator);

console.log("\n=== Function Call Interceptor Test ===");
console.log("Result:", loggedCalculator.add(2, 3)); // Should log call and return 5
console.log("Result:", loggedCalculator.multiply(4, 5)); // Should log call and return 20

//// EXERCISE 4 - Method Chaining with Proxies

class ChainableString {
  private value: string;

  constructor(initial: string = "") {
    this.value = initial;
  }

  // Real methods that exist
  append(text: string): ChainableString {
    this.value += text;
    return this;
  }

  prepend(text: string): ChainableString {
    this.value = text + this.value;
    return this;
  }

  toString(): string {
    return this.value;
  }
}

const createChainableProxy = <T extends object>(target: T): T => {
  const proxy = new Proxy(target, {
    get(obj, prop) {
      const value = obj[prop as keyof typeof obj];

      if (typeof value === "function") {
        return (...args: any[]) => {
          const result = value.apply(obj, args);
          return result === obj ? proxy : result;
        };
      }

      return (...args: any[]) => {
        console.log(`Chaining: ${String(prop)}(${args.join(", ")})`);
        return proxy;
      };
    },
  });

  return proxy;
};

const chainable = createChainableProxy(new ChainableString("Hello"));

console.log("\n=== Method Chaining Test ===");
const result = chainable
  .append(" World")
  //@ts-ignore
  .makeUpperCase() // Doesn't exist, but chains anyway
  .addEmoji("🎉") // Doesn't exist, but chains anyway
  .prepend(">>> ")
  .toString();

console.log("Final result:", result);

/// Observable objects

type ListenerCallback = <T, TProp extends keyof T>(
  newVal: T[TProp],
  oldValue: T[TProp]
) => void;

type OnListener<T> = <TProp extends keyof T>(
  prop: TProp,
  cb: ListenerCallback
) => void;

const createObservable = <T extends object>(
  obj: T
): T & { on: OnListener<T> } => {
  const listeners = new Map<string, ListenerCallback[]>();

  return new Proxy(obj, {
    set(_, prop, newVal) {
      const oldVal = obj[prop as keyof typeof obj];
      obj[prop as keyof typeof obj] = newVal;

      const propListeners = listeners.get(String(prop));

      if (propListeners) {
        propListeners.forEach((callback) => callback(newVal, oldVal));
      }

      return true;
    },
    get(obj, prop) {
      if (prop === "on") {
        return (propName: string, callback: ListenerCallback) => {
          const currentCallbacks = listeners.get(propName);
          listeners.set(propName, [...(currentCallbacks || []), callback]);
        };
      }
      return obj[prop as keyof typeof obj];
    },
  }) as ReturnType<typeof createObservable<T>>;
};

const user = createObservable({ name: "Alice", age: 30 });

user.on("age", (curr, prev) => {
  console.log(curr, prev);
});

user.on("age", (curr, prev) => {
  console.log("another age listener");
});

user.age = 40;
