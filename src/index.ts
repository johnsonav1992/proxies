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
