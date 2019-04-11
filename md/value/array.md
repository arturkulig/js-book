# Arrays are collection of values labeled with an integer

This is an array of strings.

```javascript
["orange", "apple", "grape"];
```

Each item has a position, which we call an index.
Index is a number.
Indexes start with 0.

```javascript
[
  "orange", // first item, index 0
  "apple", // second item, index 1
  "grape" // third item, index 2
];
```

To get an element at specific position you succeed the array (or a variable that represents an array) with a brackets and a number (or a variable with a number) between them.

```javascript
let result;
// this is the same as...
result = ["orange", "apple", "grape"][1];
//
const a = ["orange", "apple", "grape"];
const i = 1;
// ...this
result = a[i];
```

---

[#](./object.md)
