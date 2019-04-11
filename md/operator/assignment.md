# `=` between a variable and a value assigns value to the variable

This makes `fruit` to represent value of `"apple"` which is of type of `string`.

```javascript
let fruit;
fruit = "apple";
```

Left side of an assignment can be more complex expression.

```javascript
const fruit = {};
// assign "apple" to a objects property: name
fruit.name = "apple"; // fruit is now { name: "apple" }
```

```javascript
const fruits = [];
// assign "apple" to an array item slot at index 0
fruits[0] = "apple"; // fruits is now ["apple"]
```

Left side must always point to a variable, property, array item that is modifiable.

```javascript
function xy() {
  return { x: 0, y: 0 };
}
//
// ❌ Left side indicates function result
// Function result can be set only inside a function
// so it is not modifiable outside of it
xy() = { x: 1, y: 0 };
//
// ✔️ Left side points to a property of an object
// returned by xy function
xy().x = 1
```
